import PointFeatureRenderer from './point-feature-renderer'
import PolylineFeatureRenderer from './polyline-feature-renderer'
import PolygonFeatureRenderer from './polygon-feature-renderer'
import TileUtilities from './tile-utilities'
// Browserify includes
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
      this.mapLayersByZ = TileUtilities.getOrderedKeys(mapLayers, 'zIndex', 0) // ToDo: replace 0 with var for default zIndex
    }
    
    this.mapLayers = mapLayers  // Set the object in any case (why? this should go in the above if)
    
    // Set the map layers in the data service too, so that we can download all layer data in a single call
    this.tileDataService.setMapLayers(mapLayers)
  }

  // Helper to shuffle an array. From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  shuffleArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  // Redraws cached tiles with the specified tile IDs
  redrawCachedTiles(tiles) {
    // Shuffle the order of the tiles. Just for a UI "effect" - this has no bearing on performance, etc.
    const shuffledTiles = this.shuffleArray(tiles)

    shuffledTiles.forEach((tile) => {
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
            PointFeatureRenderer.renderFeature(ctx, shape, feature, featureData, geometryOffset, mapLayer, this.mapLayers, this.tileDataService,
                                               selectedLocationImage, lockOverlayImage, this.selectedDisplayMode, this.displayModes,
                                               this.analysisSelectionMode, this.selectedLocations, this.selectedViewFeaturesByType)
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
                PolygonFeatureRenderer.renderFeature(feature, shape, geometryOffset, ctx, mapLayer, this.censusCategories, this.tileDataService, this.styles,
                                                     this.tileSize, this.selectedServiceArea, this.selectedServiceAreas, this.selectedDisplayMode, this.displayModes,
                                                     this.analysisSelectionMode, this.selectedCensusBlockId, this.selectedCensusCategoryId)
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
              PolylineFeatureRenderer.renderFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles, false, this.tileSize)
            } else {
              PolylineFeatureRenderer.renderFeature(shape, geometryOffset, ctx, mapLayer, null, false, this.tileSize)
            }
          }
        }
      })
    }
  }
}

export default MapTileRenderer
