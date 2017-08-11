/**
 * Directive to load map data in the form of tiles
 */
'use strict'

// Browserify includes
var Rx = require('rxjs')
var pointInPolygon = require('point-in-polygon')

class MapTileRenderer {

  constructor(tileSize, tileDataService, mapTileOptions, selectedLocations, mapLayers = []) {
    this.tileSize = tileSize
    this.tileDataService = tileDataService
    this.mapLayers = mapLayers
    this.mapTileOptions = mapTileOptions
    this.selectedLocations = selectedLocations
    // Define a drawing margin in pixels. If we draw a circle at (0, 0) with radius 10,
    // part of it is going to get clipped. To overcome this, we add to our tile size.
    // So a 256x256 tile with margin = 10, becomes a 276x276 tile. The draw margin should
    // be such that the largest rendered feature (or heatmap) does not get clipped.
    this.drawMargins = 10
  }

  // Sets the global tile options
  setMapTileOptions(mapTileOptions) {
    this.mapTileOptions = mapTileOptions
  }

  // Sets the selected location ids
  setselectedLocations(selectedLocations) {
    this.selectedLocations = selectedLocations
  }

  // Sets the map layers for this renderer
  setMapLayers(mapLayers) {
    this.mapLayers = mapLayers
  }

  // This method is called by Google Maps. Render a canvas tile and send it back.
  getTile(coord, zoom, ownerDocument) {
    // We create a div with a parent canvas. This is because the canvas needs to have its top-left
    // corner offset by the margin. If we just use canvas, google maps sets the top-left to (0, 0)
    // regardless of what we give in the style.left/style.top properties
    var div = ownerDocument.createElement('div')
    div.id = `map_tile_${zoom}_${coord.x}_${coord.y}`
    var canvas = ownerDocument.createElement('canvas');
    div.appendChild(canvas)
    canvas.style.position = 'absolute'
    var borderWidth = 0
    if (this.mapTileOptions.showTileExtents) {
      borderWidth = 2
    }
    canvas.style.left = `-${this.drawMargins + borderWidth}px`
    canvas.style.top = `-${this.drawMargins + borderWidth}px`
    canvas.width = this.tileSize.width + this.drawMargins * 2;
    canvas.height = this.tileSize.height + this.drawMargins * 2;

    if (this.mapTileOptions.showTileExtents) {
      canvas.style.border = `${borderWidth}px dotted`
    }

    // We first render the tile without using data from neighbouring tiles. AFTER that is done, we render with
    // data from neighbouring tiles. All tile data is cached, so we don't make multiple trips to the server.
    // Ideally we could fire the two renders in parallel, but one some tiles, the 0-neighbour tile shows up
    // instead of the 1-neighbour tile. Debugging shows that they 1-neighbour tile has rendered after the
    // 0-neighbour tile, but thats not how it shows up on the screen. There is something going on with the
    // back buffer of the canvas. For now, just render them in order.
    this.renderTile(zoom, coord, false, canvas)                // 0-neighbour tile
      .then(() => this.renderTile(zoom, coord, true, canvas))  // 1-neighbour tile
    return div
  }

  // Renders all data for this tile
  renderTile(zoom, coord, useNeighbouringTileData, canvas) {
    // Render each tile synchronously (one after the other). Return a promise of the last rendered data layer
    var renderPromise = Promise.resolve()
    Object.keys(this.mapLayers).forEach((mapLayerKey) => {
      renderPromise = renderPromise.then(() => this.renderTileSingleMapLayer(zoom, coord, useNeighbouringTileData, canvas, mapLayerKey, this.mapLayers[mapLayerKey]))
    })
    return renderPromise
  }

