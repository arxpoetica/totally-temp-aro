/**
 * Directive to load map data in the form of tiles
 */
'use strict'

// Browserify includes
var Rx = require('rxjs')
var pointInPolygon = require('point-in-polygon')
var AsyncPriorityQueue = require('async').priorityQueue

// Gets the tile id for given zoom and coords. Useful for setting div ids and cache keys
const getTileId = (zoom, tileX, tileY) => {
  return `mapTile_${zoom}_${tileX}_${tileY}`
}

class MapTileRenderer {

  constructor(tileSize, tileDataService, mapTileOptions, selectedLocations, selectedServiceAreas, selectedAnalysisArea,
              selectedCensusBlockId, censusCategories, selectedCensusCategoryId, selectedRoadSegment, selectedViewFeaturesByType,  
              selectedDisplayMode, analysisSelectionMode, displayModes, viewModePanels, state, configuration, uiNotificationService, getPixelCoordinatesWithinTile, mapLayers = []) {
    this.tileSize = tileSize
    this.tileDataService = tileDataService
    this.mapLayers = mapLayers
    this.mapLayersByZ = []
    this.mapTileOptions = mapTileOptions
    this.tileVersions = {}
    this.selectedLocations = selectedLocations // ToDo: generalize the selected arrays
    this.selectedServiceAreas = selectedServiceAreas 
    this.selectedAnalysisArea = selectedAnalysisArea
    this.selectedRoadSegment = selectedRoadSegment
    this.selectedDisplayMode = selectedDisplayMode
    this.analysisSelectionMode = analysisSelectionMode
    this.selectedCensusBlockId = selectedCensusBlockId
    this.censusCategories = censusCategories
    this.selectedCensusCategoryId = selectedCensusCategoryId
    this.selectedViewFeaturesByType = selectedViewFeaturesByType
    this.displayModes = displayModes
    this.viewModePanels = viewModePanels
    this.configuration = configuration
    this.uiNotificationService = uiNotificationService
    this.getPixelCoordinatesWithinTile = getPixelCoordinatesWithinTile
    this.renderBatches = []
    this.isRendering = false

    const MAX_CONCURRENT_VECTOR_TILE_RENDERS = 5
    this.tileRenderThrottle = new AsyncPriorityQueue((task, callback) => {
      // We expect 'task' to be a promise. Call the callback after the promise resolves or rejects.
      task()
        .then((result) => callback())
        .catch((err) => callback())
    }, MAX_CONCURRENT_VECTOR_TILE_RENDERS)
    this.latestTileRenderPriority = Number.MAX_SAFE_INTEGER

    this.modificationTypes = Object.freeze({
      UNMODIFIED: 'UNMODIFIED',
      ORIGINAL: 'ORIGINAL',
      MODIFIED: 'MODIFIED',
      DELETED: 'DELETED'
    })
    
    this.getActiveViewModePanel = () =>{
      return state.activeViewModePanel
    }
    
    // Define a drawing margin in pixels. If we draw a circle at (0, 0) with radius 10,
    // part of it is going to get clipped. To overcome this, we add to our tile size.
    // So a 256x256 tile with margin = 10, becomes a 276x276 tile. The draw margin should
    // be such that the largest rendered feature (or heatmap) does not get clipped.
    //this.drawMargins = 10
    this.drawMargins = 20
  }
  
  // ToDo: Maybe we could maybe generalize the repeated code below along with the subscriptions further down 
  
