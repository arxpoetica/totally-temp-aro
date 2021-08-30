import PointFeatureRenderer from './point-feature-renderer'
import PolylineFeatureRenderer from './polyline-feature-renderer'
import PolygonFeatureRenderer from './polygon-feature-renderer'
import TileUtilities from './tile-utilities'
import AsyncPriorityQueue from 'async/priorityQueue'
import Constants from '../common/constants'
import PuppeteerMessages from '../common/puppeteer-messages'
import Rule from './rule'
import StrokeStyle from '../../shared-utils/stroke-styles'

class MapTileRenderer {
  constructor (tileSize, tileDataService, mapTileOptions, layerCategories, selectedDisplayMode, selectionModes, analysisSelectionMode, stateMapLayers, displayModes,
    viewModePanels, state, getPixelCoordinatesWithinTile, subnetFeatureIds, hiddenFeatures, selectedSubnetLocations, locationAlerts, rShowFiberSize, rViewSetting, mapLayers = []) {
    this.tileSize = tileSize
    this.tileDataService = tileDataService
    this.mapLayers = mapLayers
    this.mapLayersByZ = []
    this.mapTileOptions = mapTileOptions
    this.tileVersions = {}
    this.selectedDisplayMode = selectedDisplayMode
    this.selectionModes = selectionModes
    this.analysisSelectionMode = analysisSelectionMode
    this.stateMapLayers = stateMapLayers
    this.layerCategories = layerCategories
    this.displayModes = displayModes
    this.viewModePanels = viewModePanels
    this.state = state
    this.getPixelCoordinatesWithinTile = getPixelCoordinatesWithinTile
    this.latestTileUniqueId = 0
    
    this.subnetFeatureIds = subnetFeatureIds
    this.selectedSubnetLocations = selectedSubnetLocations
    this.locationAlerts = locationAlerts
    this.hiddenFeatures = hiddenFeatures

    this.rShowFiberSize = rShowFiberSize
    this.rViewSetting = rViewSetting

    const MAX_CONCURRENT_VECTOR_TILE_RENDERS = 5
    this.tileRenderThrottle = new AsyncPriorityQueue((task, callback) => {
      // We expect 'task' to be a promise. Call the callback after the promise resolves or rejects.
      task()
        .then((result) => {
          callback(result) // Callback so that the next tile can be processed
        })
        .catch((err) => {
          callback(err) // Callback even on error, so the next tile can be processed
        })
    }, MAX_CONCURRENT_VECTOR_TILE_RENDERS)
    this.latestTileRenderPriority = Number.MAX_SAFE_INTEGER
    this.tileRenderThrottle.error = (err) => {
      console.error('Error from the tile rendering throttle:')
      console.error(err)
    }

    // Detect when the queue has drained (finished fetching data). If a callback function exists on the window, call it.
    // This is used by the PDF report generator to detect when we are finished fetching all vector tile data.
    this.tileRenderThrottle.drain = () => PuppeteerMessages.vectorTilesRenderedCallback()

    this.modificationTypes = Object.freeze({
      UNMODIFIED: 'UNMODIFIED',
      ORIGINAL: 'ORIGINAL',
      MODIFIED: 'MODIFIED',
      DELETED: 'DELETED'
    })

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
  setMapTileOptions (mapTileOptions) {
    this.mapTileOptions = mapTileOptions
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the "selected entities list"
  setSelection (selection) {
    this.selection = selection
  }

  setOldSelection (oldSelection) {
    this.oldSelection = oldSelection
  }

  setLayerCategories (layerCategories) {
    this.layerCategories = layerCategories
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected display mode
  setselectedDisplayMode (selectedDisplayMode) {
    this.selectedDisplayMode = selectedDisplayMode
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected analysis selection type
  setAnalysisSelectionMode (analysisSelectionMode) {
    this.analysisSelectionMode = analysisSelectionMode
    this.tileDataService.markHtmlCacheDirty()
  }

  setStateMapLayers (stateMapLayers) {
    this.stateMapLayers = stateMapLayers
  }

  // - plan edit - //
  setSubnetFeatureIds (subnetFeatureIds) {
    this.subnetFeatureIds = subnetFeatureIds
  }
  setSelectedSubnetLocations (selectedSubnetLocations) {
    this.selectedSubnetLocations = selectedSubnetLocations
  }
  setLocationAlerts (locationAlerts) {
    this.locationAlerts = locationAlerts
  }
  setHiddenFeatures (hiddenFeatures) {
    this.hiddenFeatures = hiddenFeatures
  }
  // - //

  // Sets the selected rshowFiberSize
  setReactShowFiberSize (rShowFiberSize) {
    this.rShowFiberSize = rShowFiberSize
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected rViewSetting
  setReactViewSetting (rViewSetting) {
    this.rViewSetting = rViewSetting
    this.tileDataService.markHtmlCacheDirty()
  }

  // ToDo: move this to a place of utility functions
  // utility function NOTE: will apply default val to source object items
  getOrderedKeys (obj, orderPram, defaultVal) {
    let orderedArr = Object.keys(obj)
    orderedArr.sort(function (a, b) {
    let aObj = obj[a]
    let bObj = obj[b]

    if (!aObj.hasOwnProperty(orderPram) || isNaN(aObj[orderPram])) { aObj[orderPram] = defaultVal }
    if (!bObj.hasOwnProperty(orderPram) || isNaN(bObj[orderPram])) { bObj[orderPram] = defaultVal }

      return aObj[orderPram] - bObj[orderPram]
    })

    return orderedArr
  }

  // Sets the map layers for this renderer
  setMapLayers (mapLayers) {
    // Check if any of the map layers have changed. JSON.stringify() doesn't work because the order may be different
    var layersChanged = false
    Object.keys(this.mapLayers).forEach((oldMapLayerKey) => {
      if (!mapLayers[oldMapLayerKey]) {
        // Old map layer key does not exist in new map layers, so layers have changed
        layersChanged = true
      } else if (this.mapLayers[oldMapLayerKey].featureFilter !== mapLayers[oldMapLayerKey].featureFilter) {
        // The feature filter of this map layer has changed
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

    this.mapLayers = mapLayers // Set the object in any case (why? this should go in the above if)

    // Set the map layers in the data service too, so that we can download all layer data in a single call
    this.tileDataService.setMapLayers(mapLayers)
  }

  // Helper to shuffle an array. From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  shuffleArray (array) {
    var currentIndex = array.length; var temporaryValue; var randomIndex
    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
  }

  // Redraws cached tiles with the specified tile IDs
  redrawCachedTiles (tiles) {
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
  createTileCanvas (ownerDocument) {
    var canvas = ownerDocument.createElement('canvas')
    canvas.width = this.tileSize.width
    canvas.height = this.tileSize.height
    return canvas
  }

  // This method is called by Google Maps. Render a canvas tile and send it back.
  getTile (coord, zoom, ownerDocument) {
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

    // We have a div overlaying everything that is visible when the data for a tile is "stale". This is shown
    // when we have received a message from aro-service invalidating the data for certain tiles
    const staleDataDiv = ownerDocument.createElement('div')
    staleDataDiv.style.position = 'absolute'
    staleDataDiv.style.left = '0 px'
    staleDataDiv.style.top = '0 px'
    staleDataDiv.style.width = `${Constants.TILE_SIZE}px`
    staleDataDiv.style.height = `${Constants.TILE_SIZE}px`
    staleDataDiv.style['background-color'] = 'rgba(255, 255, 255, 0.7)'
    staleDataDiv.style.display = 'none'
    // Add a spinning icon to the div
    staleDataDiv.innerHTML = `<div style="height: 100%; text-align: center; border: dashed 1px black;">
      <i class="fa fa-5x fa-spinner fa-spin" style="line-height: ${Constants.TILE_SIZE}px"></i>
    </div>`
    div.appendChild(staleDataDiv)

    this.tileDataService.tileHtmlCache[numberedTileId] = {
      div: div,
      frontBufferCanvas: frontBufferCanvas,
      backBufferCanvas: backBufferCanvas,
      heatmapCanvas: heatmapCanvas,
      staleDataDiv: staleDataDiv,
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
  releaseTile (node) {
    // Remove this tiles node (DIV element) from our cache. This will include the HTML element, children canvases, etc.
    // Without this we will hold on to a lot of tiles and will keep repainting even offscreen tiles.
    // Note that releaseTile() is not called the very moment that a tile goes offscreen. Google Maps API seems
    // to hold onto tiles until the user pans a little bit more.
    this.tileDataService.removeHtmlCacheNode(node.id)
  }

  // Renders all data for this tile
  renderTile (zoom, coord, htmlCache) {
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

    var renderingData = {}; var globalIndexToLayer = {}; var globalIndexToIndex = {}
    var singleTilePromises = []
    this.mapLayersByZ.forEach((mapLayerKey, index) => {
      // Initialize rendering data for this layer
      var mapLayer = this.mapLayers[mapLayerKey]
      var numNeighbors = 1 // (mapLayer.renderMode === 'HEATMAP') ? 1 : 0
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
    singleTilePromises.push(this.tileDataService.getEntityImageForLayer(this.tileDataService.locationStates.LOCK_ICON_KEY))
    singleTilePromises.push(this.tileDataService.getEntityImageForLayer(this.tileDataService.locationStates.INVALIDATED_ICON_KEY))

    this.state.setAreTilesRendering(true)
    // Get all the data for this tile
    return Promise.all(singleTilePromises)
      .then((singleTileResults) => {
        var invalidatedOverlayImage = singleTileResults.splice(singleTileResults.length - 1)[0]
        var lockOverlayImage = singleTileResults.splice(singleTileResults.length - 1)[0]
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

          this.renderSingleTileFull(zoom, coord, renderingData, selectedLocationImage, lockOverlayImage, invalidatedOverlayImage, htmlCache.backBufferCanvas, htmlCache.heatmapCanvas)

          // Copy the back buffer image onto the front buffer
          var ctx = htmlCache.frontBufferCanvas.getContext('2d')
          ctx.clearRect(0, 0, htmlCache.frontBufferCanvas.width, htmlCache.frontBufferCanvas.height)
          ctx.drawImage(htmlCache.backBufferCanvas, 0, 0)
          // All rendering has been done. Mark the cached HTML tile as not-dirty
          // Do NOT use this.tileDataService.tileHtmlCache[tileId], that object reference may have changed
          htmlCache.isDirty = false
        }
        this.hideStaleDataMarker(zoom, coord.x, coord.y)
        this.state.setAreTilesRendering(false)
        return Promise.resolve()
      })
      .catch((err) => {
        console.error(err)
        this.state.setAreTilesRendering(false)
        this.hideStaleDataMarker(zoom, coord.x, coord.y)
      })
  }

  // Renders a single layer on a tile
  renderSingleTileFull (zoom, coord, renderingData, selectedLocationImage, lockOverlayImage, invalidatedOverlayImage, canvas, heatmapCanvas) {
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
          this.renderFeatures(ctx, zoom, coord, features, featureData, selectedLocationImage, lockOverlayImage, invalidatedOverlayImage, renderingData[mapLayerKey].dataOffsets[index], heatMapData, this.mapTileOptions.selectedHeatmapOption.id, mapLayer)
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
  renderTileInformation (canvas, ctx, tileCoordinateString) {
    if (this.mapTileOptions.showTileExtents) {
      ctx.globalAlpha = 1.0 // The heat map renderer may have changed this
      // Draw a rectangle showing the tile margins
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      // Draw a rectangle showing the tile (not the margins)
      ctx.setLineDash([])
      ctx.strokeRect(0, 0, this.tileSize.width, this.tileSize.height)
      // Show the tile coordinates that we pass to aro-service
      ctx.fillStyle = '#000000'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.font = '15px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeText(tileCoordinateString, canvas.width / 2, canvas.height / 2)
      ctx.fillText(tileCoordinateString, canvas.width / 2, canvas.height / 2)
    }
  }

  // Render a set of features on the map
  renderFeatures (ctx, zoom, tileCoords, features, featureData, selectedLocationImage, lockOverlayImage, invalidatedOverlayImage, geometryOffset, heatMapData, heatmapID, mapLayer) {
    ctx.globalAlpha = 1.0
    // If a filtering function is provided for this layer, apply it to filter out features
    var v1FilteredFeatures = mapLayer.featureFilter ? features.filter(mapLayer.featureFilter) : features
    v1FilteredFeatures.forEach(v1Feature => delete v1Feature.v2Result)

    // V2 filtering
    var filteredFeatures = []
    if (mapLayer.v2Filters) {
      mapLayer.v2Filters.forEach(v2Filter => {
        const rule = new Rule(v2Filter.condition)
        v1FilteredFeatures.forEach(feature => {
          if (rule.checkCondition(feature.properties)) {
            feature.v2Result = v2Filter.onPass
            filteredFeatures.push(feature)
          }
        })
      })
    } else {
      // No V2 filters selected. Use all features
      filteredFeatures = v1FilteredFeatures
    }
    var closedPolygonFeatureLayersList = []
    var pointFeatureRendererList = []
    for (var iFeature = 0; iFeature < filteredFeatures.length; ++iFeature) {
      // Parse the geometry out.
      var feature = filteredFeatures[iFeature]

      if (feature.properties) {
        // Try object_id first, else try location_id
        var featureId = feature.properties.object_id || feature.properties.location_id

        // do not render any features that are part of a transaction while in `EDIT_PLAN` mode
        if (this.selectedDisplayMode == this.displayModes.EDIT_PLAN) {

          // don't render any featureIds in plan edit
          // serviceLayerSelectionIds
          const { _data_type } = feature.properties
          if (
            this.subnetFeatureIds.includes(featureId)
            && (_data_type === 'equipment' || _data_type === 'fiber')
          ) {
            continue
          }

          // This feature is to be excluded. Do not render it.
          // TODO: is this necessary? What is `tileDataService.featuresToExclude`
          // investigate at some point in the future
          if (
            this.tileDataService.featuresToExclude.has(featureId)
            && !(feature.properties._data_type && feature.properties._data_type === 'location')
          ) {
            continue
          }
        }

        if (mapLayer.subtypes) {
          if (feature.properties.hasOwnProperty('subtype_id')) {
            // filter off subtypes
            if (!mapLayer.subtypes.hasOwnProperty(feature.properties.subtype_id) || !mapLayer.subtypes[feature.properties.subtype_id]) continue
          } else {
            // check that the root layer is on
            if (!mapLayer.subtypes.hasOwnProperty('0') || !mapLayer.subtypes[0]) continue
          }
        }

        if (this.selectedDisplayMode == this.displayModes.VIEW &&
            (this.state.activeViewModePanel == this.viewModePanels.EDIT_LOCATIONS ||
              this.state.activeViewModePanel == this.viewModePanels.EDIT_SERVICE_LAYER) &&
            this.tileDataService.featuresToExclude.has(featureId) &&
            feature.properties._data_type && (feature.properties._data_type == 'location' ||
              feature.properties._data_type == 'service_layer')) {
          // this is a location/Service area that is being edited
          continue
        }
      }

      var selectedListType = null
      var selectedListId = null
      var entityImage = featureData.icon
      if (feature.properties.hasOwnProperty('_data_type') && feature.properties._data_type != '') {
        var fullDataType = feature.properties._data_type + '.'
        selectedListType = fullDataType.substr(0, fullDataType.indexOf('.'))
        if (feature.properties.hasOwnProperty('location_id')) {
          selectedListId = feature.properties.location_id
        } else if (feature.properties.hasOwnProperty('object_id')) {
          selectedListId = feature.properties.object_id
          // greyout an RT with hsiEanbled true for frontier client
          if (this.state.configuration.ARO_CLIENT === 'frontier' &&
            (feature.properties._data_type === 'equipment.central_office' || feature.properties._data_type === 'equipment.dslam') &&
            (feature.properties.hsiEnabled !== 'true')) {
            entityImage = featureData.greyOutIcon
          }
        } else if (feature.properties.hasOwnProperty('id')) {
          selectedListId = feature.properties.id
        }
      }

      var geometry = feature.loadGeometry()
      
      // Geometry is an array of shapes
      var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
      var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0

      geometry.forEach((rawShape) => {
        const shape = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(rawShape)
        if (shape.length == 1) {
          // This is a point
          var x = shape[0].x + geometryOffset.x - imageWidthBy2
          var y = shape[0].y + geometryOffset.y - (imageHeightBy2 * 2)

          // Draw the location icons with its original color
          ctx.globalCompositeOperation = 'source-over'
          if (heatmapID === 'HEATMAP_OFF' || heatmapID === 'HEATMAP_DEBUG' || mapLayer.renderMode === 'PRIMITIVE_FEATURES') {
            var featureObj = {
              'ctx': ctx,
              'shape': shape,
              'feature': feature,
              'featureData': featureData,
              'geometryOffset': geometryOffset,
              'mapLayer': mapLayer,
              'mapLayers': this.mapLayers,
              'tileDataService': this.tileDataService,
              'selection': this.selection,
              oldSelection: this.oldSelection,
              'selectedLocationImage': selectedLocationImage,
              'lockOverlayImage': lockOverlayImage,
              'invalidatedOverlayImage': invalidatedOverlayImage,
              'selectedDisplayMode': this.selectedDisplayMode,
              'displayModes': this.displayModes,
              'analysisSelectionMode': this.analysisSelectionMode,
              'selectionModes': this.selectionModes,
              'equipmentLayerTypeVisibility': this.state.equipmentLayerTypeVisibility
            }
            pointFeatureRendererList.push(featureObj)
          } else {
            // Display heatmap
            var aggregationProperty = feature.properties.entity_count || feature.properties.weight
            if (aggregationProperty) {
              var adjustedWeight = Math.pow(+aggregationProperty, this.mapTileOptions.heatMap.powerExponent)
              heatMapData.push([x, y, adjustedWeight])
            }
          }
        } else {
          // Check if this is a closed polygon
          var firstPoint = shape[0]
          var lastPoint = shape[shape.length - 1]
          var isClosedPolygon = (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y)

          if (isClosedPolygon) {
            // First draw a filled polygon with the fill color
            // show siteboundaries for the equipments that are selected
            if (this.state.isFeatureLayerOnForBoundary(feature)) {
              var featureObj = { 'feature': feature,
                'shape': shape,
                'geometryOffset': geometryOffset,
                'ctx': ctx,
                'mapLayer': mapLayer,
                'layerCategories': this.layerCategories,
                'tileDataService': this.tileDataService,
                'styles': this.styles,
                'tileSize': this.tileSize,
                'selectedDisplayMode': this.selectedDisplayMode,
                'displayModes': this.displayModes,
                'analysisSelectionMode': this.analysisSelectionMode,
                'selectionModes': this.selectionModes }
              closedPolygonFeatureLayersList.push(featureObj)
              ctx.globalAlpha = 1.0
            }
          } else {
            // This is not a closed polygon. Render lines only
            ctx.globalAlpha = 1.0

            var drawingStyles = {}

            if ((this.oldSelection.details.roadSegments.size > 0 && this.highlightPolyline(feature, this.oldSelection.details.roadSegments)) ||
              (this.oldSelection.details.fiberSegments.size > 0 && this.highlightPolyline(feature, this.oldSelection.details.fiberSegments))) {
              // Highlight the Selected Polyline

              // ToDo: lineWidth should always be of the same type!
              var lineWidth = mapLayer.drawingOptions.lineWidth
              if (typeof mapLayer.drawingOptions.lineWidth === 'function') {
                lineWidth = mapLayer.drawingOptions.lineWidth(feature)
              }

              drawingStyles = {
                'lineWidth': lineWidth * 2,
                strokeStyle: mapLayer.drawingOptions.strokeStyle
              }
              if (mapLayer.highlightStyle) {
                drawingStyles = {
                  lineWidth: mapLayer.highlightStyle.lineWidth,
                  strokeStyle: mapLayer.highlightStyle.strokeStyle
                }
              }

            } else if (
              (this.state.showFiberSize || this.rShowFiberSize)
              && feature.properties._data_type === 'fiber'
              && (
                this.state.viewSetting.selectedFiberOption
                && this.state.viewSetting.selectedFiberOption.id !== 1
                || this.rViewSetting.selectedFiberOption.id !== 1
              )
            ) {

              var selectedFiberOption = this.rViewSetting.selectedFiberOption
              var viewOption = selectedFiberOption.pixelWidth
              drawingStyles = {
                lineWidth: TileUtilities.getFiberStrandSize(selectedFiberOption.field, feature.properties.fiber_strands, viewOption.min, viewOption.max, viewOption.divisor, viewOption.atomicDivisor),
                strokeStyle: mapLayer.strokeStyle
              }
            }
            // check if show conduit is on for this fiber type and change color accordingly
            // ToDo: this needs to be generalized to work with all types,
            //    .conduits and .roads shouldn't be hardcoded, they are dynamic from service
            if (feature.properties.spatial_edge_type &&
              mapLayer && mapLayer.tileDefinitions && 
              mapLayer.tileDefinitions.length > 0 && mapLayer.tileDefinitions[0].fiberType) {

              var edgeType = feature.properties.spatial_edge_type
              var fiberType = mapLayer.tileDefinitions[0].fiberType
              if (this.stateMapLayers.networkEquipment.cables[fiberType] &&
                this.stateMapLayers.networkEquipment.cables[fiberType].conduitVisibility[edgeType]) {

                if (this.stateMapLayers.networkEquipment.conduits[edgeType]) {
                  drawingStyles.strokeStyle = this.stateMapLayers.networkEquipment.conduits[edgeType].drawingOptions.strokeStyle
                } else if (this.stateMapLayers.networkEquipment.roads[edgeType]) {
                  drawingStyles.strokeStyle = this.stateMapLayers.networkEquipment.roads[edgeType].drawingOptions.strokeStyle
                }
              }
            }

            
            // road segments by tag
            if (feature.properties.feature_type_name === "road" && this.stateMapLayers.showSegmentsByTag) {
              let selectedEdgeConstructionType = null
              if (feature.properties.hasOwnProperty('edge_construction_type')) {
                // todo change the indecies if edgeConstructionTypes to the ID 
                selectedEdgeConstructionType = Object.values(this.stateMapLayers.edgeConstructionTypes).find(cType => {
                  return cType.isVisible && cType.id === feature.properties.edge_construction_type
                })
              }
              if (selectedEdgeConstructionType) {
                drawingStyles.styledStroke = StrokeStyle[selectedEdgeConstructionType.strokeType].styledStroke
              } else {
                drawingStyles.lineOpacity = 0.5 // ToDo: don't hard code this
              }
            }

            // lower opacity of fiber in plan edit mode
            if (this.selectedDisplayMode == this.displayModes.EDIT_PLAN && feature.properties._data_type === 'fiber'){
              drawingStyles.lineOpacity = 0.2
              drawingStyles.lineCap = 'butt'
            }
            PolylineFeatureRenderer.renderFeature(feature, shape, geometryOffset, ctx, mapLayer, drawingStyles, false, this.tileSize)
          }
        }
      })
    }
    
    if (this.state.deletedUncommitedMapObjects.length > 0) {
      const deletedObjectIds = this.state.deletedUncommitedMapObjects.map(mapObject => mapObject.objectId)
      
      closedPolygonFeatureLayersList = closedPolygonFeatureLayersList
      .filter(fatureLayerObject => !deletedObjectIds
        .includes(fatureLayerObject.feature.properties.object_id))

      featureData.layerToFeatures.FEATURES_FLATTENED = featureData.layerToFeatures.FEATURES_FLATTENED
      .filter(tileObject => !deletedObjectIds
        .includes(tileObject.properties.object_id))
    }
    // render point feature
    PointFeatureRenderer.renderFeatures(pointFeatureRendererList, this.state.configuration.ARO_CLIENT, this.selectedSubnetLocations, this.locationAlerts)
    // render polygon feature
    PolygonFeatureRenderer.renderFeatures(closedPolygonFeatureLayersList, featureData, this.selection, this.oldSelection)
  }

  highlightPolyline (feature, polylines) {
    var ishighlight = [...polylines].filter(function (polyline) {
      if (feature.properties && feature.properties._data_type) {
        const dataType = feature.properties._data_type
        if (dataType === 'fiber') {
          return polyline.link_id === feature.properties.link_id 
        } else if (dataType === 'existing_fiber.') { 
          return polyline.id === feature.properties.id 
        } else if (dataType === 'edge.fat') { 
          return polyline.gid === feature.properties.gid 
        }
      } 
    }).length > 0
    return ishighlight
  }

  // Hides the stale data marker for a tile
  hideStaleDataMarker (zoom, x, y) {
    const tileKeyPrefix = `${zoom}-${x}-${y}`
    const tileKeys = Object.keys(this.tileDataService.tileHtmlCache).filter(item => item.indexOf(tileKeyPrefix) === 0)
    tileKeys.forEach(tileKey => { this.tileDataService.tileHtmlCache[tileKey].staleDataDiv.style.display = 'none' })
  }
}

export default MapTileRenderer
