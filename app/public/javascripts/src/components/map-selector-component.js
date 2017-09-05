class MapSelectorController {
  constructor($document, $http, state) {

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

    // Handle selection events from state
    state.mapFeaturesSelectedEvent.subscribe((event) => {
      if (event.locations) {
      // Get a list of ids to add and remove
      var existingIds = state.selectedLocations.getValue()
      var idsToAdd = new Set(), idsToRemove = new Set()
      event.locations.forEach((location) => {
        if (existingIds.has(+location.location_id)) {
          idsToRemove.add(+location.location_id)
        } else {
          idsToAdd.add(+location.location_id)
        }
      })
      // Make these changes to the database, then reload targets from the DB
      var addRemoveTargetPromises = [
        $http.post(`/network_plan/${state.planId}/addTargets`, { locationIds: Array.from(idsToAdd) }),
        $http.post(`/network_plan/${state.planId}/removeTargets`, { locationIds: Array.from(idsToRemove) })
      ]
      Promise.all(addRemoveTargetPromises)
        .then((response) => {
          // Reload selected locations from database
          state.reloadSelectedLocations()
        })
      }
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
        state.requestPolygonSelect.next({
          coords: e.overlay.getPath().getArray()
        })
        setTimeout(() => e.overlay.setMap(null), 100)
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

MapSelectorController.$inject = ['$document', '$http', 'state']

app.component('mapSelector', {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorController
})