  // Sets the global tile options
  setMapTileOptions(mapTileOptions) {
    this.mapTileOptions = mapTileOptions
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected location ids
  setselectedLocations(selectedLocations) {
    this.selectedLocations = selectedLocations
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected service area ids for analysis
  setselectedServiceAreas(selectedServiceAreas) {
    this.selectedServiceAreas = selectedServiceAreas
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected service area id to view details
  setselectedServiceArea(selectedServiceArea) {
    this.selectedServiceArea = selectedServiceArea
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected analysis area id to view details
  setselectedAnalysisArea(selectedAnalysisArea) {
    this.selectedAnalysisArea = selectedAnalysisArea
    this.tileDataService.markHtmlCacheDirty()
  }
  
  //Sets the selected Census Block ids
  setSelectedCensusBlockId(selectedCensusBlockId) {
    this.selectedCensusBlockId = selectedCensusBlockId
    this.tileDataService.markHtmlCacheDirty()
  }
  
  setSelectedCensusCategoryId(selectedCensusCategoryId) {
    this.selectedCensusCategoryId = selectedCensusCategoryId
    this.tileDataService.markHtmlCacheDirty()
  }
  
  setCensusCategories(censusCategories) {
    this.censusCategories = censusCategories
    this.tileDataService.markHtmlCacheDirty()
  }
  
  // Sets the selected Road Segment ids
  setSelectedRoadSegment(selectedRoadSegment) {
    this.selectedRoadSegment = selectedRoadSegment
    this.tileDataService.markHtmlCacheDirty()
  }
  
  setSelectedViewFeaturesByType(selectedViewFeaturesByType) {
    this.selectedViewFeaturesByType = selectedViewFeaturesByType
    this.tileDataService.markHtmlCacheDirty()
  }
  
  // Sets the selected display mode
  setselectedDisplayMode(selectedDisplayMode) {
    this.selectedDisplayMode = selectedDisplayMode
    this.tileDataService.markHtmlCacheDirty()
  }
  
  // Sets the selected analysis selection type
  setAnalysisSelectionMode(analysisSelectionMode) {
    this.analysisSelectionMode = analysisSelectionMode
    this.tileDataService.markHtmlCacheDirty()
  }
  
  // ToDo: move this to a place of utility functions
  // utility function NOTE: will apply default val to source object items
  getOrderedKeys(obj, orderPram, defaultVal){
    let orderedArr = Object.keys(obj)
    orderedArr.sort(function (a, b) {
	  let aObj = obj[a]
	  let bObj = obj[b]
	    
	  if ( !aObj.hasOwnProperty(orderPram) || isNaN(aObj[orderPram]) ){ aObj[orderPram] = defaultVal }
	  if ( !bObj.hasOwnProperty(orderPram) || isNaN(bObj[orderPram]) ){ bObj[orderPram] = defaultVal }
	  
      return aObj[orderPram] - bObj[orderPram];
    });
    
    return orderedArr;
  }
  
  // Sets the map layers for this renderer
  setMapLayers(mapLayers) {
    // Check if any of the map layers have changed. JSON.stringify() doesn't work because the order may be different
    var layersChanged = false
    Object.keys(this.mapLayers).forEach((oldMapLayerKey) => {
      if (!mapLayers[oldMapLayerKey]) {
        // Old map layer key does not exist in new map layers, so layers have changed
        layersChanged = true
      } else if (JSON.stringify(this.mapLayers[oldMapLayerKey]) !== JSON.stringify(mapLayers[oldMapLayerKey])) {
        // The contents of this map layer have changed
        layersChanged = true
      }
    })
    Object.keys(mapLayers).forEach((newMapLayerKey) => {
      if (!this.mapLayers[newMapLayerKey]) {
        // New map layer key doees not exist in old map layers, so layers have changed
        layersChanged = true
      }
    })
    
    if (layersChanged) {
      this.tileDataService.markHtmlCacheDirty()
      // order by zIndex for drawing in proper stacking order 
      this.mapLayersByZ = this.getOrderedKeys(mapLayers, 'zIndex', 0) // ToDo: replace 0 with var for default zIndex
    }
    
    this.mapLayers = mapLayers  // Set the object in any case (why? this should go in the above if)
    
    // Set the map layers in the data service too, so that we can download all layer data in a single call
    this.tileDataService.setMapLayers(mapLayers)
  }

  // Redraws cached tiles with the specified tile IDs
  redrawCachedTiles(tiles) {
    tiles.forEach((tile) => {
      var tileId = getTileId(tile.zoom, tile.x, tile.y)
      var cachedTile = this.tileDataService.tileHtmlCache[tileId]
      if (cachedTile) {
        var coord = { x: tile.x, y: tile.y }
        this.tileRenderThrottle.push(() => this.renderTile(tile.zoom, coord, cachedTile), --this.latestTileRenderPriority)
      }
    })
  }

  // Creates a tile canvas element
  createTileCanvas(ownerDocument) {
    var canvas = ownerDocument.createElement('canvas');
    var borderWidth = 0
    canvas.width = this.tileSize.width + this.drawMargins * 2;
    canvas.height = this.tileSize.height + this.drawMargins * 2;
    return canvas
  }

  // This method is called by Google Maps. Render a canvas tile and send it back.
  getTile(coord, zoom, ownerDocument) {
    // We create a div with a parent canvas. This is because the canvas needs to have its top-left
    // corner offset by the margin. If we just use canvas, google maps sets the top-left to (0, 0)
    // regardless of what we give in the style.left/style.top properties
    var tileId = getTileId(zoom, coord.x, coord.y)
    var div = null, frontBufferCanvas = null, backBufferCanvas = null, heatmapCanvas = null
    var htmlCache = this.tileDataService.tileHtmlCache[tileId]
    if (htmlCache) {
      div = htmlCache.div
      frontBufferCanvas = htmlCache.frontBufferCanvas
      backBufferCanvas = htmlCache.backBufferCanvas
      heatmapCanvas = htmlCache.heatmapCanvas
    } else {
      div = ownerDocument.createElement('div')
      div.id = tileId
      var frontBufferCanvas = this.createTileCanvas(ownerDocument)
      div.appendChild(frontBufferCanvas)
      frontBufferCanvas.style.position = 'absolute'
      var borderWidth = 0
      if (this.mapTileOptions.showTileExtents) {
        borderWidth = 2
      }
      frontBufferCanvas.style.left = `-${this.drawMargins + borderWidth}px`
      frontBufferCanvas.style.top = `-${this.drawMargins + borderWidth}px`
      backBufferCanvas = this.createTileCanvas(ownerDocument)
      heatmapCanvas = this.createTileCanvas(ownerDocument)
      this.tileDataService.tileHtmlCache[tileId] = {
        div: div,
        frontBufferCanvas: frontBufferCanvas,
        backBufferCanvas: backBufferCanvas,
        heatmapCanvas: heatmapCanvas,
        isDirty: true,
        zoom: zoom,
        coord: coord
      }
    }

    // Why use a timeout? This function (getTile()) is called by the Google Maps API on zoom or pan.
    // Rendering the tile right away will render with the current value of this.mapLayers.
    // The app may also change this.mapLayers and re-render when when zoom changes (e.g. to start dissolving fibers).
    // If this happens, we will see a "flicker", when the old layers are rendered followed by the new ones.
    // If we don't render the tile at all from here, that won't work because this.mapLayers may not change
    // (e.g. if we are simply panning and not zoom) and the system may not render the new tiles at all.
    // So, we use a timeout - If the app renders tiles, then this.renderTile() won't do anything as the dirty
    // flag on the tile will be reset by the app render. But if the app does not render tiles, then
    // the tiles will still be rendered, although with a delay (specified in setTimeout())
    var RENDER_TIMEOUT_MILLISECONDS = 100
    // Store the HTML cache object. The object referred to by this.tileDataService.tileHtmlCache[tileId] can
    // change between now and when the full tile is rendered. We do not want to set the dirty flag on a different object.
    var htmlCache = this.tileDataService.tileHtmlCache[tileId]
    setTimeout(() => {
      this.tileRenderThrottle.push(() => this.renderTile(zoom, coord, htmlCache), --this.latestTileRenderPriority)
    }, RENDER_TIMEOUT_MILLISECONDS)
    return div
  }

  // Renders all data for this tile
  renderTile(zoom, coord, htmlCache) {
    const tileId = `${zoom}-${coord.x}-${coord.y}`

    // This render for this tile will have a "version". This is because we can have multiple refreshes
    // requested one after the other, and sometimes the data for an older tile comes in after the data
    // for a newer tile, and the older data is rendered over the newer data. To get around this, at the
    // point where we do the actual drawing (see below), we will check to see if the version we are
    // rendering is the latest. If not, then we will skip rendering
    if (!this.tileVersions.hasOwnProperty(tileId)) {
      this.tileVersions[tileId] = 0
    }
    const currentTileVersion = this.tileVersions[tileId] + 1
    this.tileVersions[tileId] = currentTileVersion

    var renderingData = {}, globalIndexToLayer = {}, globalIndexToIndex = {}
    var singleTilePromises = []
    	this.mapLayersByZ.forEach((mapLayerKey, index) => {
      // Initialize rendering data for this layer
      var mapLayer = this.mapLayers[mapLayerKey]
      var numNeighbors = (mapLayer.renderMode === 'HEATMAP') ? 1 : 0
      renderingData[mapLayerKey] = {
        numNeighbors: numNeighbors,
        dataPromises: [],
        data: [],
        entityImages: [],
        dataOffsets: []
      }

      for (var deltaY = -numNeighbors; deltaY <= numNeighbors; ++deltaY) {
        for (var deltaX = -numNeighbors; deltaX <= numNeighbors; ++deltaX) {
          renderingData[mapLayerKey].dataOffsets.push({
            x: deltaX * this.tileSize.width,
            y: deltaY * this.tileSize.height
          })
          var xTile = coord.x + deltaX
          var yTile = coord.y + deltaY
          var singleTilePromise = this.tileDataService.getTileData(mapLayer, zoom, xTile, yTile)
          singleTilePromises.push(singleTilePromise)
          renderingData[mapLayerKey].dataPromises.push(singleTilePromise)
          var globalIndex = singleTilePromises.length - 1
          var localIndex = renderingData[mapLayerKey].dataPromises.length - 1
          globalIndexToIndex[globalIndex] = localIndex
          globalIndexToLayer[globalIndex] = mapLayerKey
        }
      }
    })
    singleTilePromises.push(this.tileDataService.getEntityImageForLayer('SELECTED_LOCATION'))
    singleTilePromises.push(this.tileDataService.getEntityImageForLayer(this.tileDataService.LOCK_ICON_KEY))
    
    this.uiNotificationService.addNotification('main', 'rendering tiles')
    // Get all the data for this tile
    return Promise.all(singleTilePromises)
      .then((singleTileResults) => {
        var lockOverlayImage = singleTileResults.splice(singleTileResults.length - 1)
        var selectedLocationImage = singleTileResults.splice(singleTileResults.length - 1)

        // Reconstruct rendering data
        singleTileResults.forEach((singleTileResult, index) => {
          var mapLayerKey = globalIndexToLayer[index]
          var dataIndex = globalIndexToIndex[index]
          renderingData[mapLayerKey].data[dataIndex] = singleTileResult
        })
        // We have all the data. Now check the dirty flag. The next call (where we render features)
        // MUST be synchronous for this to work correctly
        const isLatestVersion = (this.tileVersions[tileId] === currentTileVersion)
        if (htmlCache && htmlCache.isDirty && isLatestVersion) {
          htmlCache.backBufferCanvas.getContext('2d').clearRect(0, 0, htmlCache.backBufferCanvas.width, htmlCache.backBufferCanvas.height)
          htmlCache.heatmapCanvas.getContext('2d').clearRect(0, 0, htmlCache.heatmapCanvas.width, htmlCache.heatmapCanvas.height)
          this.renderSingleTileFull(zoom, coord, renderingData, selectedLocationImage, lockOverlayImage, htmlCache.backBufferCanvas, htmlCache.heatmapCanvas)

          // Copy the back buffer image onto the front buffer
          var ctx = htmlCache.frontBufferCanvas.getContext('2d')
          ctx.clearRect(0, 0, htmlCache.frontBufferCanvas.width, htmlCache.frontBufferCanvas.height)
          ctx.drawImage(htmlCache.backBufferCanvas, 0, 0)
          // All rendering has been done. Mark the cached HTML tile as not-dirty
          // Do NOT use this.tileDataService.tileHtmlCache[tileId], that object reference may have changed
          htmlCache.isDirty = false
        }
        return Promise.resolve()
      })
      .catch((err) => {
        console.error(err)
        this.uiNotificationService.removeNotification('main', 'rendering tiles')
      })
      .then(() => {
        this.uiNotificationService.removeNotification('main', 'rendering tiles')
        return Promise.resolve()
      })
  }

  // Renders a single layer on a tile
  renderSingleTileFull(zoom, coord, renderingData, selectedLocationImage, lockOverlayImage, canvas, heatmapCanvas) {
    var ctx = canvas.getContext('2d')
    ctx.lineWidth = 1
    var heatMapData = []

    // Render all features
    Object.keys(renderingData).forEach((mapLayerKey) => {
      var mapLayer = this.mapLayers[mapLayerKey]
      if (mapLayer) { // Its possible that this.mapLayers has changed until we reach this point
        renderingData[mapLayerKey].data.forEach((featureData, index) => {
          var features = []
          Object.keys(featureData.layerToFeatures).forEach((layerKey) => features = features.concat(featureData.layerToFeatures[layerKey]))
          this.renderFeatures(ctx, zoom, coord, features, featureData, selectedLocationImage, lockOverlayImage, renderingData[mapLayerKey].dataOffsets[index], heatMapData, this.mapTileOptions.selectedHeatmapOption.id, mapLayer)
        })
      }
    })

    if (heatMapData.length > 0 && this.mapTileOptions.selectedHeatmapOption.id === 'HEATMAP_ON') {
      // Note that we render the heatmap to another canvas, then copy that image over to the main canvas. This
      // is because the heatmap library clears the canvas before rendering
      var heatmapCtx = heatmapCanvas.getContext('2d')
      heatmapCtx.globalAlpha = 1.0
      var heatMapRenderer = simpleheat(heatmapCanvas)
      heatMapRenderer.data(heatMapData)
      var maxValue = 1.0
      if (this.mapTileOptions.heatMap.useAbsoluteMax) {
        // Simply use the maximum value for the heatmap
        maxValue = this.mapTileOptions.heatMap.maxValue
      } else {
        // We have an input from the user specifying the max value at zoom level 1. Find the max value at our zoom level
        maxValue = this.mapTileOptions.heatMap.worldMaxValue / Math.pow(2.0, zoom)
      }
      heatMapRenderer.max(maxValue)
      heatMapRenderer.radius(20, 20)
      heatMapRenderer.draw(0.0)
      heatmapCtx.clearRect(0, 0, this.tileSize.width + this.drawMargins * 2, this.drawMargins)
      heatmapCtx.clearRect(0, this.tileSize.height + this.drawMargins, this.tileSize.width + this.drawMargins * 2, this.drawMargins)
      heatmapCtx.clearRect(0, 0, this.drawMargins, this.tileSize.height + this.drawMargins * 2)
      heatmapCtx.clearRect(this.tileSize.width + this.drawMargins, 0, this.drawMargins, this.tileSize.height + this.drawMargins * 2)
      // Draw the heatmap onto the main canvas
      ctx.drawImage(heatmapCanvas, 0, 0)
    }
    var tileCoordinateString = `z / x / y : ${zoom} / ${coord.x} / ${coord.y}`
    this.renderTileInformation(canvas, ctx, tileCoordinateString)
  }

  // Render tile information
  renderTileInformation(canvas, ctx, tileCoordinateString) {
    if (this.mapTileOptions.showTileExtents) {
      ctx.globalAlpha = 1.0   // The heat map renderer may have changed this
      // Draw a rectangle showing the tile margins
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.strokeRect(0, 0, this.tileSize.width + this.drawMargins * 2, this.tileSize.height + this.drawMargins * 2)
      // Draw a rectangle showing the tile (not the margins)
      ctx.setLineDash([])
      ctx.strokeRect(this.drawMargins, this.drawMargins, this.tileSize.width, this.tileSize.height)
      // Show the tile coordinates that we pass to aro-service
      ctx.fillStyle = '#000000'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.font = "15px Arial"
      ctx.textAlign="center"
      ctx.textBaseline = "middle"
      ctx.strokeText(tileCoordinateString, canvas.width / 2, canvas.height /2)
      ctx.fillText(tileCoordinateString, canvas.width / 2, canvas.height /2)
    }
  }

  shouldRenderFeature(feature) {
    if (!feature.properties) {
      return true
    } else if (feature.properties._data_type && feature.properties._data_type.split('.')[0] === 'equipment') {
      // For now, just hide equipment features that are Planned and Deleted
      return (!feature.properties.deployment_type
        || (feature.properties.deployment_type === 1)
        || (feature.properties.is_deleted !== 'true'))
    } else {
      // For all other features, do not display if the is_deleted flag is true
      return feature.properties.is_deleted !== 'true'
    }
  }

  // Render a set of features on the map
  renderFeatures(ctx, zoom, tileCoords, features, featureData, selectedLocationImage, lockOverlayImage, geometryOffset, heatMapData, heatmapID, mapLayer) {
    ctx.globalAlpha = 1.0
    for (var iFeature = 0; iFeature < features.length; ++iFeature) {
      // Parse the geometry out.
      var feature = features[iFeature]

      if (!this.shouldRenderFeature(feature)) {
        continue
      }

      if (feature.properties) {
        // Try object_id first, else try location_id
        var featureId = feature.properties.object_id || feature.properties.location_id  
        
        if (this.selectedDisplayMode == this.displayModes.EDIT_PLAN 
            && this.tileDataService.featuresToExclude.has(featureId)
            && !(feature.properties._data_type && feature.properties._data_type == "location") ) {
          // This feature is to be excluded. Do not render it. (edit: ONLY in edit mode)
          continue
        }
        if (this.selectedDisplayMode == this.displayModes.VIEW 
            &&this.getActiveViewModePanel() == this.viewModePanels.EDIT_LOCATIONS
            && this.tileDataService.featuresToExclude.has(featureId) 
            && feature.properties._data_type && feature.properties._data_type == "location"){
          // this is a location that is being edited
          continue
        }
      }
      
      var selectedListType = null 
      var selectedListId = null 
      var entityImage = featureData.icon
      if (feature.properties.hasOwnProperty('_data_type') && "" != feature.properties._data_type){
        var fullDataType = feature.properties._data_type + '.'
        selectedListType = fullDataType.substr(0, fullDataType.indexOf('.'))
        if (feature.properties.hasOwnProperty('location_id')) {
          selectedListId = feature.properties.location_id
        } else if (feature.properties.hasOwnProperty('object_id')) {
          selectedListId = feature.properties.object_id
        } else if ( feature.properties.hasOwnProperty('id') ){
          selectedListId = feature.properties.id
          //greyout an RT with hsiEanbled true for frontier client
          if(config.ARO_CLIENT === 'frontier' && 
            (feature.properties._data_type === 'equipment.central_office' || feature.properties._data_type === 'equipment.dslam' )
            && (feature.properties.hsiEnabled !== 'true')) {
            entityImage = featureData.greyOutIcon
          }
        } 
      }
      
      var geometry = feature.loadGeometry()
      // Geometry is an array of shapes
      var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
      var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0
      geometry.forEach((shape) => {
        // Shape is an array of coordinates
        if (1 == shape.length) {
  	      // This is a point
  	      var x = this.drawMargins + shape[0].x + geometryOffset.x - imageWidthBy2
  	      var y = this.drawMargins + shape[0].y + geometryOffset.y - (imageHeightBy2 * 2)
          
  	      //Draw the location icons with its original color
  	      ctx.globalCompositeOperation = 'source-over'
  	      if (heatmapID === 'HEATMAP_OFF' || heatmapID === 'HEATMAP_DEBUG' || mapLayer.renderMode === 'PRIMITIVE_FEATURES') {
  	        // Display individual locations. Either because we are zoomed in, or we want to debug the heatmap rendering
  	        if (feature.properties.location_id && this.selectedLocations.has(+feature.properties.location_id)
  	          //show selected location icon at analysis mode -> selection type is locations    
  	            && this.selectedDisplayMode == this.displayModes.ANALYSIS && this.analysisSelectionMode == "SELECTED_LOCATIONS" ) {
  	          // Draw selected icon
  	          ctx.drawImage(selectedLocationImage[0], x, y)
  	        }else if((this.selectedDisplayMode == this.displayModes.VIEW || this.selectedDisplayMode == this.displayModes.EDIT_PLAN) // for edit mode view of existing 
  	                 && null != selectedListId 
  	                 && null != selectedListType
  	                 && this.selectedViewFeaturesByType.hasOwnProperty(selectedListType) 
  	                 && this.selectedViewFeaturesByType[selectedListType].hasOwnProperty(selectedListId) 
  	                ){
  	          // - Highlight this feature - //
  	          ctx.fillStyle='#e8ffe8'
  	          ctx.strokeStyle = '#008000'
  	          ctx.lineWidth = 2
  	          //ctx.fillRect(x,y,entityImage.width,entityImage.height)
  	          ctx.beginPath();
  	          var halfWidth = 0.5*entityImage.width
  	          ctx.arc(x+halfWidth, y+(0.5*entityImage.height), halfWidth+4, 0, 2 * Math.PI);
  	          ctx.fill();
  	          ctx.stroke();
  	          
  	          ctx.drawImage(entityImage, x, y) 
  	        } else {
              const originalAlpha = ctx.globalAlpha
              const modificationType = this.getModificationTypeForFeature(zoom, tileCoords, shape[0].x + geometryOffset.x, shape[0].y + geometryOffset.y, feature)
              if (modificationType === this.modificationTypes.ORIGINAL || modificationType === this.modificationTypes.DELETED) {
                ctx.globalAlpha = 0.5
              }
              ctx.drawImage(entityImage, x, y)
              ctx.globalAlpha = originalAlpha
            }
            const modificationType = this.getModificationTypeForFeature(zoom, tileCoords, shape[0].x + geometryOffset.x, shape[0].y + geometryOffset.y, feature)
            const overlaySize = 12
            this.renderModificationOverlay(ctx, x + entityImage.width - overlaySize, y, overlaySize, overlaySize, modificationType)

            // Draw lock overlay if required
            if (feature.properties.is_locked) {
              ctx.drawImage(lockOverlayImage[0], x - 4, y - 4)
            }
  	      } else {
  	        // Display heatmap
  	        var aggregationProperty = feature.properties.entity_count || feature.properties.weight
  	        if (aggregationProperty) {
  	          var adjustedWeight = Math.pow(+aggregationProperty, this.mapTileOptions.heatMap.powerExponent)
  	          heatMapData.push([x, y, adjustedWeight])
  	        }
  	      }  
        }else{
          // Check if this is a closed polygon
          var firstPoint = shape[0]
          var lastPoint = shape[shape.length - 1]
          var isClosedPolygon = (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y)

          if (isClosedPolygon) {
            var selectedEquipments = []
            Object.keys(this.configuration.networkEquipment.equipments).forEach((categoryItemKey) => {
              var networkEquipment = this.configuration.networkEquipment.equipments[categoryItemKey]
              networkEquipment.checked && selectedEquipments.push(networkEquipment.networkNodeType)
            })

            // First draw a filled polygon with the fill color
            //show siteboundaries for the equipments that are selected
            if((feature.properties && _.has(feature.properties,'network_node_type')
              && (_.indexOf(selectedEquipments,feature.properties.network_node_type) > -1)) 
              || (!_.has(feature.properties,'network_node_type')) ) {
                this.renderPolygonFeature(feature, shape, geometryOffset, ctx, mapLayer)
                ctx.globalAlpha = 1.0
            } else {
              return
            }
          } else {
            // This is not a closed polygon. Render lines only
            ctx.globalAlpha = 1.0
            if (this.selectedRoadSegment.size > 0 && 
              [...this.selectedRoadSegment].filter(function (road) {
                 return road.gid === feature.properties.gid
              }).length > 0) {
              //Highlight the selected Selected RoadSegments
              var drawingStyles = {
                lineWidth: mapLayer.highlightStyle.lineWidth,
                strokeStyle: mapLayer.highlightStyle.strokeStyle
              }
              this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles, false)
            } else {
              this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, false)
            }
          }
            
        }
      })
    }
  }

  // Gets the modification type for a given feature
  getModificationTypeForFeature(zoom, tileCoords, shapeX, shapeY, feature) {
    // If this feature is a "modified feature" then add an overlay. (Its all "object_id" now, no "location_id" anywhere)
    var modificationType = this.modificationTypes.UNMODIFIED
    if (this.tileDataService.modifiedFeatures.hasOwnProperty(feature.properties.object_id)) {
      const modifiedFeature = this.tileDataService.modifiedFeatures[feature.properties.object_id]
      if (modifiedFeature.deleted) {
        modificationType = this.modificationTypes.DELETED
      } else {
        modificationType = this.modificationTypes.ORIGINAL
        const modifiedFeatureCoord = modifiedFeature.geometry.coordinates
        var pixelCoords = this.getPixelCoordinatesWithinTile(zoom, tileCoords, modifiedFeatureCoord[1], modifiedFeatureCoord[0])
        const pixelTolerance = 3
        if ((Math.abs(pixelCoords.x - shapeX) < pixelTolerance) && (Math.abs(pixelCoords.y - shapeY) < pixelTolerance)) {
          modificationType = this.modificationTypes.MODIFIED
        }
      }
    }
    return modificationType
  }

  // Renders a "modification" overlay over a feature icon
  renderModificationOverlay(ctx, x, y, width, height, modificationType) {

    if (modificationType === this.modificationTypes.UNMODIFIED) {
      return  // Unmodified feature, nothing to do
    }

    var overlayText = ''
    switch (modificationType) {
      case this.modificationTypes.ORIGINAL: overlayText = 'O'; break;
      case this.modificationTypes.MODIFIED: overlayText = 'M'; break;
      case this.modificationTypes.DELETED: overlayText = 'D'; break;
    }

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.fill()
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.font = '9px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText(overlayText, x + width / 2, y + height / 2)
 }
  

  // Renders a polyline feature onto the canvas
  renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles, isPolygonBorder) {

    const oldOpacity = ctx.globalAlpha
    if (drawingStyles.lineOpacity) {
      ctx.globalAlpha = drawingStyles.lineOpacity
    }

    ctx.strokeStyle = drawingStyles ? drawingStyles.strokeStyle : mapLayer.strokeStyle
    ctx.lineWidth = drawingStyles ? drawingStyles.lineWidth : (mapLayer.lineWidth || 1)

    var xPrev = shape[0].x + geometryOffset.x
    var yPrev = shape[0].y + geometryOffset.y
    ctx.beginPath()
    ctx.moveTo(this.drawMargins + xPrev, this.drawMargins + yPrev)
    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
      var xNext = shape[iCoord].x + geometryOffset.x
      var yNext = shape[iCoord].y + geometryOffset.y
      var shouldRenderLine = true
      // ONLY for polygon borders, skip rendering the line segment if it is along the tile extents.
      // Without this, polygons that are clipped (like 5G boundaries) will have internal lines.
      if (isPolygonBorder) {
        var isAlongXMin = (xPrev === 0 && xNext === 0)
        var isAlongXMax = (xPrev === this.tileSize.width && xNext === this.tileSize.width)
        var isAlongYMin = (yPrev === 0 && yNext === 0)
        var isAlongYMax = (yPrev === this.tileSize.height && yNext === this.tileSize.height)
        shouldRenderLine = !isAlongXMin && !isAlongXMax && !isAlongYMin && !isAlongYMax
      }
      if (shouldRenderLine) {
        // Segment is not along the tile extents. Draw it. We do this because polygons can be
        // clipped by the tile extents, and we don't want to draw segments along tile extents.
        ctx.lineTo(this.drawMargins + xNext, this.drawMargins + yNext)
      }
      xPrev = xNext
      yPrev = yNext
      ctx.moveTo(this.drawMargins + xPrev, this.drawMargins + yPrev)
    }
    ctx.stroke()

    // Draw the polyline direction if the map options specify it
    if (mapLayer.showPolylineDirection) {
      this.drawPolylineDirection(shape, ctx, ctx.strokeStyle)
    }

    ctx.globalAlpha = oldOpacity
  }