  // Renders a single map layer onto this tile
  renderTileSingleMapLayer(zoom, coord, useNeighbouringTileData, canvas, mapLayerId, mapLayer) {

    // Use neighbouring tile data only for heatmaps
    if (useNeighbouringTileData && mapLayer.renderMode !== 'HEATMAP') {
      return Promise.resolve()
    }

    // Get tile data from service
    var numNeighbors = useNeighbouringTileData ? 1 : 0
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
          var ctx = canvas.getContext("2d")
          ctx.lineWidth = 1
          var heatMapData = []

          for (var iResult = 0; iResult < promiseResults.length - 1; ++iResult) {
            var layerToFeatures = promiseResults[iResult].layerToFeatures
            var features = []
            Object.keys(layerToFeatures).forEach((layerKey) => features = features.concat(layerToFeatures[layerKey]))
            this.renderFeatures(ctx, features, entityImage, selectedLocationImage, tileDataOffsets[iResult], heatMapData, this.mapTileOptions.selectedHeatmapOption.id, mapLayer)
          }
          if (heatMapData.length > 0 && this.mapTileOptions.selectedHeatmapOption.id === 'HEATMAP_ON') {
            var heatMapRenderer = simpleheat(canvas)
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
            ctx.clearRect(0, 0, this.tileSize.width + this.drawMargins * 2, this.drawMargins)
            ctx.clearRect(0, this.tileSize.height + this.drawMargins, this.tileSize.width + this.drawMargins * 2, this.drawMargins)
            ctx.clearRect(0, 0, this.drawMargins, this.tileSize.height + this.drawMargins * 2)
            ctx.clearRect(this.tileSize.width + this.drawMargins, 0, this.drawMargins, this.tileSize.height + this.drawMargins * 2)
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
      // Draw a rectangle showing the tile (not the margins)
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
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
    for (var iFeature = 0; iFeature < features.length; ++iFeature) {
      // Parse the geometry out.
      var feature = features[iFeature]
      var geometry = feature.loadGeometry()
      // Geometry is an array of shapes
      var imageWidthBy2 = entityImage.width / 2
      var imageHeightBy2 = entityImage.height / 2
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
              this.renderPolylineFeature(shape, geometryOffset, ctx, mapLayer)
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
      lineWidth: 1,
      opacity: 0.7
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

  // Gets all features that are within a given polygon
  getPointsInPolygon(tileZoom, tileX, tileY, polygonCoords) {

    var promises = []
    Object.keys(this.mapLayers).forEach((mapLayerKey) => {
      var mapLayer = this.mapLayers[mapLayerKey]
      if (mapLayer.selectable) {
        promises.push(this.tileDataService.getTileData(mapLayer, tileZoom, tileX, tileY))
      }
    })
    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((promiseResults) => {

          var hitFeatures = []
          promiseResults.forEach((result) => {
            var layerToFeatures = result.layerToFeatures
            var entityImage = result.icon

            var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
            var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0

            Object.keys(layerToFeatures).forEach((layerKey) => {
              var features = layerToFeatures[layerKey]
              for (var iFeature = 0; iFeature < features.length; ++iFeature) {
                var feature = features[iFeature]
                // Parse the geometry out.
                var geometry = feature.loadGeometry()
                // Geometry is an array of shapes
                geometry.forEach((shape) => {
                  if (shape.length === 1) {
                    // Only support points for now
                    var locationCoords = [shape[0].x, shape[0].y]
                    var isPointInPolygon = pointInPolygon(locationCoords, polygonCoords)
                    if (isPointInPolygon) {
                      hitFeatures.push(feature.properties)
                    }
                  }
                })
              }
            })
          })
          // We have a list of features that are 'hit', i.e. under the specified point. Return them.
          resolve(hitFeatures)
        })
    })
  }

  // Perform hit detection on features and get the first one (if any) under the mouse
  performHitDetection(tileZoom, tileX, tileY, xWithinTile, yWithinTile) {

    var promises = []
    Object.keys(this.mapLayers).forEach((mapLayerKey) => {
      var mapLayer = this.mapLayers[mapLayerKey]
      if (mapLayer.selectable) {
        promises.push(this.tileDataService.getTileData(mapLayer, tileZoom, tileX, tileY))
      }
    })
    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((promiseResults) => {

          var hitFeatures = []
          promiseResults.forEach((result) => {
            var layerToFeatures = result.layerToFeatures
            var entityImage = result.icon

            var imageWidthBy2 = entityImage ? entityImage.width / 2 : 0
            var imageHeightBy2 = entityImage ? entityImage.height / 2 : 0

            Object.keys(layerToFeatures).forEach((layerKey) => {
              var features = layerToFeatures[layerKey]
              for (var iFeature = 0; iFeature < features.length; ++iFeature) {
                // Parse the geometry out.
                var geometry = features[iFeature].loadGeometry()
                // Geometry is an array of shapes
                geometry.forEach((shape) => {
                  // Shape is an array of coordinates
                  switch(shape.length) {
                    case 1:
                      // This is a point
                      if (xWithinTile >= shape[0].x - imageWidthBy2
                          && xWithinTile <= shape[0].x + imageWidthBy2
                          && yWithinTile >= shape[0].y - imageHeightBy2
                          && yWithinTile <= shape[0].y + imageHeightBy2) {
                            hitFeatures.push(features[iFeature].properties)
                          }
                      break;

                    default:
                      // Not supported yet
                      break;
                  }
                })
              }
            })
          })
          // We have a list of features that are 'hit', i.e. under the specified point. Return them.
          resolve(hitFeatures)
        })
    })
  }
}

