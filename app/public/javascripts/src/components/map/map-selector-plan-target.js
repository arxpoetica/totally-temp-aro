class MapSelectorPlanTargetController {
  constructor($document, $http, state) {

    this.mapRef = null
    this.drawingManager = null

    // Hold display mode and selection mode variables from application state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((newValue) => {
      this.selectedDisplayMode = newValue
      this.targetSelectionMode = this.state && this.state.selectedTargetSelectionMode
      this.updateDrawingManagerState()
    })
    this.state = state
    this.selectionModes = state.selectionModes
    this.document = $document

    // Handle selection events from state
    this.unsub = state.mapFeaturesSelectedEvent.subscribe((event) => {
      
      if(this.state.isRulerEnabled) return //disable any click action when ruler is enabled
      var plan = state.plan.getValue()
      
      if (plan && plan.id !== state.INVALID_PLAN_ID && event.locations && event.locations.length > 0 
        && state.selectedDisplayMode.getValue() === state.displayModes.ANALYSIS) {
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
        $http.post(`/network_plan/${plan.id}/addTargets`, { locationIds: Array.from(idsToAdd) }),
        $http.post(`/network_plan/${plan.id}/removeTargets`, { locationIds: Array.from(idsToRemove) })
      ]
      Promise.all(addRemoveTargetPromises)
        .then((response) => {
          // Reload selected locations from database
          state.reloadSelectedLocations()
        })
      }
      
      if (plan && plan.id !== state.INVALID_PLAN_ID && event.serviceAreas && event.serviceAreas.length > 0 
          && state.selectedDisplayMode.getValue() === state.displayModes.ANALYSIS) {
        // Get a list of ids to add and remove
        var existingIds = state.selectedServiceAreas.getValue()
        var idsToAdd = new Set(), idsToRemove = new Set()
        event.serviceAreas.forEach((serviceArea) => {
          if (existingIds.has(+serviceArea.id)) {
            idsToRemove.add(+serviceArea.id)
          } else {
            idsToAdd.add(+serviceArea.id)
          }
        })
        // Make these changes to the database, then reload targets from the DB
        var addRemoveTargetPromises = [
          $http.post(`/service_areas/${plan.id}/addServiceAreaTargets`, { serviceAreaIds: Array.from(idsToAdd) }),
          $http.post(`/service_areas/${plan.id}/removeServiceAreaTargets`, { serviceAreaIds: Array.from(idsToRemove) })
        ]
        Promise.all(addRemoveTargetPromises)
          .then((response) => {
            // Reload selected locations from database
            state.reloadSelectedServiceAreas(true)
          })
      }

      if (event.roadSegments && event.roadSegments.size > 0) {
          state.StateViewMode.reloadSelectedRoadSegments(state,event.roadSegments)
      }
    })

  }

  updateDrawingManagerState() {
    if (!this.drawingManager) {
      return
    }

    if ((this.selectedDisplayMode === this.displayModes.ANALYSIS || this.selectedDisplayMode === this.displayModes.VIEW)
        && this.targetSelectionMode === this.state.targetSelectionModes.POLYGON_PLAN_TARGET) {
      this.drawingManager.setDrawingMode('polygon')
      this.drawingManager.setMap(this.mapRef)
    } else {
      this.drawingManager.setDrawingMode(null)
      this.drawingManager.setMap(null)
    }

  }

  $onInit() {
    this.document.ready(()=> {
      this.doInit()
    })
  }

  doInit() {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }

    // We should have a map variable at this point
    this.mapRef = window[this.mapGlobalObjectName]

    // Create a drawing manager that will be used for marking out polygons for selecting entities
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false
    })
    this.drawingManager.addListener('overlaycomplete', (e) => {
      this.state.requestPolygonSelect.next({
        coords: e.overlay.getPath().getArray()
      })
      setTimeout(() => e.overlay.setMap(null), 100)
    })

  }


  $onDestroy() {
    if(this.unsub)
      this.unsub.unsubscribe()

    if(this.drawingManager) {
      this.drawingManager.setDrawingMode(null)
      this.drawingManager.setMap(null)
    }
  }

  $doCheck() {
    // Do a manual check on selectedTargetSelectionMode, as it is no longer a BehaviorSubject
    var oldValue = this.targetSelectionMode
    this.targetSelectionMode = this.state.selectedTargetSelectionMode
    if (this.targetSelectionMode !== oldValue) {
      this.updateDrawingManagerState()
    }
  }
}

MapSelectorPlanTargetController.$inject = ['$document', '$http', 'state']

let mapSelectorPlanTarget = {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorPlanTargetController
}

export default mapSelectorPlanTarget