  // Draws an arrow showing the direction of a polyline
  drawPolylineDirection(shape, ctx, strokeStyle) {
    if (shape.length <= 1) {
      return // Nothing to do
    }

    // Find the length of the polyline
    var polylineLength = 0.0
    var segmentLengths = []
    for (var iCoord = 0; iCoord < shape.length - 1; ++iCoord) {
      const deltaX = shape[iCoord + 1].x - shape[iCoord].x
      const deltaY = shape[iCoord + 1].y - shape[iCoord].y
      const segmentLength = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY))
      segmentLengths.push(segmentLength)
      polylineLength += segmentLength
    }

    const arrowLength = 5, arrowWidth = 5
    if (polylineLength < arrowLength * 2.0) {
      // Polyline is too small at this zoom level. Do not draw an arrow
      return
    }

    // Now travel along the polyline and find the point that is in the middle
    var xCenter = NaN, yCenter = NaN
    var currentSegment = 0, centerSegment = -1
    var remainingDistance = polylineLength / 2
    while (remainingDistance > 0 && currentSegment < segmentLengths.length) {
      if (segmentLengths[currentSegment] < remainingDistance) {
        remainingDistance -= segmentLengths[currentSegment]
        ++currentSegment
        continue
      }
      // The center point lies on this segment
      const fraction = remainingDistance / segmentLengths[currentSegment]
      const deltaX = shape[currentSegment + 1].x - shape[currentSegment].x
      const deltaY = shape[currentSegment + 1].y - shape[currentSegment].y
      xCenter = this.drawMargins + shape[currentSegment].x + fraction * deltaX
      yCenter = this.drawMargins + shape[currentSegment].y + fraction * deltaY
      centerSegment = currentSegment
      ++currentSegment
      break
    }

    // Get the unit direction for the segment on which the center point lies
    const unitDirection = {
      x: (shape[centerSegment + 1].x - shape[centerSegment].x) / segmentLengths[centerSegment],
      y: (shape[centerSegment + 1].y - shape[centerSegment].y) / segmentLengths[centerSegment]
    }
    // Get the direction perpendicular to this unit direction
    const unitPerpendicularDirection = {
      x: -unitDirection.y,
      y: unitDirection.x
    }

    ctx.strokeStyle = strokeStyle
    ctx.beginPath()
    // Define the 3 points for the arrow. One at the tip, the other two at the bottom
    const pt1 = {
      x: xCenter + (unitDirection.x * arrowLength / 2),
      y: yCenter + (unitDirection.y * arrowLength / 2)
    }
    const pt2 = {
      x: xCenter - (unitDirection.x * arrowLength / 2) + (unitPerpendicularDirection.x * arrowWidth / 2),
      y: yCenter - (unitDirection.y * arrowLength / 2) + (unitPerpendicularDirection.y * arrowWidth / 2)
    }
    const pt3 = {
      x: xCenter - (unitDirection.x * arrowLength / 2) - (unitPerpendicularDirection.x * arrowWidth / 2),
      y: yCenter - (unitDirection.y * arrowLength / 2) - (unitPerpendicularDirection.y * arrowWidth / 2)
    }
    ctx.moveTo(pt1.x, pt1.y)
    ctx.lineTo(pt2.x, pt2.y)
    ctx.lineTo(pt3.x, pt3.y)
    ctx.lineTo(pt1.x, pt1.y)
    ctx.stroke()
  }

  // Renders a polygon feature onto the canvas
  renderPolygonFeature(feature, shape, geometryOffset, ctx, mapLayer) {
    
    ctx.lineCap = 'round';
    // Get the drawing styles for rendering the polygon
    var drawingStyles = this.getDrawingStylesForPolygon(feature, mapLayer)
    
    // ToDo: should this go into getDrawingStylesForPolygon?
    // ToDo: use an object merge of mapLayer.highlightStyle instead having to know which attributes are implemented
    // ToDo: need to ensure feature type 
    //    a non-selected service area could have the same id as the selected census block
    if ( feature.properties.hasOwnProperty('layerType') 
         && 'census_block' == feature.properties.layerType){
      if (this.selectedCensusBlockId == feature.properties.id){
        // Hilight selected census block
        drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
      }
      
    	  // check for census filters
      if ( 'undefined' != typeof this.selectedCensusCategoryId
           && feature.properties.tags.hasOwnProperty(this.selectedCensusCategoryId)){
        let tagId = feature.properties.tags[this.selectedCensusCategoryId]
        
        if (this.censusCategories[this.selectedCensusCategoryId].tags.hasOwnProperty(tagId)){
          let color = this.censusCategories[this.selectedCensusCategoryId].tags[tagId].colourHash
          drawingStyles.strokeStyle = color
          drawingStyles.fillStyle = color
        }
      }
      
    } else if (this.selectedServiceAreas.has(feature.properties.id)
         && this.selectedDisplayMode == this.displayModes.ANALYSIS 
         && this.analysisSelectionMode == "SELECTED_AREAS") {
    	  //Highlight the selected SA
    	  //highlight if analysis mode -> selection type is service areas 
    	  drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
      drawingStyles.fillStyle = mapLayer.highlightStyle.fillStyle
      drawingStyles.opacity = mapLayer.highlightStyle.opacity
      ctx.globalCompositeOperation = 'multiply'
    } else if (this.selectedServiceArea == feature.properties.id
      && this.selectedDisplayMode == this.displayModes.VIEW) {
      //Highlight the selected SA in view mode
      drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
      ctx.globalCompositeOperation = 'multiply'
    } else if (feature.properties.hasOwnProperty('_data_type')
      && 'analysis_area' === feature.properties._data_type
      && this.selectedAnalysisArea == feature.properties.id
      && this.selectedDisplayMode == this.displayModes.VIEW) {
      //Highlight the selected SA in view mode
      drawingStyles.lineWidth = mapLayer.highlightStyle.lineWidth
    }

    ctx.fillStyle = drawingStyles.fillStyle
    ctx.globalAlpha = drawingStyles.opacity

    // Draw a filled polygon with the drawing styles computed for this feature
    var x0 = this.drawMargins + geometryOffset.x + shape[0].x
    var y0 = this.drawMargins + geometryOffset.y + shape[0].y
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
      var x1 = this.drawMargins + geometryOffset.x + shape[iCoord].x
      var y1 = this.drawMargins + geometryOffset.y + shape[iCoord].y
      ctx.lineTo(x1, y1)
    }
    ctx.fill()

    //Make Line Border is highlighted
    ctx.globalAlpha = mapLayer.opacity || 0.7

    // Then draw a polyline except for the lines that are along the tile extents
    // Override the layers drawing styles by passing it through to the rendering function
    this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles, true)
  }

  // Computes the fill and stroke styles for polygon features
  getDrawingStylesForPolygon(feature, mapLayer) {

    // Set the default drawing styles that we will return in case we are not aggregating features
    var drawingStyles = {
      strokeStyle: mapLayer.strokeStyle,
      fillStyle: mapLayer.fillStyle,
      lineWidth: mapLayer.lineWidth || 1,
      lineOpacity: mapLayer.lineOpacity || 0.7,
      opacity: mapLayer.opacity || 0.7
    }

    // We have to calculate the fill and stroke styles based on the computed aggregate values of the feature
    var thresholdProperty = mapLayer.aggregateProperty
    var minPropertyValue = mapLayer.aggregateMinPalette || 0.0
    var maxPropertyValue = mapLayer.aggregateMaxPalette || 1.0
    var range = maxPropertyValue - minPropertyValue
    if (range === 0) {
      range = 1.0  // Prevent any divide-by-zeros
    }
    var valueToPlot = feature.properties[mapLayer.aggregateProperty]

    if (mapLayer.renderMode === 'AGGREGATE_OPACITY') {
      // Calculate the opacity at which we want to show this feature
      var minAlpha = 0.2, maxAlpha = 0.8
      var opacity = (valueToPlot - minPropertyValue) / range * (maxAlpha - minAlpha)
      opacity = Math.max(minAlpha, opacity)
      opacity = Math.min(maxAlpha, opacity)
      drawingStyles.opacity = opacity
    } else if (mapLayer.renderMode === 'AGGREGATE_GRADIENT') {
      // Calculate the color value at which we want to show this feature
      var scaledValue = (valueToPlot - minPropertyValue) / range
      scaledValue = Math.max(0, scaledValue)
      scaledValue = Math.min(1, scaledValue)
      var fillColor = { r: Math.round(scaledValue * 255), g: Math.round((1 - scaledValue) * 255), b: 0 }
      var componentToHex = (component) => {
        var retVal = component.toString(16)
        return (retVal.length === 1) ? '0' + retVal : retVal
      }
      drawingStyles.fillStyle = '#' + componentToHex(fillColor.r) + componentToHex(fillColor.g) + componentToHex(fillColor.b)
      var strokeColor = { r: Math.max(0, fillColor.r - 20), g: Math.max(0, fillColor.g - 20), b: Math.max(0, fillColor.b - 20) }
      drawingStyles.strokeStyle = '#' + componentToHex(strokeColor.r) + componentToHex(strokeColor.g) + componentToHex(strokeColor.b)
    }
    return drawingStyles
  }

  // Loops through all features in this tile and selects the ones that match a comparator function
  selectFeatures(tileZoom, tileX, tileY, shouldFeatureBeSelected) {

    // Build an array of promises that gets all map layer features (for the layers marked as selectable)
    var promises = []
    Object.keys(this.mapLayers).forEach((mapLayerKey) => {
      var mapLayer = this.mapLayers[mapLayerKey]
      if (mapLayer.selectable) {
        promises.push(this.tileDataService.getTileData(mapLayer, tileZoom, tileX, tileY))
      }
    })

    // Return a promise that resolves when all features have been tested
    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((promiseResults) => {
          var hitFeatures = []

          // Loop through all results
          promiseResults.forEach((result) => {
            var layerToFeatures = result.layerToFeatures

            // Loop through all layers in this result
            Object.keys(layerToFeatures).forEach((layerKey) => {
              var features = layerToFeatures[layerKey]
              for (var iFeature = 0; iFeature < features.length; ++iFeature) {
                var feature = features[iFeature]
                if (shouldFeatureBeSelected(feature, result.icon)) {
                  hitFeatures.push(feature.properties)
                }
              }
            })
          })
          // We have a list of features that are 'hit', i.e. under the specified point. Return them.
          resolve(hitFeatures)
        })
        .catch((err) => console.error(err))
    })
  }

  // Gets all features that are within a given polygon
  getPointsInPolygon(tileZoom, tileX, tileY, polygonCoords) {

    // Define a function that will return true if a given feature should be selected
    var shouldFeatureBeSelected = (feature, icon) => {
      var selectFeature = false
      var geometry = feature.loadGeometry()
      geometry.forEach((shape) => {
        if (shape.length === 1) {
          // Only support points for now
          var locationCoords = [shape[0].x, shape[0].y]
          if (pointInPolygon(locationCoords, polygonCoords)) {
            selectFeature = true
          }
        } else if (feature.properties.gid) {
          var roadGeom = feature.loadGeometry()[0];
          for (var i = 0; i < roadGeom.length; i++) {
            if (pointInPolygon([roadGeom[i].x, roadGeom[i].y], polygonCoords)) {
              selectFeature = true;
              break;
            }
            //Check the fiber start or end point is with in polygon
            //Skip all middle points and set to last point.
            i += roadGeom.length - 2;
          }
        } else if (feature.properties.code) {
          //Check the SA boundary inside the drew polygon 
          //This will be uses when draw the polygon with more than one SA. (With touch the SA boundary)
          feature.loadGeometry().forEach(function (areaGeom) {
            areaGeom.forEach(function (eachValue) {
              var eachPoint = []
              eachPoint.push(eachValue.x)
              eachPoint.push(eachValue.y)

              if (pointInPolygon(eachPoint, polygonCoords)) {
                selectFeature = true
                return
              }
            })
          })

          if(!selectFeature && feature.properties.code) {
            //Check the drew polygon coordinate inside SA boundary
            //This will be uses when draw the polygon with in one SA. (Without touch the SA boundary)
            feature.loadGeometry().forEach(function (areaGeom) {
              var areaPolyCoordinates = []

              areaGeom.forEach(function (eachValue) {
                var eachPoint = []
                eachPoint.push(eachValue.x)
                eachPoint.push(eachValue.y)
                areaPolyCoordinates.push(eachPoint)
              })

              polygonCoords.forEach(function (polyCoord) {
                if (pointInPolygon([polyCoord[0], polyCoord[1]], areaPolyCoordinates)) {
                  selectFeature = true
                  return
                }
              })
            })
          }
        }
      })
      return selectFeature
    }
    return this.selectFeatures(tileZoom, tileX, tileY, shouldFeatureBeSelected)
  }
  
  selectRoadSegment(feature, xWithinTile, yWithinTile, minimumRoadDistance) {

    var geometry = feature.loadGeometry()
    var distance

    // Ref: http://www.cprogramto.com/c-program-to-find-shortest-distance-between-point-and-line-segment
    var lineX1, lineY1, lineX2, lineY2, pointX, pointY;

    //Some road segments has more points
    for (var i = 0; i < geometry[0].length - 1; i++) {
      lineX1 = Object.values(geometry[0])[i].x //X1, Y1 are the first point of that line segment.
      lineY1 = Object.values(geometry[0])[i].y
  
      lineX2 = Object.values(geometry[0])[i+1].x //X2, Y2 are the end point of that line segment
      lineY2 = Object.values(geometry[0])[i+1].y

      pointX = xWithinTile  //pointX, pointY are the point of the reference point.
      pointY = yWithinTile

      distance = findDistanceToSegment(lineX1, lineY1, lineX2, lineY2, pointX, pointY)       //calling function to find the shortest distance

      if(distance <= minimumRoadDistance) {
        return true
      }
    }

    function findDistanceToSegment(x1, y1, x2, y2, pointX, pointY)
    {
        var diffX = x2 - x1
        var diffY = y2 - y1
        if ((diffX == 0) && (diffY == 0))
        {
            diffX = pointX - x1
            diffY = pointY - y1
            return Math.sqrt(diffX * diffX + diffY * diffY)
        }
    
        var t = ((pointX - x1) * diffX + (pointY - y1) * diffY) / (diffX * diffX + diffY * diffY)
    
        if (t < 0)
        {
            //point is nearest to the first point i.e x1 and y1
            diffX = pointX - x1
            diffY = pointY - y1
        }
        else if (t > 1)
        {
            //point is nearest to the end point i.e x2 and y2
            diffX = pointX - x2
            diffY = pointY - y2
        }
        else
        {
            //if perpendicular line intersect the line segment.
            diffX = pointX - (x1 + t * diffX)
            diffY = pointY - (y1 + t * diffY)
        }
    
        //returning shortest distance
        return Math.sqrt(diffX * diffX + diffY * diffY)
    }
  }

  // Perform hit detection on features and get the first one (if any) under the mouse
  performHitDetection(tileZoom, tileX, tileY, xWithinTile, yWithinTile) {

    var minimumRoadDistance = 10;
    // Define a function that will return true if a given feature should be selected
    var shouldFeatureBeSelected = (feature, icon) => {
      //console.log(feature)
      var selectFeature = false
      var imageWidthBy2 = icon ? icon.width / 2 : 0
      var imageHeightBy2 = icon ? icon.height / 2 : 0
      var geometry = feature.loadGeometry()
      // Geometry is an array of shapes
      geometry.forEach((shape) => {
        // Shape is an array of coordinates
        if (shape.length === 1) {
          if (xWithinTile >= shape[0].x - imageWidthBy2
              && xWithinTile <= shape[0].x + imageWidthBy2
              //&& yWithinTile >= shape[0].y - imageHeightBy2 // for location in center of icon
              //&& yWithinTile <= shape[0].y + imageHeightBy2
              && yWithinTile >= shape[0].y - icon.height     // for location at bottom center of icon
              && yWithinTile <= shape[0].y
              ) {
                // The clicked point is inside the bounding box of the features icon
                selectFeature = true
              }
        }
      })

      if(feature.properties.gid) {
        selectFeature = this.selectRoadSegment(feature, xWithinTile, yWithinTile, minimumRoadDistance)
      }

      //Load the selected service area 
      //if(feature.properties.code) { // ToDo: use featureType when implimented 
    	  if(feature.properties.id) {
        feature.loadGeometry().forEach(function (areaGeom) {
          var areaPolyCoordinates = []

          areaGeom.forEach(function (eachValue) {
            var eachPoint = []
            eachPoint.push(eachValue.x)
            eachPoint.push(eachValue.y)
            areaPolyCoordinates.push(eachPoint)
          })

          if (pointInPolygon([xWithinTile, yWithinTile], areaPolyCoordinates)) {
            selectFeature = true
            return
          }
        })
      }

      return selectFeature
    }
    return this.selectFeatures(tileZoom, tileX, tileY, shouldFeatureBeSelected)
  }
}

