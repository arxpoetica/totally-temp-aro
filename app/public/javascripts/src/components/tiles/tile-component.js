/**
 * Directive to load map data in the form of tiles
 */
'use strict'

// Browserify includes
var Rx = require('rxjs')
var pointInPolygon = require('point-in-polygon')

class MapTileRenderer {

  constructor(tileSize, tileDataService, mapTileOptions, selectedLocations, selectedServiceAreas, selectedRoadSegment, mapLayers = []) {
    this.tileSize = tileSize
    this.tileDataService = tileDataService
    this.mapLayers = mapLayers
    this.mapTileOptions = mapTileOptions
    this.selectedLocations = selectedLocations
    this.selectedServiceAreas = selectedServiceAreas
    this.selectedRoadSegment = selectedRoadSegment
    this.renderBatches = []
    this.isRendering = false
    // Define a drawing margin in pixels. If we draw a circle at (0, 0) with radius 10,
    // part of it is going to get clipped. To overcome this, we add to our tile size.
    // So a 256x256 tile with margin = 10, becomes a 276x276 tile. The draw margin should
    // be such that the largest rendered feature (or heatmap) does not get clipped.
    this.drawMargins = 10
  }

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

  // Sets the selected service area ids
  setselectedServiceAreas(selectedServiceAreas) {
    this.selectedServiceAreas = selectedServiceAreas
    this.tileDataService.markHtmlCacheDirty()
  }

