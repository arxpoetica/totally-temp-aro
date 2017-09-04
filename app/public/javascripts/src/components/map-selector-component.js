class MapSelectorController {
  constructor($document, state) {

    this.mapRef = null
    this.drawingManager = null

    // Hold display mode and selection mode variables from application state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((newValue) => {
      this.selectedDisplayMode = newValue
      this.updateDrawingManagerState()
    })
    this.selectionModes = state.selectionModes
    state.activeSelectionMode.subscribe((newValue) => {
      this.activeSelectionMode = newValue
      this.updateDrawingManagerState()
    })

    $document.ready(() => {
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]

      // Create a drawing manager that will be used for marking out polygons for selecting entities
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false
      })
      this.drawingManager.addListener('overlaycomplete', (e) => {
        setTimeout(() => e.overlay.setMap(null), 100)
        console.log('Overlay complete')
      })
    })
  }

  updateDrawingManagerState() {
    if (!this.drawingManager) {
      return
    }

    if (this.selectedDisplayMode === this.displayModes.ANALYSIS
        && this.activeSelectionMode === this.selectionModes.POLYGON) {
      this.drawingManager.setDrawingMode('polygon')
      this.drawingManager.setMap(this.mapRef)
    } else {
      this.drawingManager.setDrawingMode(null)
      this.drawingManager.setMap(null)
    }

  }

  $onInit() {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }
  }
}

MapSelectorController.$inject = ['$document', 'state']

app.component('mapSelector', {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorController
})

