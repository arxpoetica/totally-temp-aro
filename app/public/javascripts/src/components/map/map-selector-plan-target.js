import SelectionActions from '../../react/components/selection/selection-actions'

class MapSelectorPlanTargetController {
  constructor($document, $http, $ngRedux, state) {

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
    this.document = $document
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    // Handle selection events from state
    this.unsub = state.mapFeaturesSelectedEvent.subscribe((event) => {
      
      if(this.state.isRulerEnabled) return //disable any click action when ruler is enabled

      this.addOrRemoveSelection(event.locations, 'locations')
      this.addOrRemoveSelection(event.serviceAreas, 'serviceAreas')
      this.addOrRemoveSelection(event.analysisAreas, 'analysisAreas')
    })
  }

  addOrRemoveSelection(entities, planTargetKey) {
    // Get a list of ids to add and remove
    var idsToAdd = new Set(), idsToRemove = new Set()
    entities.forEach((entity) => {
      if (this.planTargets[planTargetKey].has(+entity.id)) {
        idsToRemove.add(+entity.id)
      } else {
        idsToAdd.add(+entity.id)
      }
    })
    if (idsToAdd.size > 0) {
      this.addPlanTargets(this.activePlanId, { [planTargetKey]: idsToAdd })
    }
    if (idsToRemove.size > 0) {
      this.removePlanTargets(this.activePlanId, { [planTargetKey]: idsToRemove })
    }
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
    this.unsubscribeRedux()
  }

  $doCheck() {
    // Do a manual check on selectedTargetSelectionMode, as it is no longer a BehaviorSubject
    var oldValue = this.targetSelectionMode
    this.targetSelectionMode = this.state.selectedTargetSelectionMode
    if (this.targetSelectionMode !== oldValue) {
      this.updateDrawingManagerState()
    }
  }

  mapStateToThis (reduxState) {
    return {
      activePlanId: reduxState.plan.activePlan && reduxState.plan.activePlan.id,
      planTargets: reduxState.selection.planTargets
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
      removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets))
    }
  }
}

MapSelectorPlanTargetController.$inject = ['$document', '$http', '$ngRedux', 'state']

let mapSelectorPlanTarget = {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorPlanTargetController
}

export default mapSelectorPlanTarget