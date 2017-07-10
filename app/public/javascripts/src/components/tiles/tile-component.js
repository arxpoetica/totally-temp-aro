/**
 * Directive to load map data in the form of tiles
 */
'use strict'

// Important: RxJS must have been included using browserify before this point
var Rx = require('rxjs')

class MapTileRenderer {

  constructor(tileSize, rootPlanId, layerProperties, tileDataService) {
    this.tileSize = tileSize
    this.rootPlanId = rootPlanId
    this.layerProperties = layerProperties
    this.tileDataService = tileDataService
    // Define a drawing margin in pixels. If we draw a circle at (0, 0) with radius 10,
    // part of it is going to get clipped. To overcome this, we add to our tile size.
    // So a 256x256 tile with margin = 10, becomes a 276x276 tile. The draw margin should
    // be such that the largest rendered feature (or heatmap) does not get clipped.
    this.drawMargins = 50
  }

  // This method is called by Google Maps. Render a canvas tile and send it back.
  getTile(coord, zoom, ownerDocument) {
    // We create a div with a parent canvas. This is because the canvas needs to have its top-left
    // corner offset by the margin. If we just use canvas, google maps sets the top-left to (0, 0)
    // regardless of what we give in the style.left/style.top properties
    var div = ownerDocument.createElement('div')
    div.id = `map_tile_${this.layerProperties.id}_${zoom}_${coord.x}_${coord.y}`
    var canvas = ownerDocument.createElement('canvas');
    div.appendChild(canvas)
    canvas.style.position = 'absolute'
    canvas.style.left = `-${this.drawMargins}px`
    canvas.style.top = `-${this.drawMargins}px`
    canvas.width = this.tileSize.width + this.drawMargins * 2;
    canvas.height = this.tileSize.height + this.drawMargins * 2;

    if (!this.layerProperties.data.isVisible) {
      // Layer is invisible
      return div
    }

    if (this.layerProperties.data.drawingOptions.showTileExtents) {
      canvas.style.border = "2px dotted";
    }

    // Get tile data from service
    var promises = [
      this.tileDataService.getTileData([this.layerProperties.data.url], zoom, coord.x, coord.y),
      this.tileDataService.getEntityImageForLayer(this.layerProperties.id)
    ]
    Promise.all(promises)
      .then((promiseResults) => {

        var layerToFeatures = promiseResults[0]
        var entityImage = promiseResults[1]

        var heatMapData = []
        var maxWeightForHeatMap = 1

        // Response will be an array of objects
        var ctx=canvas.getContext("2d");
        ctx.fillStyle = this.layerProperties.data.drawingOptions.fillStyle
        ctx.strokeStyle = this.layerProperties.data.drawingOptions.strokeStyle
        ctx.lineWidth = 3
        Object.keys(layerToFeatures).forEach((layerKey) => {
          var features = layerToFeatures[layerKey]
          for (var iFeature = 0; iFeature < features.length; ++iFeature) {
            // Parse the geometry out.
            var feature = features[iFeature]
            var geometry = feature.loadGeometry()
            // console.log(JSON.stringify(geometry))
            // Geometry is an array of shapes
            var imageWidthBy2 = entityImage.width / 2
            var imageHeightBy2 = entityImage.height / 2
            geometry.forEach((shape) => {
              // Shape is an array of coordinates
              switch(shape.length) {
                case 1:
                  // This is a point
                  var x = this.drawMargins + shape[0].x - imageWidthBy2
                  var y = this.drawMargins + shape[0].y - imageHeightBy2
                  if (feature.properties.weight) {
                    heatMapData.push([x, y, +feature.properties.weight])
                    maxWeightForHeatMap = Math.max(maxWeightForHeatMap, +feature.properties.weight)
                  } else {
                    ctx.drawImage(entityImage, x, y)
                  }
                  break;

                default:
                  // Check if this is a closed polygon
                  var firstPoint = shape[0]
                  var lastPoint = shape[shape.length - 1]
                  var isClosedPolygon = (firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y)

                  if (isClosedPolygon) {
                    // First draw a filled polygon with the fill color
                    var fillAlpha = 0.5
                    if (this.layerProperties.data.drawingOptions.alphaThreshold) {
                      // We want to set the transparency based on a threshold provided in drawing options
                      var thresholdProperty = this.layerProperties.data.drawingOptions.alphaThreshold.property
                      var maxValue = this.layerProperties.data.drawingOptions.alphaThreshold.maxValue
                      if (!maxValue || maxValue === 0) {
                        maxValue = 1.0  // Prevent any divide-by-zeros
                      }
                      if (feature.properties[thresholdProperty]) {
                        fillAlpha = Math.min(1.0, feature.properties[thresholdProperty] / maxValue)
                      }
                    }
                    ctx.globalAlpha = fillAlpha
                    var x0 = this.drawMargins + shape[0].x
                    var y0 = this.drawMargins + shape[0].y
                    ctx.beginPath()
                    ctx.moveTo(x0, y0)
                    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
                      var x1 = this.drawMargins + shape[iCoord].x
                      var y1 = this.drawMargins + shape[iCoord].y
                      ctx.lineTo(x1, y1)
                    }
                    ctx.fill()
                    // Then draw a polyline except for the lines that are along the tile extents
                    var xPrev = shape[0].x
                    var yPrev = shape[0].y
                    ctx.beginPath()
                    ctx.moveTo(this.drawMargins + xPrev, this.drawMargins + yPrev)
                    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
                      var xNext = shape[iCoord].x
                      var yNext = shape[iCoord].y
                      var isAlongXMin = (xPrev === 0 && xNext === 0)
                      var isAlongXMax = (xPrev === 256 && xNext === 256)
                      var isAlongYMin = (yPrev === 0 && yNext === 0)
                      var isAlongYMax = (yPrev === 256 && yNext === 256)
                      if (!isAlongXMin && !isAlongXMax && !isAlongYMin && !isAlongYMax) {
                        // Segment is not along the tile extents. Draw it.
                        ctx.lineTo(this.drawMargins + xNext, this.drawMargins + yNext)
                      }
                      xPrev = xNext
                      yPrev = yNext
                      ctx.moveTo(this.drawMargins + xPrev, this.drawMargins + yPrev)
                    }
                    ctx.stroke()
                    ctx.globalAlpha = 1.0
                  } else {
                    // This is not a closed polygon. Draw all the lines
                    var x0 = this.drawMargins + shape[0].x
                    var y0 = this.drawMargins + shape[0].y
                    ctx.beginPath()
                    ctx.moveTo(x0, y0)
                    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
                      var x1 = this.drawMargins + shape[iCoord].x
                      var y1 = this.drawMargins + shape[iCoord].y
                      ctx.lineTo(x1, y1)
                    }
                    ctx.stroke()
                  }
                  break;
              }
            })
          }
        })
        if (heatMapData.length > 0) {
          var heatMapRenderer = simpleheat(canvas)
          heatMapRenderer.data(heatMapData)
          heatMapRenderer.max(maxWeightForHeatMap)
          heatMapRenderer.radius(20, 20)
          heatMapRenderer.draw(0.0)
        }
        if (this.layerProperties.data.drawingOptions.showTileExtents) {
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
          var coordString = `z / x / y : ${zoom} / ${coord.x} / ${coord.y}`
          ctx.strokeText(coordString, canvas.width / 2, canvas.height /2)
          ctx.fillText(coordString, canvas.width / 2, canvas.height /2)
        }
    })
    return div
  }

  // Show/hide map tile extents
  setMapTileExtentsVisibility(showMapTileExtents) {
    this.layerProperties.data.drawingOptions.showTileExtents = showMapTileExtents
  }

  // Perform hit detection on features and get the first one (if any) under the mouse
  performHitDetection(tileZoom, tileX, tileY, xWithinTile, yWithinTile) {

    // Get tile data from service
    var promises = [
      this.tileDataService.getTileData([this.layerProperties.data.url], tileZoom, tileX, tileY),
      this.tileDataService.getEntityImageForLayer(this.layerProperties.id)
    ]
    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((promiseResults) => {

          var layerToFeatures = promiseResults[0]
          var entityImage = promiseResults[1]

          var imageWidthBy2 = entityImage.width / 2
          var imageHeightBy2 = entityImage.height / 2

          Object.keys(layerToFeatures).forEach((layerKey) => {
            var features = layerToFeatures[layerKey]
            // console.log('layer has ' + layer.length + ' features')
            for (var iFeature = 0; iFeature < features.length; ++iFeature) {
              // Parse the geometry out.
              var geometry = features[iFeature].loadGeometry()
              // Geometry is an array of shapes
              var imageWidthBy2 = entityImage.width / 2
              var imageHeightBy2 = entityImage.height / 2
              geometry.forEach((shape) => {
                // Shape is an array of coordinates
                switch(shape.length) {
                  case 1:
                    // This is a point
                    if (xWithinTile >= shape[0].x - imageWidthBy2
                        && xWithinTile <= shape[0].x + imageWidthBy2
                        && yWithinTile >= shape[0].y - imageHeightBy2
                        && yWithinTile <= shape[0].y + imageHeightBy2) {
                          console.log('FEATURE DETECTED')
                          console.log(features[iFeature].properties)
                          resolve(features[iFeature].properties)
                        }
                    break;

                  default:
                    // Not supported yet
                    break;
                }
              })
            }
          })
          resolve(null)
        })
    })
  }
}

