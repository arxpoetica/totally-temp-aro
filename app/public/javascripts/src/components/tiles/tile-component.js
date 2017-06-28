/**
 * Directive to load map data in the form of tiles
 */
'use strict'

  class MapTileRenderer {
    
    constructor(tileSize, rootPlanId, layerProperties, tileDataService) {
      this.tileSize = tileSize
      this.rootPlanId = rootPlanId
      this.layerProperties = layerProperties
      this.tileDataService = tileDataService
      // Define a drawing margin in pixels. If we draw a circle at (0, 0) with radius 10,
      // part of it is going to get clipped. To overcome this, we add to our tile size.
      // So a 256x256 tile with margin = 10, becomes a 276x276 tile. The draw margin should
      // be such that the largest rendered feature does not get clipped.
      this.drawMargins = 10
    }

    // This method is called by Google Maps. Render a canvas tile and send it back.
    getTile(coord, zoom, ownerDocument) {
      var canvas = ownerDocument.createElement('canvas');
      canvas.width = this.tileSize.width + this.drawMargins * 2;
      canvas.height = this.tileSize.height + this.drawMargins * 2;
      if (this.layerProperties.data.drawingOptions.showTileExtents) {
        canvas.style.border = "2px dotted";
      }
      
      // Get tile data from service
      var tileObj = this
      this.tileDataService.getTileData(this.layerProperties.data.url + `${zoom}/${coord.x}/${coord.y}.mvt`)
        .then((mapboxVectorTile) => {

          // Response will be an array of objects 
          var ctx=canvas.getContext("2d");
          ctx.fillStyle = tileObj.layerProperties.data.drawingOptions.fillStyle
          ctx.strokeStyle = tileObj.layerProperties.data.drawingOptions.strokeStyle
          ctx.lineWidth = 3

          Object.keys(mapboxVectorTile.layers).forEach((layerKey) => {
            var layer = mapboxVectorTile.layers[layerKey]
            // console.log('layer has ' + layer.length + ' features')
            for (var iFeature = 0; iFeature < layer.length; ++iFeature) {
              // Parse the geometry out.
              var geometry = layer.feature(iFeature).loadGeometry()
              // console.log(JSON.stringify(geometry))
              // Geometry is an array of shapes
              var scaleFactor = 1.0 / 4096 * 256
              geometry.forEach((shape) => {
                // Shape is an array of coordinates
                switch(shape.length) {
                  case 1:
                    // This is a point
                    var x = tileObj.drawMargins + shape[0].x * scaleFactor
                    var y = tileObj.drawMargins + shape[0].y * scaleFactor
                    ctx.beginPath()
                    ctx.arc(x, y, 7, 0, Math.PI * 2.0, true)
                    ctx.fill()
                    ctx.stroke()
                    break;

                  default:
                    // Processing as multiline for now
                    var x0 = tileObj.drawMargins + shape[0].x * scaleFactor
                    var y0 = tileObj.drawMargins + shape[0].y * scaleFactor
                    // console.log(x0 + ', ' +  y0)
                    ctx.beginPath()
                    ctx.moveTo(x0, y0)
                    for (var iCoord = 1; iCoord < shape.length; ++iCoord) {
                      var x1 = tileObj.drawMargins + shape[iCoord].x * scaleFactor
                      var y1 = tileObj.drawMargins + shape[iCoord].y * scaleFactor
                      ctx.lineTo(x1, y1)
                      // console.log(x1 + ', ' +   y1)
                    }
                    ctx.stroke()
                    break;
                }
              })
            }
          })
          if (tileObj.layerProperties.data.drawingOptions.showTileExtents) {
            // Draw a rectangle showing the tile (not the margins)
            ctx.strokeStyle = "#000000"
            ctx.lineWidth = 2
            ctx.strokeRect(tileObj.drawMargins, tileObj.drawMargins, tileObj.tileSize.width, tileObj.tileSize.height)
            // Show the tile coordinates that we pass to aro-service
            ctx.fillStyle = '#000000'
            ctx.font = "15px Arial";
            ctx.fillText(coord.toString() + ', ' + zoom, 50, 50)
          }
      })
      return canvas
    }
  }


class TileComponentController {

  constructor($document, state, tileDataService) {
    
    this.state = state
    this.state.addMapLayerChangedObserver(this.handleMapEvents.bind(this))
    this.layerIdToMapTilesIndex = {}
    this.mapRef = null  // Will be set in $document.ready()
    this.tileDataService = tileDataService

    $document.ready(() => {
      // Saving a reference to the global map object. Ideally should be passed in to the component,
      // but don't know how to set it from markup
      this.mapRef = map
    })
  }

  // Handles map layer events
  handleMapEvents(eventId, eventData) {
    switch(eventId) {
      case this.state.MAP_LAYER_EVENTS.LAYER_CHANGED:
        var layerData = eventData;
        // Create a tile rendered for this layer id
        var tileRenderer = new MapTileRenderer(new google.maps.Size(256, 256), 1075, layerData, this.tileDataService)
        if (!this.layerIdToMapTilesIndex[layerData.id]) {
          // Tile does not already exist in maps
          this.mapRef.overlayMapTypes.push(tileRenderer)
          this.layerIdToMapTilesIndex[layerData.id] = this.mapRef.overlayMapTypes.length - 1
        } else {
          // Tile exists in maps. Replace it
          var index = this.layerIdToMapTilesIndex[layerData.id]
          this.mapRef.overlayMapTypes.setAt(index, tileRenderer)
        }
      break;

      case this.state.MAP_LAYER_EVENTS.LAYER_REMOVED:
      break;

      case this.state.MAP_LAYER_EVENTS.LAYER_VISIBILITY_CHANGED:
      break;
    }
  }
}

TileComponentController.$inject = ['$document', 'state', 'tileDataService']

app.component('tile', {
  template: '',
  bindings: { },
  controller: TileComponentController
})