  // Sets the selected service area ids
  setSelectedRoadSegment(selectedRoadSegment) {
    this.selectedRoadSegment = selectedRoadSegment
    this.tileDataService.markHtmlCacheDirty()
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
    }
    this.mapLayers = mapLayers  // Set the object in any case
  }

  // Gets the tile id for given zoom and coords. Useful for setting div ids and cache keys
  getTileId(zoom, tileX, tileY) {
    return `mapTile_${zoom}_${tileX}_${tileY}`
  }

  // Starts the render queue. Does nothing if it has already started
  startRenderingRecursive() {

    // Rendering requests can come in from multiple sources - when Google Maps calls the getTile() method,
    // when the mapLayers change, or any other request. If we start rendering a tile WHILE a previous
    // request is still rendering it, then we get multiple renders on the same canvas. To prevent this,
    // we render tiles in "batches". A batch consists of an array of functions, and each function renders
    // one tile completely. Each render function in a batch is independent of the other tiles, so all of
    // them can be run asynchronously.
    // When a rendering request comes in, we push a rendering batch onto the queue. This function then
    // renders each batch one after the other. This also allows batches to be pushed onto the queue while
    // tiles are being rendered.

    if (this.isRendering) {
      return  // Nothing to do
    }

    if (this.renderBatches.length === 0) {
      this.isRendering = false  // We are done rendering all elements in the queue
      return
    }

    // Rendering batches are always added in pairs (one for 0-neighbours, one for 1-neighbours).
    // If we have more than two batches in the queue, skip to the last one.
    this.isRendering = true
    var renderingFunctions = this.renderBatches[0]
    this.renderBatches.splice(0, 1)
    var renderingPromises = []
    renderingFunctions.forEach((fn) => renderingPromises.push(fn()))
    Promise.all(renderingPromises)  // Wait for all rendering in this batch to be completed
      .then(() => {
        this.isRendering = false
        this.startRenderingRecursive()  // Call this function again. Until the queue is empty
      })
  }

  // Redraws cached tiles with the specified tile IDs
  redrawCachedTiles(tiles) {
    var renderBatch0 = [], renderBatch1 = []
    tiles.forEach((tile) => {
      var tileId = this.getTileId(tile.zoom, tile.x, tile.y)
      var cachedTile = this.tileDataService.tileHtmlCache[tileId]
      if (cachedTile) {
        var frontBufferCanvas = cachedTile.frontBufferCanvas
        var backBufferCanvas = cachedTile.backBufferCanvas
        var heatmapCanvas = cachedTile.heatmapCanvas
        // Re-render only if the tile is marked as dirty
        if (cachedTile.isDirty && frontBufferCanvas && backBufferCanvas) {
          var coord = { x: tile.x, y: tile.y }
          // We first render the tile without using data from neighbouring tiles. AFTER that is done, we render with
          // data from neighbouring tiles. All tile data is cached, so we don't make multiple trips to the server.
          // Ideally we could fire the two renders in parallel, but one some tiles, the 0-neighbour tile shows up
          // instead of the 1-neighbour tile. Debugging shows that they 1-neighbour tile has rendered after the
          // 0-neighbour tile, but thats not how it shows up on the screen. There is something going on with the
          // back buffer of the canvas. For now, just render them in order.
          renderBatch0.push(this.renderTile.bind(this, tile.zoom, coord, false, frontBufferCanvas, backBufferCanvas, heatmapCanvas))   // 0-neighbour tile
          renderBatch1.push(this.renderTile.bind(this, tile.zoom, coord, true, frontBufferCanvas, backBufferCanvas, heatmapCanvas))    // 1-neighbour tile
        }
      }
    })
    this.renderBatches.push(renderBatch0)
    this.renderBatches.push(renderBatch1)
    this.startRenderingRecursive()
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
    var tileId = this.getTileId(zoom, coord.x, coord.y)
    var div = null, frontBufferCanvas = null, backBufferCanvas = null, heatmapCanvas = null, isDirty = false
    var htmlCache = this.tileDataService.tileHtmlCache[tileId]
    if (htmlCache) {
      div = htmlCache.div
      frontBufferCanvas = htmlCache.frontBufferCanvas
      backBufferCanvas = htmlCache.backBufferCanvas
      heatmapCanvas = htmlCache.heatmapCanvas
      isDirty = htmlCache.isDirty
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
      isDirty = true  // Tile hasn't been rendered yet, so is dirty
      this.tileDataService.tileHtmlCache[tileId] = {
        div: div,
        frontBufferCanvas: frontBufferCanvas,
        backBufferCanvas: backBufferCanvas,
        heatmapCanvas: heatmapCanvas,
        isDirty: isDirty
      }
    }

    // Pass this tile to redrawCachedTiles(), that will take care of scheduling the render
    this.redrawCachedTiles([{
      zoom: zoom,
      x: coord.x,
      y: coord.y
    }])
    return div
  }

  // Renders all data for this tile
  renderTile(zoom, coord, useNeighbouringTileData, frontBufferCanvas, backBufferCanvas, heatmapCanvas) {
    // Render each tile synchronously (one after the other). Return a promise of the last rendered data layer
    var renderPromise = Promise.resolve()
    backBufferCanvas.getContext('2d').clearRect(0, 0, backBufferCanvas.width, backBufferCanvas.height)
    Object.keys(this.mapLayers).forEach((mapLayerKey) => {
      var mapLayer = this.mapLayers[mapLayerKey]
      if (mapLayer) {
        // This check is only when this.mapLayers gets modified by another thread while this loop is completing
        renderPromise = renderPromise.then(() => this.renderTileSingleMapLayer(zoom, coord, useNeighbouringTileData, backBufferCanvas, heatmapCanvas, mapLayerKey, mapLayer))
      }
    })
    return new Promise((resolve, reject) => {
      renderPromise
        .then(() => {
          // Copy the back buffer image onto the front buffer
          var ctx = frontBufferCanvas.getContext('2d')
          ctx.clearRect(0, 0, frontBufferCanvas.width, frontBufferCanvas.height)
          ctx.drawImage(backBufferCanvas, 0, 0)
          // All rendering has been done. Mark the cached HTML tile as not-dirty
          var tileId = this.getTileId(zoom, coord.x, coord.y)
          this.tileDataService.tileHtmlCache[tileId].isDirty = false
          resolve()
        })
    })
  }

  // Renders a single map layer onto this tile
  renderTileSingleMapLayer(zoom, coord, useNeighbouringTileData, canvas, heatmapCanvas, mapLayerId, mapLayer) {

    // Use neighbouring tile data only for heatmaps
    var numNeighbors = (useNeighbouringTileData && mapLayer.renderMode === 'HEATMAP') ? 1 : 0

    var tileDataPromises = []
    var tileDataOffsets = []
    for (var deltaY = -numNeighbors; deltaY <= numNeighbors; ++deltaY) {
      for (var deltaX = -numNeighbors; deltaX <= numNeighbors; ++deltaX) {
        tileDataOffsets.push({
          x: deltaX * this.tileSize.width,
          y: deltaY * this.tileSize.height
        })
        var xTile = coord.x + deltaX
        var yTile = coord.y + deltaY
        tileDataPromises.push(this.tileDataService.getTileData(mapLayer, zoom, xTile, yTile, mapLayer))
      }
    }
    tileDataPromises.push(this.tileDataService.getEntityImageForLayer('SELECTED_LOCATION'))

    // Return a promise that resolves when all the rendering is finished
    return new Promise((resolve, reject) => {
      Promise.all(tileDataPromises)
        .then((promiseResults) => {

          var entityImage = promiseResults[0].icon
          var selectedLocationImage = promiseResults[promiseResults.length - 1]
          var ctx = canvas.getContext('2d')
          ctx.lineWidth = 1
          var heatMapData = []

          for (var iResult = 0; iResult < promiseResults.length - 1; ++iResult) {
            var layerToFeatures = promiseResults[iResult].layerToFeatures
            var features = []
            Object.keys(layerToFeatures).forEach((layerKey) => features = features.concat(layerToFeatures[layerKey]))
            this.renderFeatures(ctx, features, entityImage, selectedLocationImage, tileDataOffsets[iResult], heatMapData, this.mapTileOptions.selectedHeatmapOption.id, mapLayer)
          }
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
          resolve() // All rendering has finished
      })
    })
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

  // Render a set of features on the map
  renderFeatures(ctx, features, entityImage, selectedLocationImage, geometryOffset, heatMapData, heatmapID, mapLayer) {
    ctx.globalAlpha = 1.0
    for (var iFeature = 0; iFeature < features.length; ++iFeature) {
      // Parse the geometry out.
      var feature = features[iFeature]
      var geometry = feature.loadGeometry()
      // Geometry is an array of shapes
      var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
      var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0
      geometry.forEach((shape) => {
        // Shape is an array of coordinates
        switch(shape.length) {
          case 1:
            // This is a point
            var x = this.drawMargins + shape[0].x + geometryOffset.x - imageWidthBy2
            var y = this.drawMargins + shape[0].y + geometryOffset.y - imageHeightBy2
            if (heatmapID === 'HEATMAP_OFF' || heatmapID === 'HEATMAP_DEBUG' || mapLayer.renderMode === 'PRIMITIVE_FEATURES') {
              // Display individual locations. Either because we are zoomed in, or we want to debug the heatmap rendering
              if (feature.properties.location_id && this.selectedLocations.has(+feature.properties.location_id)) {
                // Draw selected icon
                ctx.drawImage(selectedLocationImage, x, y)
              } else {
                ctx.drawImage(entityImage, x, y)
              }
            } else {
              // Display heatmap
              var aggregationProperty = feature.properties.entity_count || feature.properties.weight
              if (aggregationProperty) {
                var adjustedWeight = Math.pow(+aggregationProperty, this.mapTileOptions.heatMap.powerExponent)
                heatMapData.push([x, y, adjustedWeight])
              }
            }
            break;

          default:
            // Check if this is a closed polygon
            var firstPoint = shape[0]
            var lastPoint = shape[shape.length - 1]
            var isClosedPolygon = (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y)

            if (isClosedPolygon) {
              // First draw a filled polygon with the fill color
              this.renderPolygonFeature(feature, shape, geometryOffset, ctx, mapLayer)
              ctx.globalAlpha = 1.0
            } else {
              // This is not a closed polygon. Render lines only
              if (this.selectedRoadSegment.length > 0 && this.selectedRoadSegment[0].gid === feature.properties.gid) {
                //Highlight the selected Selected RoadSegments
                var drawingStyles = {
                  lineWidth: mapLayer.highlightStyle.lineWidth
                }
                this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles)
              } else {
                this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer)
              }
            }
            break;
        }
      })
    }
  }

  // Renders a polyline feature onto the canvas
  renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles) {

    ctx.strokeStyle = drawingStyles ? drawingStyles.strokeStyle : mapLayer.strokeStyle
    ctx.lineWidth = drawingStyles ? drawingStyles.lineWidth : (mapLayer.lineWidth || 1)

    var xPrev = shape[0].x + geometryOffset.x
    var yPrev = shape[0].y + geometryOffset.y
    ctx.beginPath()
    ctx.moveTo(this.drawMargins + xPrev, this.drawMargins + yPrev)
    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
      var xNext = shape[iCoord].x + geometryOffset.x
      var yNext = shape[iCoord].y + geometryOffset.y
      var isAlongXMin = (xPrev === 0 && xNext === 0)
      var isAlongXMax = (xPrev === this.tileSize.width && xNext === this.tileSize.width)
      var isAlongYMin = (yPrev === 0 && yNext === 0)
      var isAlongYMax = (yPrev === this.tileSize.height && yNext === this.tileSize.height)
      if (!isAlongXMin && !isAlongXMax && !isAlongYMin && !isAlongYMax) {
        // Segment is not along the tile extents. Draw it. We do this because polygons can be
        // clipped by the tile extents, and we don't want to draw segments along tile extents.
        ctx.lineTo(this.drawMargins + xNext, this.drawMargins + yNext)
      }
      xPrev = xNext
      yPrev = yNext
      ctx.moveTo(this.drawMargins + xPrev, this.drawMargins + yPrev)
    }
    ctx.stroke()
  }

  // Renders a polygon feature onto the canvas
  renderPolygonFeature(feature, shape, geometryOffset, ctx, mapLayer) {

    // Get the drawing styles for rendering the polygon
    var drawingStyles = this.getDrawingStylesForPolygon(feature, mapLayer)

    //Highlight the selected SA
    if(this.selectedServiceAreas.has(feature.properties.id)) {
      drawingStyles.strokeStyle = mapLayer.highlightStyle.strokeStyle
      drawingStyles.fillStyle = mapLayer.highlightStyle.fillStyle
      drawingStyles.opacity = mapLayer.highlightStyle.opacity
      ctx.globalCompositeOperation = 'multiply'
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
    this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer, drawingStyles)
  }

  // Computes the fill and stroke styles for polygon features
  getDrawingStylesForPolygon(feature, mapLayer) {

    // Set the default drawing styles that we will return in case we are not aggregating features
    var drawingStyles = {
      strokeStyle: mapLayer.strokeStyle,
      fillStyle: mapLayer.fillStyle,
      lineWidth: mapLayer.lineWidth || 1,
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
            
            if (this.selectedRoadSegment) {
              hitFeatures.push(this.selectedRoadSegment)
            }
          })
          // We have a list of features that are 'hit', i.e. under the specified point. Return them.
          resolve(hitFeatures)
        })
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
        } else if (feature.properties.code) {
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
        this.selectedRoadSegment = feature.properties
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
              && yWithinTile >= shape[0].y - imageHeightBy2
              && yWithinTile <= shape[0].y + imageHeightBy2) {
                // The clicked point is inside the bounding box of the features icon
                selectFeature = true
              }
        }
      })

      if(feature.properties.gid) {
        this.selectRoadSegment(feature, xWithinTile, yWithinTile, minimumRoadDistance)
      }

      //Load the selected service area 
      if(feature.properties.code) {
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

  constructor($document, state, tileDataService) {

    this.layerIdToMapTilesIndex = {}
    this.mapRef = null  // Will be set in $document.ready()
    this.state = state
    this.tileDataService = tileDataService
    this.areControlsEnabled = true

    // Subscribe to changes in the mapLayers subject
    state.mapLayers
      .debounceTime(100)
      .pairwise() // This will give us the previous value in addition to the current value
      .subscribe((pairs) => this.handleMapEvents(pairs[0], pairs[1], null))

    // Subscribe to changes in the plan (for setting center and zoom)
    state.plan
      .subscribe((plan) => {
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
    state.mapTileOptions
      .subscribe((mapTileOptions) => {
        if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
          this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapTileOptions(mapTileOptions)
        }
      })

    // Redraw map tiles when requestd
    state.requestMapLayerRefresh
      .subscribe((newValue) => {
        this.tileDataService.markHtmlCacheDirty()
        this.refreshMapTiles()
      })

    // If selected location ids change, set that in the tile data service
    state.selectedLocations
      .subscribe((selectedLocations) => {
        if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
          this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedLocations(selectedLocations)
        }
      })

    // If selected service_area ids change, set that in the tile data service
    state.selectedServiceAreas
    .subscribe((selectedServiceAreas) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedServiceAreas(selectedServiceAreas)
      }
    })

    // If selected road_segment ids change, set that in the tile data road
    state.selectedRoadSegments
    .subscribe((selectedRoadSegment) => {
      if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
        this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setSelectedRoadSegment(selectedRoadSegment)
      }
    })

    // Set the map zoom level
    state.requestSetMapZoom
      .subscribe((zoom) => {
        if (this.mapRef) {
          this.mapRef.setZoom(zoom)
        }
      })

    // To change the center of the map to given LatLng 
    state.requestSetMapCenter
      .subscribe((mapCenter) => {
        if (this.mapRef) {
          this.mapRef.panTo({ lat: mapCenter.latitude, lng: mapCenter.longitude })
        }
      })
    
    tileDataService.addEntityImageForLayer('SELECTED_LOCATION', state.selectedLocationIcon)

    this.DELTA = Object.freeze({
      IGNORE: 0,
      DELETE: 1,
      UPDATE: 2
    })
    this.TILE_SIZE = 256

    this.state.requestPolygonSelect
      .subscribe((args) => {
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
            
            results.forEach((result) => {
              result.forEach((selectedObj) => {
                if (selectedObj.location_id) {
                  selectedLocations.add(selectedObj.location_id)
                } else if(selectedObj.id) {
                  selectedServiceAreas.add(selectedObj.id)
                }
              })
            })

            var selectedLocationsIds = []
            var selectedServiceAreaIds = []
            
            selectedLocations.forEach((id) => selectedLocationsIds.push({ location_id: id }))
            selectedServiceAreas.forEach((id) => selectedServiceAreaIds.push({ id: id }))
            
            state.hackRaiseEvent(selectedLocationsIds)

            //Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
            if (this.areControlsEnabled) {
              state.mapFeaturesSelectedEvent.next({
                locations: selectedLocationsIds,
                serviceAreas: selectedServiceAreaIds
              })
            }
          })

      })

    $document.ready(() => {
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]
      this.mapRef.overlayMapTypes.push(new MapTileRenderer(new google.maps.Size(this.TILE_SIZE, this.TILE_SIZE), 
                                                           this.tileDataService,
                                                           this.state.mapTileOptions.getValue(),
                                                           this.state.selectedLocations.getValue(),
                                                           this.state.selectedServiceAreas.getValue(),
                                                           this.state.selectedRoadSegments.getValue()
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
            var serviceAreaFeatures = []
            var roadFeatures = []
            
            results.forEach((result) => {
              if(result.length > 0 && result[0].location_id) {
                hitFeatures = hitFeatures.concat(result)
              } else if (result.length > 0 && result[0].code) {
                serviceAreaFeatures = serviceAreaFeatures.concat(result)
              } else if (result.length > 0 && result[0].gid) {
                roadFeatures = roadFeatures.concat(result)
              }
            })

            if (hitFeatures.length > 0) {
              state.hackRaiseEvent(hitFeatures)
            }

            //Locations or service areas can be selected in Analysis Mode and when plan is in START_STATE/INITIALIZED
            if (state.selectedDisplayMode.getValue() === state.displayModes.ANALYSIS && this.areControlsEnabled) {
              state.mapFeaturesSelectedEvent.next({
                locations: hitFeatures,
                serviceAreas: serviceAreaFeatures
              })
            }

            //Locations Info is shown in View Mode
            if (state.selectedDisplayMode.getValue() === state.displayModes.VIEW) {
              state.showLocationInfo.next({
                locations: hitFeatures
              })
            }

            if(roadFeatures) {
              state.mapFeaturesSelectedEvent.next({
                roadSegment: roadFeatures
              })
            }

          })
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

    // First get a list of tiles that are visible on the screen. We will only redraw these ones
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

    // Redraw cached tiles
    this.mapRef.overlayMapTypes.forEach((overlayMap, index) => {
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

TileComponentController.$inject = ['$document', 'state', 'tileDataService']

app.component('tile', {
  template: '',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: TileComponentController
})

