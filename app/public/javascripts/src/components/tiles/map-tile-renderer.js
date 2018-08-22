
import TileUtilities from './tile-utilities'
// Browserify includes
var pointInPolygon = require('point-in-polygon')
var AsyncPriorityQueue = require('async').priorityQueue

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
    this.latestTileUniqueId = 0

    const MAX_CONCURRENT_VECTOR_TILE_RENDERS = 5
    this.tileRenderThrottle = new AsyncPriorityQueue((task, callback) => {
      // We expect 'task' to be a promise. Call the callback after the promise resolves or rejects.
      task()
        .then((result) => {
          callback(result)  // Callback so that the next tile can be processed
        })
        .catch((err) => {
          callback(err)     // Callback even on error, so the next tile can be processed
        })
    }, MAX_CONCURRENT_VECTOR_TILE_RENDERS)
    this.latestTileRenderPriority = Number.MAX_SAFE_INTEGER
    this.tileRenderThrottle.error = (err) => {
      console.error('Error from the tile rendering throttle:')
      console.error(err)
    }

    this.modificationTypes = Object.freeze({
      UNMODIFIED: 'UNMODIFIED',
      ORIGINAL: 'ORIGINAL',
      MODIFIED: 'MODIFIED',
      DELETED: 'DELETED'
    })
    
    this.getActiveViewModePanel = () =>{
      return state.activeViewModePanel
    }
    
    this.getMapLayers = () =>{
      return state.mapLayers.getValue()
    }
    
    // we should start holding the styles here so they can be adstracted, I'll start
    this.styles = {
      modifiedBoundary: {
        strokeStyle: '#dddddd', 
        lineOpacity: 0.5
      }
    }
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
      // There *can* be multiple cached tiles for a given zoom-x-y
      var tileId = TileUtilities.getTileId(tile.zoom, tile.x, tile.y)
      Object.keys(this.tileDataService.tileHtmlCache).forEach((cacheKey) => {
        if (cacheKey.indexOf(tileId) === 0) {
          const cachedTile = this.tileDataService.tileHtmlCache[cacheKey]
          var coord = { x: tile.x, y: tile.y }
          this.tileRenderThrottle.push(() => this.renderTile(tile.zoom, coord, cachedTile), --this.latestTileRenderPriority)
        }
      })
    })
  }

  // Creates a tile canvas element
  createTileCanvas(ownerDocument) {
    var canvas = ownerDocument.createElement('canvas');
    canvas.width = this.tileSize.width;
    canvas.height = this.tileSize.height;
    return canvas
  }

  // This method is called by Google Maps. Render a canvas tile and send it back.
  getTile(coord, zoom, ownerDocument) {

    // Initially, we were using just the `zoom-x-y` as the tile cache key. At certain latitudes on the map,
    // e.g. at '14-3950-5917', as you pan around, Google Maps will rebuild the map overlay. In the process,
    // it will call getTile() for '14-3950-5917' and then call releaseTile() on the OLD overlays tile DOM element.
    // If we just use `zoom-x-y` then we will have only one tile DOM element and the tile will disappear when
    // we remove the DOM element in releaseTile(). We are appending a unique ID so that releaseTile() removes
    // the old tile DOM element.
    // Also, we now ALWAYS create a new tile DOM element in getTile() and don't reuse existing elements.
    // Also important to note - the reason we have a HTML cache is so that we can re-render tiles when
    // the user selects a new layer to show/hide.
    var numberedTileId = `${TileUtilities.getTileId(zoom, coord.x, coord.y)}-ID${++this.latestTileUniqueId}`
    var htmlCache = this.tileDataService.tileHtmlCache[numberedTileId]

    // We create a div with a parent canvas. This is because the canvas needs to have its top-left
    // corner offset by the margin. If we just use canvas, google maps sets the top-left to (0, 0)
    // regardless of what we give in the style.left/style.top properties
    var div = ownerDocument.createElement('div')
    div.id = numberedTileId
    var frontBufferCanvas = this.createTileCanvas(ownerDocument)
    div.appendChild(frontBufferCanvas)
    frontBufferCanvas.style.position = 'absolute'
    frontBufferCanvas.style.left = `0 px`
    frontBufferCanvas.style.top = `0 px`
    var backBufferCanvas = this.createTileCanvas(ownerDocument)
    var heatmapCanvas = this.createTileCanvas(ownerDocument)
    this.tileDataService.tileHtmlCache[numberedTileId] = {
      div: div,
      frontBufferCanvas: frontBufferCanvas,
      backBufferCanvas: backBufferCanvas,
      heatmapCanvas: heatmapCanvas,
      isDirty: true,
      zoom: zoom,
      coord: coord
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
    var htmlCache = this.tileDataService.tileHtmlCache[numberedTileId]
    setTimeout(() => {
      this.tileRenderThrottle.push(() => this.renderTile(zoom, coord, htmlCache), --this.latestTileRenderPriority)
    }, RENDER_TIMEOUT_MILLISECONDS)
    return div
  }

  // This method is called by the Google Maps API.
  releaseTile(node) {
    // Remove this tiles node (DIV element) from our cache. This will include the HTML element, children canvases, etc.
    // Without this we will hold on to a lot of tiles and will keep repainting even offscreen tiles.
    // Note that releaseTile() is not called the very moment that a tile goes offscreen. Google Maps API seems
    // to hold onto tiles until the user pans a little bit more.
    this.tileDataService.removeHtmlCacheNode(node.id)
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
      var numNeighbors = 1 //(mapLayer.renderMode === 'HEATMAP') ? 1 : 0
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
      // Draw a rectangle showing the tile (not the margins)
      ctx.setLineDash([])
      ctx.strokeRect(0, 0, this.tileSize.width, this.tileSize.height)
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

  // Render a set of features on the map
  renderFeatures(ctx, zoom, tileCoords, features, featureData, selectedLocationImage, lockOverlayImage, geometryOffset, heatMapData, heatmapID, mapLayer) {
    ctx.globalAlpha = 1.0
    // If a filtering function is provided for this layer, apply it to filter out features
    const filteredFeatures = mapLayer.featureFilter ? features.filter(mapLayer.featureFilter) : features

    for (var iFeature = 0; iFeature < filteredFeatures.length; ++iFeature) {
      // Parse the geometry out.
      var feature = filteredFeatures[iFeature]

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
          //greyout an RT with hsiEanbled true for frontier client
          if (config.ARO_CLIENT === 'frontier' &&
            (feature.properties._data_type === 'equipment.central_office' || feature.properties._data_type === 'equipment.dslam')
            && (feature.properties.hsiEnabled !== 'true')) {
              entityImage = featureData.greyOutIcon
          }
        } else if ( feature.properties.hasOwnProperty('id') ){
          selectedListId = feature.properties.id
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
  	      var x = shape[0].x + geometryOffset.x - imageWidthBy2
  	      var y = shape[0].y + geometryOffset.y - (imageHeightBy2 * 2)
          
  	      //Draw the location icons with its original color
  	      ctx.globalCompositeOperation = 'source-over'
  	      if (heatmapID === 'HEATMAP_OFF' || heatmapID === 'HEATMAP_DEBUG' || mapLayer.renderMode === 'PRIMITIVE_FEATURES') {
  	        // Display individual locations. Either because we are zoomed in, or we want to debug the heatmap rendering
  	        //const modificationType = this.getModificationTypeForFeature(zoom, tileCoords, shape[0].x + geometryOffset.x, shape[0].y + geometryOffset.y, feature)
  	        const modificationType = this.getModificationTypeForFeature(feature, mapLayer)
  	        // we dont show originals when planned view is on
  	        if (modificationType === this.modificationTypes.ORIGINAL && feature.properties.hasOwnProperty('_data_type')){
  	          var equipmentType = feature.properties._data_type.substring( feature.properties._data_type.lastIndexOf('.')+1 )
              if (this.getMapLayers().hasOwnProperty(equipmentType+'_planned')){
  	            return
  	          }
  	        }
  	        
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
              //const modificationType = this.getModificationTypeForFeature(zoom, tileCoords, shape[0].x + geometryOffset.x, shape[0].y + geometryOffset.y, feature)
              if (modificationType === this.modificationTypes.ORIGINAL || modificationType === this.modificationTypes.DELETED) {
                ctx.globalAlpha = 0.5
              }
              // Increase the size of household icon if entity_count > 1
              if (feature.properties.entity_count && feature.properties.entity_count > 1 ) {
                ctx.drawImage(entityImage, x, y, entityImage.width*1.3, entityImage.height*1.3)
              } else {
                ctx.drawImage(entityImage, x, y)
              }
              ctx.globalAlpha = originalAlpha
            }
            //const modificationType = this.getModificationTypeForFeature(zoom, tileCoords, shape[0].x + geometryOffset.x, shape[0].y + geometryOffset.y, feature)
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
              this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, null, false)
            }
          }
            
        }
      })
    }
  }

  // Gets the modification type for a given feature
  //getModificationTypeForFeature(zoom, tileCoords, shapeX, shapeY, feature) {
  getModificationTypeForFeature(feature, mapLayer) {
    // If this feature is a "modified feature" then add an overlay. (Its all "object_id" now, no "location_id" anywhere)
    var modificationType = this.modificationTypes.UNMODIFIED
    if (this.tileDataService.modifiedFeatures.hasOwnProperty(feature.properties.object_id)) {
      const modifiedFeature = this.tileDataService.modifiedFeatures[feature.properties.object_id]
      if (modifiedFeature.deleted) {
        modificationType = this.modificationTypes.DELETED
      } else {
        /*
        modificationType = this.modificationTypes.ORIGINAL
        const modifiedFeatureCoord = modifiedFeature.geometry.coordinates
        var pixelCoords = this.getPixelCoordinatesWithinTile(zoom, tileCoords, modifiedFeatureCoord[1], modifiedFeatureCoord[0])
        const pixelTolerance = 3
        if ((Math.abs(pixelCoords.x - shapeX) < pixelTolerance) && (Math.abs(pixelCoords.y - shapeY) < pixelTolerance)) {
          modificationType = this.modificationTypes.MODIFIED
        }
        */
        if ('LibraryEquipmentPointLayer' == mapLayer.tileDefinitions[0].vtlType){
          modificationType = this.modificationTypes.ORIGINAL
        }else{
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
  renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyleOverrides, isPolygonBorder) {

    const oldOpacity = ctx.globalAlpha
    if (drawingStyleOverrides && drawingStyleOverrides.lineOpacity) {
      ctx.globalAlpha = drawingStyleOverrides.lineOpacity
    }

    ctx.strokeStyle = drawingStyleOverrides ? drawingStyleOverrides.strokeStyle : mapLayer.strokeStyle
    ctx.lineWidth = drawingStyleOverrides ? drawingStyleOverrides.lineWidth : (mapLayer.lineWidth || 1)

    var xPrev = shape[0].x + geometryOffset.x
    var yPrev = shape[0].y + geometryOffset.y
    ctx.beginPath()
    ctx.moveTo(xPrev, yPrev)
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
        ctx.lineTo(xNext, yNext)
      }
      xPrev = xNext
      yPrev = yNext
      ctx.moveTo(xPrev, yPrev)
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
      xCenter = shape[currentSegment].x + fraction * deltaX
      yCenter = shape[currentSegment].y + fraction * deltaY
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
    
    if (this.tileDataService.modifiedBoundaries.hasOwnProperty(feature.properties.object_id) 
        && 'ExistingBoundaryPointLayer' == mapLayer.tileDefinitions[0].vtlType){
      drawingStyles.strokeStyle = this.styles.modifiedBoundary.strokeStyle
      drawingStyles.lineOpacity = this.styles.modifiedBoundary.lineOpacity
    }
    
    ctx.fillStyle = drawingStyles.fillStyle
    ctx.globalAlpha = drawingStyles.opacity

    // Draw a filled polygon with the drawing styles computed for this feature
    var x0 = geometryOffset.x + shape[0].x
    var y0 = geometryOffset.y + shape[0].y
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
      var x1 = geometryOffset.x + shape[iCoord].x
      var y1 = geometryOffset.y + shape[iCoord].y
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
        const numNeighbors = 1
        for (var deltaX = -numNeighbors; deltaX <= numNeighbors; ++deltaX) {
          for (var deltaY = -numNeighbors; deltaY <= numNeighbors; ++deltaY) {
            var res = Promise.all([
              Promise.resolve({ deltaX: deltaX, deltaY: deltaY }),
              this.tileDataService.getTileData(mapLayer, tileZoom, tileX + deltaX, tileY + deltaY)
            ])
            promises.push(res.then((results) => {
                results[1].deltaXPx = results[0].deltaX * this.tileSize.width
                results[1].deltaYPx = results[0].deltaY * this.tileSize.height
                return Promise.resolve(results[1])
              })
            )
          }
        }
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
                if (shouldFeatureBeSelected(feature, result.icon, result.deltaXPx, result.deltaYPx)) {
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
    var shouldFeatureBeSelected = (feature, icon, deltaX, deltaY) => {
      var selectFeature = false
      deltaX = deltaX || 0
      deltaY = deltaY || 0
      var geometry = feature.loadGeometry()
      geometry.forEach((shape) => {
        if (shape.length === 1) {
          // Only support points for now
          var locationCoords = [shape[0].x + deltaX, shape[0].y + deltaY]
          if (pointInPolygon(locationCoords, polygonCoords)) {
            selectFeature = true
          }
        } else if (feature.properties.gid) {
          var roadGeom = feature.loadGeometry()[0];
          for (var i = 0; i < roadGeom.length; i++) {
            if (pointInPolygon([roadGeom[i].x + deltaX, roadGeom[i].y + deltaY], polygonCoords)) {
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
              eachPoint.push(eachValue.x + deltaX)
              eachPoint.push(eachValue.y + deltaY)

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
                eachPoint.push(eachValue.x + deltaX)
                eachPoint.push(eachValue.y + deltaY)
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
  
  selectRoadSegment(feature, xWithinTile, yWithinTile, minimumRoadDistance, deltaX, deltaY) {

    var geometry = feature.loadGeometry()
    var distance

    // Ref: http://www.cprogramto.com/c-program-to-find-shortest-distance-between-point-and-line-segment
    var lineX1, lineY1, lineX2, lineY2, pointX, pointY;
    deltaX = deltaX || 0
    deltaY = deltaY || 0
    //Some road segments has more points
    for (var i = 0; i < geometry[0].length - 1; i++) {
      lineX1 = deltaX + Object.values(geometry[0])[i].x //X1, Y1 are the first point of that line segment.
      lineY1 = deltaY + Object.values(geometry[0])[i].y
  
      lineX2 = deltaX + Object.values(geometry[0])[i+1].x //X2, Y2 are the end point of that line segment
      lineY2 = deltaY + Object.values(geometry[0])[i+1].y

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
    var shouldFeatureBeSelected = (feature, icon, deltaX, deltaY) => {
      //console.log(feature)
      var selectFeature = false
      var imageWidthBy2 = icon ? icon.width / 2 : 0
      var imageHeightBy2 = icon ? icon.height / 2 : 0
      var geometry = feature.loadGeometry()
      // Geometry is an array of shapes
      deltaX = deltaX || 0
      deltaY = deltaY || 0
      geometry.forEach((shape) => {
        // Shape is an array of coordinates
        if (shape.length === 1) {
          if (xWithinTile >= shape[0].x + deltaX - imageWidthBy2
              && xWithinTile <= shape[0].x + deltaX + imageWidthBy2
              //&& yWithinTile >= shape[0].y + deltaY - imageHeightBy2 // for location in center of icon
              //&& yWithinTile <= shape[0].y + deltaY + imageHeightBy2
              && yWithinTile >= shape[0].y + deltaY - icon.height     // for location at bottom center of icon
              && yWithinTile <= shape[0].y + deltaY 
              ) {
                // The clicked point is inside the bounding box of the features icon
                selectFeature = true
              }
        }
      })

      if(feature.properties.gid) {
        selectFeature = this.selectRoadSegment(feature, xWithinTile, yWithinTile, minimumRoadDistance, deltaX, deltaY)
      }

      //Load the selected service area 
      //if(feature.properties.code) { // ToDo: use featureType when implimented 
    	  if(feature.properties.id) {
        feature.loadGeometry().forEach(function (areaGeom) {
          var areaPolyCoordinates = []

          areaGeom.forEach(function (eachValue) {
            var eachPoint = []
            eachPoint.push(eachValue.x + deltaX)
            eachPoint.push(eachValue.y + deltaY)
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

export default MapTileRenderer