class TileComponentController {

  // MapLayer objects contain the following information
  // id: A globally (within an instance of the application) unique identifier for this layer
  // dataUrls: One or more URLs where we will get the data from. The URL will contain everything except the tile coordinates (zoom/x/y)
  // renderMode: One of the following values:
  //             PRIMITIVE_FEATURES: Renders features using icons, lines or polygons
  //             HEATMAP: Renders features using a heatmap
  //             AGGREGATE_OPACITY: Renders aggregated features with varying opacity based on the aggregated values. Valid only when aggregateMode===BY_ID
  //             AGGREGATE_GRADIENT: Renders aggregated features with varying colors (from a gradient) based on the aggregated values. Valid only when aggregateMode===BY_ID. Think of this as the same as AGGREATE_OPACITY, but instead of opacity from 0.0 to 1.0, the colors change from (for example) red to green
  // iconUrls: (Optional) Urls for icons used to display point data (e.g. Small Businesses)
  // singleIcon: (Optional, default true) If true, then we will use one single icon for rendering all point features in the layer. If false, we will render icons based on certain feature properties
  // iconSwitchFunction: (Optional) A function that will be called by the rendering code (if “singleIcon” is false) for each point feature. The function should return the URL of the icon used for rendering the point. The returned URL must be part of the iconUrls field
  // selectable: (Optional, default false) Set true if you want features in this layer to be selectable
  // aggregateMode: (Optional) One of the following strings:
  //                NONE: Do not perform aggregation
  //                FLATTEN: Flatten all features into a single layer before rendering
  //                BY_ID: Perform aggregation by feature ID. More properties have to be set for this to work
  // aggregateById: (Optional) If aggregateMode===BY_ID, then this gives the feature property by which we want to aggregate. E.g. for census block features, we may have the “gid” property
  // aggregateProperty: (Optional) If aggregateMode===BY_ID, then this gives us the feature property that we want to aggregate. E.g. for census block features, we may want to aggregate by “download_speed”
  // aggregateMinPalette: (Optional) if aggregateMode===BY_ID, then any value below this is rendered with the same color
  // aggregateMaxPalette: (Optional) if aggregateMode===BY_ID, then any value above this is rendered with the same color
  // lineWidth: (Optional) For line and polygon features, this is the width of the line
  // strokeStyle: (Optional) For line and polygon features, this is the color of the line (e.g. ‘#f0a033’)
  // fillStyle: (Optional) For polygon features, this is the fill color
  // opacity: (Optional, default 1.0) This is the maximum opacity of anything drawn on the map layer. Aggregate layers will have features of varying opacity, but none exceeding this value