class TileComponentController {

  constructor($document, state, tileDataService) {

    // Subscribe to changes in the mapLayers subject
    state.mapLayers
      .pairwise() // This will give us the previous value in addition to the current value
      .subscribe((pairs) => this.handleMapEvents(pairs[0], pairs[1], null))

    // Subscribe to changes in the map tile options
    state.mapTileOptions
      .subscribe((mapTileOptions) => {
        if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
          this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setMapTileOptions(mapTileOptions)
        }
      })

    // Redraw map tiles when requestd
    state.requestMapLayerRefresh
      .subscribe((newValue) => this.refreshMapTiles())

    // If selected location ids change, set that in the tile data service
    state.selectedLocations
      .subscribe((selectedLocations) => {
        if (this.mapRef && this.mapRef.overlayMapTypes.getLength() > this.OVERLAY_MAP_INDEX) {
          this.mapRef.overlayMapTypes.getAt(this.OVERLAY_MAP_INDEX).setselectedLocations(selectedLocations)
        }
      })

    tileDataService.addEntityImageForLayer('SELECTED_LOCATION', state.selectedLocationIcon)

    this.layerIdToMapTilesIndex = {}
    this.mapRef = null  // Will be set in $document.ready()
    this.state = state
    this.tileDataService = tileDataService

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
            console.log(convertedPixelCoords)

            // Get the locations from this tile that are in the polygon
            this.mapRef.overlayMapTypes.forEach((mapOverlay) => {
              pointInPolyPromises.push(mapOverlay.getPointsInPolygon(zoom, tileCoords.x, tileCoords.y, convertedPixelCoords))
            })
          }
        }
        Promise.all(pointInPolyPromises)
          .then((results) => {
            var selectedLocations = new Set()
            results.forEach((result) => {
              result.forEach((locationObj) => selectedLocations.add(locationObj.location_id))
            })
            var selectedLocationsIds = []
            selectedLocations.forEach((id) => selectedLocationsIds.push({ location_id: id }))
            state.hackRaiseEvent(selectedLocationsIds)
          })

      })

    $document.ready(() => {
      // Saving a reference to the global map object. Ideally should be passed in to the component,
      // but don't know how to set it from markup
      this.mapRef = map
      this.mapRef.overlayMapTypes.push(new MapTileRenderer(new google.maps.Size(this.TILE_SIZE, this.TILE_SIZE), 
                                                           this.tileDataService,
                                                           this.state.mapTileOptions.getValue(),
                                                           this.state.selectedLocations.getValue()))
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
            results.forEach((result) => {
              hitFeatures = hitFeatures.concat(result)
            })
            if (hitFeatures.length > 0) {
              state.hackRaiseEvent(hitFeatures)
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
    if (this.mapRef) {
      // Hacky way to get google maps to redraw the tiles
      this.mapRef.overlayMapTypes.forEach((overlayMap, index) => {
        this.mapRef.overlayMapTypes.setAt(index, null)
        this.mapRef.overlayMapTypes.setAt(index, overlayMap)
      })
    }
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
}

TileComponentController.$inject = ['$document', 'state', 'tileDataService']

app.component('tile', {
  template: '',
  bindings: { },
  controller: TileComponentController
})

