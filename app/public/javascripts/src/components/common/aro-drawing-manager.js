class aroDrawingManagerController {
  constructor($window) {
    this.$window = $window
    this.isEphemralShapes = false
    this.drawingManager = null

    this.drawingModeTypes = {
      'marker': google.maps.drawing.OverlayType.MARKER,
      'polyline': google.maps.drawing.OverlayType.POLYLINE,
      'polygon': google.maps.drawing.OverlayType.POLYGON
    }
  }

  enableDrawingManager() {
    if (!this.drawingManager) {
      this.all_overlays = []
      var addListeners = this.featureType != 'ephemralShape' && this.editable
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: this.drawingModeTypes[this.defaultDrawingMode],
        drawingControl: this.drawingControl,
        drawingControlOptions: {
          position: google.maps.ControlPosition.BOTTOM_CENTER,
          drawingModes: this.drawingModes
        },
        polylineOptions: {
          editable: this.editable
        },
        polygonOptions: {
          fillColor: 'transparent',
          editable: this.editable
        }
      });
      this.drawingManager.setMap(this.mapRef);

      google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (e) => {
        this.all_overlays.push(e);
        this.registerCreateMapObjectCallback && this.registerCreateMapObjectCallback({createMapObjects: this.all_overlays})
        addListeners && this.addMapObjectEvents(this.all_overlays)
      });
    } else {
      if (this.drawingManager) {
        this.drawingManager.setMap(this.mapRef)
      }
    }
  }

  clearAllShape() {
    this.all_overlays.forEach((shape) => shape.overlay.setMap(null))
    this.all_overlays = [];
  }

  removeDrawingManager() {
    if (this.drawingManager) {
      this.drawingManager.setMap(null)
    }
  }

  setEphemralShapes() {
    this.isEphemralShapes = !this.isEphemralShapes
    if (this.isEphemralShapes) {
      this.enableDrawingManager()
    } else {
      this.clearAllShape()
      this.removeDrawingManager()
    }
  }

  addMapObjectEvents(features) {
    features.forEach((feature) => {
      this.addMapObjectEvent(feature)
    })
  }

  addMapObjectEvent(feature) {
    if (feature.type === 'polygon') {
      var mapObject= feature

      mapObject.overlay.getPaths().forEach((path, index) => {
        google.maps.event.addListener(path, 'insert_at',() => {
          this.registerCreateMapObjectCallback && this.registerCreateMapObjectCallback({createMapObjects: [mapObject]})
        });
        google.maps.event.addListener(path, 'remove_at',() => {
          this.registerCreateMapObjectCallback && this.registerCreateMapObjectCallback({createMapObjects: [mapObject]})
        });
        google.maps.event.addListener(path, 'set_at',() => {
          this.registerCreateMapObjectCallback && this.registerCreateMapObjectCallback({ createMapObjects: [mapObject] })
        });
      });
    } else {
      throw `createMapObject() not supported for geometry type ${feature.type}`
    }
  }

  $onInit() {
    this.mapRef = this.$window[this.mapGlobalObjectName]
  }

  $onChanges(changes) {
    if (changes.deleteMapObjects.currentValue) {
      this.setEphemralShapes()
    }
  }

  $onDestroy() {
    this.setEphemralShapes()
  }

}

aroDrawingManagerController.$inject = ['$window']

let aroDrawingManager = {
  templateUrl:'/components/common/aro-drawing-manager.html',
  bindings: {
    mapGlobalObjectName: '@',
    featureType: '@',
    drawingControl: '=',
    drawingModes: '<',
    editable: '=',
    defaultDrawingMode: '@',
    deleteMapObjects: '<',
    registerCreateMapObjectCallback: '&'
  },
  controller: aroDrawingManagerController
}

export default aroDrawingManager