  constructor($document, state, tileDataService, configuration, uiNotificationService) {

    this.layerIdToMapTilesIndex = {}
    this.mapRef = null  // Will be set in $document.ready()
    this.state = state
    this.tileDataService = tileDataService
    this.configuration = configuration
    this.areControlsEnabled = true

    // Subscribe to changes in the mapLayers subject
    state.mapLayers
      .debounceTime(100)
      .pairwise() // This will give us the previous value in addition to the current value
      .subscribe((pairs) => this.handleMapEvents(pairs[0], pairs[1], null))

    // Subscribe to changes in the plan (for setting center and zoom)
    state.plan.subscribe((plan) => {
      // Set default coordinates in case we dont have a valid plan
      var coordinates = state.defaultPlanCoordinates
      if (plan) {
        coordinates = {
          zoom: plan.zoomIndex,
          latitude: plan.latitude,
          longitude: plan.longitude
        }
      }

      if (plan) {
        this.areControlsEnabled = (plan.planState === 'START_STATE') || (plan.planState === 'INITIALIZED')
      }
    })

    // Subscribe to changes in the map tile options
    state.mapTileOptions.subscribe((mapTileOptions) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapTileOptions(mapTileOptions)
      }
    })

    // Redraw map tiles when requestd
    state.requestMapLayerRefresh.subscribe((newValue) => {
      this.tileDataService.markHtmlCacheDirty()
      this.refreshMapTiles()
    })
    
    // ToDo: It would seem the repeat code below could be generalized 
    
    // If selected location ids change, set that in the tile data service
    state.selectedLocations.subscribe((selectedLocations) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedLocations(selectedLocations)
      }
    })

    // If selected service_area ids change, set that in the tile data service
    state.selectedServiceAreas.subscribe((selectedServiceAreas) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedServiceAreas(selectedServiceAreas)
      }
    })

    // If selected SA in viewmode change, set that in the tile data service
    state.selectedServiceArea.subscribe((selectedServiceArea) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedServiceArea(selectedServiceArea)
      }
    })

    // If selected Analysis Area in viewmode change, set that in the tile data service
    state.selectedAnalysisArea.subscribe((selectedAnalysisArea) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedAnalysisArea(selectedAnalysisArea)
      }
    })
    
    // If selected census block ids change, set that in the tile data road
    state.selectedCensusBlockId.subscribe((selectedCensusBlockId) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedCensusBlockId(selectedCensusBlockId)
      }
    })
    
    // If selected census category ids change, set that in the tile data road
    state.selectedCensusCategoryId.subscribe((selectedCensusCategoryId) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedCensusCategoryId(selectedCensusCategoryId)
      }
    })
    
    // If selected census category map changes or gets loaded, set that in the tile data road
    state.censusCategories.subscribe((censusCategories) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setCensusCategories(censusCategories)
      }
    })
    
    state.selectedViewFeaturesByType.subscribe((selectedViewFeaturesByType) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedViewFeaturesByType(selectedViewFeaturesByType)
      }
    })
    
    
    // If selected road_segment ids change, set that in the tile data road
    state.selectedRoadSegments.subscribe((selectedRoadSegment) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedRoadSegment(selectedRoadSegment)
      }
    })

    // If Display Mode change, set that in the tile data
    state.selectedDisplayMode.subscribe((selectedDisplayMode) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedDisplayMode(selectedDisplayMode)
      }
    })
    
    // If analysis selection Type change, set that in the tile data
    state.selectionTypeChanged.subscribe((analysisSelectionMode) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setAnalysisSelectionMode(analysisSelectionMode)
      }
    })

    // Set the map zoom level
    state.requestSetMapZoom.subscribe((zoom) => {
      if (this.mapRef) {
        this.mapRef.setZoom(zoom)
      }
    })

    // To change the center of the map to given LatLng 
    state.requestSetMapCenter.subscribe((mapCenter) => {
      if (this.mapRef) {
        this.mapRef.panTo({ lat: mapCenter.latitude, lng: mapCenter.longitude })
      }
    })
    
    // Force a re-creation of all map tiles
    state.requestRecreateTiles.subscribe((newValue) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        // First clear our HTML cache. Tiles where the rendering is in progress will keep rendering to the old tiles.
        tileDataService.deleteHtmlCache()
        // Then re-set the overlayMapTypes, this will call getTile() on all visible tiles
        this.mapRef.overlayMapTypes.setAt(this.OVERLAY_MAP_INDEX, this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX))
      }
    })

    tileDataService.addEntityImageForLayer('SELECTED_LOCATION', state.selectedLocationIcon)

    this.DELTA = Object.freeze({
      IGNORE: 0,
      DELETE: 1,
      UPDATE: 2
    })
    this.TILE_SIZE = 256

    this.state.requestPolygonSelect.subscribe((args) => {
      if (!this.mapRef || !args.coords) {
        return
      }

      var mapBounds = this.mapRef.getBounds()
      var neCorner = mapBounds.getNorthEast()
      var swCorner = mapBounds.getSouthWest()
      var zoom = this.mapRef.getZoom()
      // Note the swap from NE/SW to NW/SE when finding tile coordinates
      var tileCoordsNW = this.getTileCoordinates(zoom, neCorner.lat(), swCorner.lng())
      var tileCoordsSE = this.getTileCoordinates(zoom, swCorner.lat(), neCorner.lng())

      // Loop through all visible tiles
      var pointInPolyPromises = []
      for (var xTile = tileCoordsNW.x; xTile <= tileCoordsSE.x; ++xTile) {
        for (var yTile = tileCoordsNW.y; yTile <= tileCoordsSE.y; ++yTile) {

          // Convert lat lng coordinates into pixel coordinates relative to this tile
          var tileCoords = { x: xTile, y: yTile }
          var convertedPixelCoords = []
          args.coords.forEach((latLng) => {
            var pixelCoords = this.getPixelCoordinatesWithinTile(zoom, tileCoords, latLng.lat(), latLng.lng())
            convertedPixelCoords.push([pixelCoords.x, pixelCoords.y])
          })

          // Get the locations from this tile that are in the polygon
          this.mapRef.overlayMapTypes.forEach((mapOverlay) => {
            pointInPolyPromises.push(mapOverlay.getPointsInPolygon(zoom, tileCoords.x, tileCoords.y, convertedPixelCoords))
          })
        }
      }
      Promise.all(pointInPolyPromises) 
        .then((results) => {
          var selectedLocations = new Set()
          var selectedServiceAreas = new Set()
          var selectedRoadSegments = new Set()
          results.forEach((result) => {
            result.forEach((selectedObj) => {
              if (selectedObj.location_id) {
                selectedLocations.add(selectedObj.location_id)
              } else if(selectedObj.id) {
                selectedServiceAreas.add(selectedObj.id)
              } else if (selectedObj.gid) {
                selectedRoadSegments.add(selectedObj);
              }
            })
          })
          
          var selectedLocationsIds = []
          var selectedServiceAreaIds = []

          selectedLocations.forEach((id) => selectedLocationsIds.push({ location_id: id }))
          selectedServiceAreas.forEach((id) => selectedServiceAreaIds.push({ id: id }))
          
          state.hackRaiseEvent(selectedLocationsIds)

          //Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
          state.mapFeaturesSelectedEvent.next({
            locations: selectedLocationsIds,
            serviceAreas: selectedServiceAreaIds,
            roadSegments: selectedRoadSegments,
            area: processArea()
          })

          function processArea() {
            return google.maps.geometry.spherical.computeArea(new google.maps.Polygon({paths:args.coords.map((a)=>{ return {lat: a.lat() , lng: a.lng()} })}).getPath())
          }
        })
        .catch((err) => console.error(err))
    })

    $document.ready(() => {
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]
      this.mapRef.overlayMapTypes.push(new MapTileRenderer(new google.maps.Size(this.TILE_SIZE, this.TILE_SIZE), 
                                                           this.tileDataService,
                                                           this.state.mapTileOptions.getValue(),
                                                           this.state.selectedLocations.getValue(),
                                                           this.state.selectedServiceAreas.getValue(),
                                                           this.state.selectedAnalysisArea.getValue(),
                                                           this.state.selectedCensusBlockId.getValue(),
                                                           this.state.censusCategories.getValue(),
                                                           this.state.selectedCensusCategoryId.getValue(),
                                                           this.state.selectedRoadSegments.getValue(),
                                                           this.state.selectedViewFeaturesByType.getValue(),
                                                           this.state.selectedDisplayMode.getValue(),
                                                           this.state.optimizationOptions.analysisSelectionMode,
                                                           this.state.displayModes,
                                                           this.state.viewModePanels, 
                                                           this.state, 
                                                           this.configuration,
                                                           uiNotificationService, 
                                                           this.getPixelCoordinatesWithinTile.bind(this)
                                                          ))
      this.OVERLAY_MAP_INDEX = this.mapRef.overlayMapTypes.getLength() - 1
      this.mapRef.addListener('click', (event) => {

        // Get latitiude and longitude
        var lat = event.latLng.lat()
        var lng = event.latLng.lng()

        // Get zoom
        var zoom = this.mapRef.getZoom()

        // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
        var tileCoords = this.getTileCoordinates(zoom, lat, lng)

        // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
        var clickedPointPixels = this.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)

        var hitPromises = []
        this.mapRef.overlayMapTypes.forEach((mapOverlay) => {
        	  hitPromises.push(mapOverlay.performHitDetection(zoom, tileCoords.x, tileCoords.y, clickedPointPixels.x, clickedPointPixels.y))
        })
        Promise.all(hitPromises)
          .then((results) => {
            var hitFeatures = []
            var analysisAreaFeatures = []
            var serviceAreaFeatures = []
            var roadSegments = new Set()
            var equipmentFeatures = []
            var censusFeatures = []
            
            var canSelectLoc  = false
            var canSelectSA   = false
            
            if(state.selectedDisplayMode.getValue() === state.displayModes.ANALYSIS) {
              switch (this.state.optimizationOptions.analysisSelectionMode) {
                case 'SELECTED_AREAS':
                  canSelectSA = !canSelectSA
                  break
                case 'SELECTED_LOCATIONS':
                  canSelectLoc = !canSelectLoc
                  break
              }
            } else if (state.selectedDisplayMode.getValue() === state.displayModes.VIEW) {
              canSelectSA = true
            }  

            results[0].forEach((result) => {
            	  // ToDo: need a better way to differentiate feature types. An explicit way like featureType, also we can then generalize these feature arrays
              //console.log(result)
              if(result.location_id && (canSelectLoc || 
                  state.selectedDisplayMode.getValue() === state.displayModes.VIEW)) {
                hitFeatures = hitFeatures.concat(result)
              } else if ( result.hasOwnProperty('_data_type') && 
                result.code && 'analysis_area' === result._data_type ) {
                analysisAreaFeatures.push(result)
              } else if (result.code && canSelectSA) {
                serviceAreaFeatures = serviceAreaFeatures.concat(result)
              } else if (result.gid) {
                roadSegments.add(result)
              } else if ( result.hasOwnProperty('layerType') 
                          && 'census_block' == result.layerType
                          && state.selectedDisplayMode.getValue() === state.displayModes.VIEW){
            	    censusFeatures.push(result)
              } else if (result.id && (result._data_type.indexOf('equipment') >= 0)) {
                equipmentFeatures = equipmentFeatures.concat(result)
              }
            })

            if (hitFeatures.length > 0) {
              state.hackRaiseEvent(hitFeatures)
            }
            
            //Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
            // ToDo: now that we have types these categories should to be dynamic
            state.mapFeaturesSelectedEvent.next({ 
              latLng: event.latLng,
              locations: hitFeatures,
              serviceAreas: serviceAreaFeatures,
              analysisAreas: analysisAreaFeatures,
              roadSegments: roadSegments,
              equipmentFeatures: equipmentFeatures, 
              censusFeatures: censusFeatures
            })
          })
          .catch((err) => console.error(err))
      })
    })
  }

  // Get the pixel coordinates of the clicked point WITHIN a tile (relative to the top left corner of the tile)
  getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng) {
    // 1. Get the top left coordinates of the tile in lat lngs
    var nwCornerLatLng = this.getNWTileCornerLatLng(zoom, tileCoords.x, tileCoords.y)
    // 2. Convert to pixels
    var nwCornerPixels = this.getPixelCoordinatesFromLatLng(nwCornerLatLng, zoom)
    // 3. Convert the clicked lat lng to pixels
    var clickedPointPixels = this.getPixelCoordinatesFromLatLng({ lat: lat, lng: lng }, zoom)

    return {
      x: clickedPointPixels.x - nwCornerPixels.x,
      y: clickedPointPixels.y - nwCornerPixels.y
    }
  }

  // Returns the tile coordinates (x, y) for a given lat/long and zoom level
  getTileCoordinates(zoom, lat, lng) {
    // Using Mercator projection.
    // https://gis.stackexchange.com/questions/133205/wmts-convert-geolocation-lat-long-to-tile-index-at-a-given-zoom-level
    var n = Math.pow(2.0, zoom)
    var tileX = Math.floor((lng + 180.0) / 360.0 * n)
    var latRad = lat * Math.PI / 180.0
    var tileY = Math.floor((1.0 - Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI) / 2.0 * n)

    return {
      x: tileX,
      y: tileY
    }
  }

  // Returns the latitiude and longitude of the northwest corner of a tile
  // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_numbers_to_lon..2Flat.
  getNWTileCornerLatLng(tileZoom, tileX, tileY) {
    var n = Math.pow(2.0, tileZoom)
    var lon_deg = tileX / n * 360.0 - 180.0
    var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)))
    var lat_deg = lat_rad * 180.0 / Math.PI
    return {
      lat: lat_deg,
      lng: lon_deg
    }
  }

  // Returns the GLOBAL pixel coordinates (not screen pixel coordinates) for a lat long
  // https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
  getPixelCoordinatesFromLatLng(latLng, zoom) {
    var siny = Math.sin(latLng.lat * Math.PI / 180);
    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    var xUnscaled = this.TILE_SIZE * (0.5 + latLng.lng / 360);
    var yUnscaled = this.TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));

    var scale = Math.pow(2.0, zoom)
    return {
      x: Math.floor(xUnscaled * scale),
      y: Math.floor(yUnscaled * scale)
    }
  }

  // Refresh map tiles
  refreshMapTiles() {
    if (!this.mapRef || !this.mapRef.getBounds()) {
      return
    }

    // First get a list of tiles that are visible on the screen.
    var visibleTiles = []
    var mapBounds = this.mapRef.getBounds()
    var neCorner = mapBounds.getNorthEast()
    var swCorner = mapBounds.getSouthWest()
    var zoom = this.mapRef.getZoom()
    // Note the swap from NE/SW to NW/SE when finding tile coordinates
    var tileCoordsNW = this.getTileCoordinates(zoom, neCorner.lat(), swCorner.lng())
    var tileCoordsSE = this.getTileCoordinates(zoom, swCorner.lat(), neCorner.lng())

    for (var x = tileCoordsNW.x; x <= tileCoordsSE.x; ++x) {
      for (var y = tileCoordsNW.y; y <= tileCoordsSE.y; ++y) {
        visibleTiles.push({
          zoom: zoom,
          x: x,
          y: y
        })
      }
    }

    // Redraw the non-visible tiles. If we don't do this, these tiles will have stale data if the user pans/zooms.
    var redrawnTiles = new Set()
    visibleTiles.forEach((visibleTile) => redrawnTiles.add(getTileId(visibleTile.zoom, visibleTile.x, visibleTile.y)))
    var tilesOutOfViewport = []
    Object.keys(this.tileDataService.tileHtmlCache).forEach((tileKey) => {
      var cachedTile = this.tileDataService.tileHtmlCache[tileKey]
      if (cachedTile.zoom !== zoom) {
        // For all tiles that are not at the current zoom level, simply mark them as dirty. When you change the zoom
        // level, Google maps will call getTile() and we will be able to redraw the tiles
        cachedTile.isDirty = true
      } else {
        // For all tiles at the current zoom level, we must redraw them. This is because Google maps does not call
        // getTile() when the user pans. In this case, the tiles will show stale data if they are not redrawn.
        const isTileVisible = redrawnTiles.has(getTileId(cachedTile.zoom, cachedTile.coord.x, cachedTile.coord.y))
        if (!isTileVisible) {
          tilesOutOfViewport.push({ zoom: cachedTile.zoom, x: cachedTile.coord.x, y: cachedTile.coord.y })
        }
      }
    })
    // First, redraw the tiles that are outside the viewport AND at the current zoom level.
    this.mapRef.overlayMapTypes.forEach((overlayMap) => {
      overlayMap.redrawCachedTiles(tilesOutOfViewport)
    })
    // Next, redraw the visible tiles. We do it this way because tiles that are redrawn most recently are given a higher priority.
    this.mapRef.overlayMapTypes.forEach((overlayMap) => {
      overlayMap.redrawCachedTiles(visibleTiles)
    })
  }

  // Handles map layer events
  handleMapEvents(oldMapLayers, newMapLayers, mapLayerActions) {
    if (!this.mapRef || this.mapRef.overlayMapTypes.getLength() <= this.OVERLAY_MAP_INDEX) {
      // Map not initialized yet
      return
    }

    this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapLayers(newMapLayers)
    this.refreshMapTiles()
  }

  $onInit() {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }
  }
}

TileComponentController.$inject = ['$document', 'state', 'tileDataService', 'configuration', 'uiNotificationService']

let tile = {
  template: '',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: TileComponentController
}

export default tile