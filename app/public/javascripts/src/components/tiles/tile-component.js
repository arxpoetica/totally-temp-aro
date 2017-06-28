/**
 * Directive to load map data in the form of tiles
 */
'use strict'

  class MapTileRenderer {
    
    constructor(tileSize, layerProperties, tileDataService) {
      this.tileSize = tileSize
      this.layerProperties = layerProperties
      this.tileDataService = tileDataService
    }

    // This method is called by Google Maps. Render a canvas tile and send it back.
    getTile(coord, zoom, ownerDocument) {
      var canvas = ownerDocument.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      canvas.style.border = "2px solid";
      
      // Get tile data from service
      var tileObj = this
      this.tileDataService.getTileData(zoom, coord.x, coord.y, this.layerProperties.id)
        .then((response) => {

          // Response will be an array of objects 
          var ctx=canvas.getContext("2d");
          ctx.fillStyle = tileObj.layerProperties.data.drawingOptions.fillStyle
          ctx.strokeStyle = tileObj.layerProperties.data.drawingOptions.strokeStyle
          ctx.lineWidth = 3
          response.forEach((coordObject) => {
            // Looks like service is returning tiles in 4096x4096 format
            var x = coordObject.x / 4096 * 256, y = coordObject.y / 4096 * 256
            ctx.beginPath()
            ctx.arc(x, y, 7, 0, Math.PI * 2.0, true)
            ctx.fill()
            ctx.stroke()
          })
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
    console.log('Got map event from state.js')
    console.log(this)
    console.log(this.state)
    switch(eventId) {
      case this.state.MAP_LAYER_EVENTS.LAYER_CHANGED:
        var layerData = eventData;
        // Create a tile rendered for this layer id
        var tileRenderer = new MapTileRenderer(new google.maps.Size(256, 256), layerData, this.tileDataService)
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