class TileComponentController {

  constructor($document, state, tileDataService) {

    // Subscribe to changes in the mapLayers subject
    state.mapLayers
      .pairwise() // This will give us the previous value in addition to the current value
      .subscribe((pairs) => this.handleMapEvents(pairs[0], pairs[1]))

    state.showMapTileExtents
      .subscribe((showMapTileExtents) => this.handleShowMapTileExtentsChanged(showMapTileExtents))

    this.layerIdToMapTilesIndex = {}
    this.mapRef = null  // Will be set in $document.ready()
    this.tileDataService = tileDataService

    this.DELTA = Object.freeze({
      IGNORE: 0,
      DELETE: 1,
      UPDATE: 2
    })
    this.TILE_SIZE = 256

    $document.ready(() => {
      // Saving a reference to the global map object. Ideally should be passed in to the component,
      // but don't know how to set it from markup
      this.mapRef = map
      this.mapRef.addListener('click', (event) => {

        // Get latitiude and longitude
        var lat = event.latLng.lat()
        var lng = event.latLng.lng()

        // Get zoom
        var zoom = this.mapRef.getZoom()

        // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
        var tileCoords = this.getTileCoordinates(zoom, lat, lng)

        // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
        // 1. Get the top left coordinates of the tile in lat lngs
        var nwCornerLatLng = this.getNWTileCornerLatLng(zoom, tileCoords.x, tileCoords.y)
        // 2. Convert to pixels
        var nwCornerPixels = this.getPixelCoordinatesFromLatLng(nwCornerLatLng, zoom)
        // 3. Convert the clicked lat lng to pixels
        var clickedPointPixels = this.getPixelCoordinatesFromLatLng({ lat: lat, lng: lng }, zoom)
        var xWithinTile = clickedPointPixels.x - nwCornerPixels.x
        var yWithinTile = clickedPointPixels.y - nwCornerPixels.y

        var hitPromises = []
        this.mapRef.overlayMapTypes.forEach((mapOverlay) => {
          hitPromises.push(mapOverlay.performHitDetection(zoom, tileCoords.x, tileCoords.y, xWithinTile, yWithinTile))
        })
        Promise.all(hitPromises)
          .then((results) => {
            var hitFeature = null
            results.forEach((result) => {
              if (result && result.location_id) {
                hitFeature = result
              }
            })
            if (hitFeature && hitFeature.location_id) {
              state.hackRaiseEvent(hitFeature)
            }
          })

      })
    })
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

  // Called when the value of showing map tile extents (for debugging) changes
  handleShowMapTileExtentsChanged(showMapTileExtents) {
    if (!this.mapRef) {
      // Map not initialized yet. Try again after some time
      setTimeout(() => this.handleShowMapTileExtentsChanged(showMapTileExtents), 100)
      return
    }

    this.mapRef.overlayMapTypes.forEach((overlayMap, index) => {
      overlayMap.setMapTileExtentsVisibility(showMapTileExtents)
      // Hacky way to get google maps to redraw the tiles
      this.mapRef.overlayMapTypes.setAt(index, null)
      this.mapRef.overlayMapTypes.setAt(index, overlayMap)
    })
  }

  // Handles map layer events
  handleMapEvents(oldMapLayers, newMapLayers) {
    if (!this.mapRef) {
      // Map not initialized yet
      return
    }
    // We have a new set of map layers. Determine which ones to update and which ones to delete
    var mapLayerActions = this.computeMapLayerActions(oldMapLayers, newMapLayers)
    console.log('-------- Actions')
    console.log(mapLayerActions)

    // First delete any map layers that we want
    for (var iOverlay = 0; iOverlay < this.mapRef.overlayMapTypes.length; ++iOverlay) {
      var overlayId = this.mapRef.overlayMapTypes.getAt(iOverlay).layerProperties.id
      if (mapLayerActions[overlayId] === this.DELTA.DELETE) {
        this.mapRef.overlayMapTypes.removeAt(iOverlay)
        --iOverlay
      }
    }

    // Then update any map layers that we want
    var mapExistingLayers = {}
    this.mapRef.overlayMapTypes.forEach((overlayMapType, index) => mapExistingLayers[overlayMapType.layerProperties.id] = index)
    Object.keys(newMapLayers).forEach((key) => {
      var mapLayer = newMapLayers[key]
      if (mapLayerActions[key] === this.DELTA.UPDATE) {
        this.tileDataService.addEntityImageForLayer(key, mapLayer.iconUrl)
        var tileRenderer = new MapTileRenderer(new google.maps.Size(this.TILE_SIZE, this.TILE_SIZE), 1075, {id: key, data: mapLayer}, this.tileDataService)
        if (key in mapExistingLayers) {
          // Tile exists in maps. Replace it
          var index = mapExistingLayers[key]
          this.mapRef.overlayMapTypes.setAt(index, tileRenderer)
        } else {
          // Tile does not already exist in maps
          console.log('Added')
          this.mapRef.overlayMapTypes.push(tileRenderer)
        }
      }
    })
  }

  // Compares old and new mapLayers objects and returns the list of layers to be added/updated and removed
  computeMapLayerActions(oldMapLayers, newMapLayers) {

    // First mark the layers to update
    var mapLayerActions = {}
    Object.keys(newMapLayers).forEach((newMapLayerKey) => {
      mapLayerActions[newMapLayerKey] = this.DELTA.IGNORE
      if (!oldMapLayers[newMapLayerKey]) {
        // Map layer key does not exist in old layers. Add it
        mapLayerActions[newMapLayerKey] = this.DELTA.UPDATE
      } else {
        var newObj = newMapLayers[newMapLayerKey]
        var oldObj = oldMapLayers[newMapLayerKey]
        // Quick check with stringifys. Objects are very small.
        if (JSON.stringify(newObj) !== JSON.stringify(oldObj)) {
          mapLayerActions[newMapLayerKey] = this.DELTA.UPDATE
        }
      }
    })

    // Then mark the layers to delete
    Object.keys(oldMapLayers).forEach((oldMapLayerKey) => {
      if (!newMapLayers[oldMapLayerKey]) {
        mapLayerActions[oldMapLayerKey] = this.DELTA.DELETE
      }
    })

    return mapLayerActions
  }
}

TileComponentController.$inject = ['$document', 'state', 'tileDataService']

app.component('tile', {
  template: '',
  bindings: { },
  controller: TileComponentController
})

