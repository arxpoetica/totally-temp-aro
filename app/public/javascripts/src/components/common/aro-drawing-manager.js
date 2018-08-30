class aroDrawingManagerController {
  constructor($window) {
    this.$window = $window
    this.isEphemralShapes = false
    this.drawingManager = null
  }

  enableDrawingManager() {
    if (!this.drawingManager) {
      this.all_overlays = []
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYLINE,
        drawingControl: this.drawingControl,
        drawingControlOptions: {
          position: google.maps.ControlPosition.BOTTOM_CENTER,
          drawingModes: this.drawingModes
        },
        polygonOptions: {
          fillColor: 'transparent'
        }
      });
      this.drawingManager.setMap(this.mapRef);

      google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (e) => {
        this.all_overlays.push(e);
        if (e.type != google.maps.drawing.OverlayType.MARKER) {
          // Switch back to non-drawing mode after drawing a shape.
          this.drawingManager.setDrawingMode(null);
        }
      });
    } else {
      if (this.drawingManager) {
        this.drawingManager.setOptions({
          drawingMode: google.maps.drawing.OverlayType.POLYLINE,
          drawingControl: true
        })
      }
    }
  }

  clearAllShape() {
    this.all_overlays.forEach((shape) => shape.overlay.setMap(null))
    this.all_overlays = [];
  }

  removeDrawingManager() {
    if (this.drawingManager) {
      this.drawingManager.setOptions({
        drawingControl: false
      })
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

  $onInit() {
    this.mapRef = this.$window[this.mapGlobalObjectName]
  }
}

aroDrawingManagerController.$inject = ['$window']

let aroDrawingManager = {
  templateUrl:'/components/common/aro-drawing-manager.html',
  bindings: {
    mapGlobalObjectName: '@',
    drawingControl: '=',
    drawingModes: '<'
  },
  controller: aroDrawingManagerController
}

export default aroDrawingManager