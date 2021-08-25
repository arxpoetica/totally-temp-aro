import SelectionActions from '../../react/components/selection/selection-actions'

class MapSelectorPlanTargetController {
  constructor ($document, $ngRedux, state) {
    this.mapRef = null
    this.drawingManager = null

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    // Hold display mode and selection mode variables from application state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((newValue) => {
      this.selectedDisplayMode = newValue
      this.targetSelectionMode = this.state && (this.state.selectedTargetSelectionMode || this.rSelectedTargetSelectionMode)
      this.updateDrawingManagerState()
    })
    this.state = state
    this.document = $document

    // Handle selection events from state
    this.unsub = state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      this.addOrRemoveSelection(event.locations || [], 'locations', 'location_id')
      this.addOrRemoveSelection(event.serviceAreas || [], 'serviceAreas', 'id')
      this.addOrRemoveSelection(event.analysisAreas || [], 'analysisAreas', 'id')
    })
  }

  addOrRemoveSelection (entities, planTargetKey, entityIdKey) {
    // Get a list of ids to add and remove
    var idsToAdd = new Set(); var idsToRemove = new Set()
    entities.forEach((entity) => {
      if (this.planTargets[planTargetKey].has(+entity[entityIdKey])) {
        idsToRemove.add(+entity[entityIdKey])
      } else {
        idsToAdd.add(+entity[entityIdKey])
      }
    })
    if (idsToAdd.size > 0) {
      this.addPlanTargets(this.activePlanId, { [planTargetKey]: idsToAdd })
    }
    if (idsToRemove.size > 0) {
      this.removePlanTargets(this.activePlanId, { [planTargetKey]: idsToRemove })
    }
  }

  updateDrawingManagerState () {
    if (!this.drawingManager) {
      return
    }

    if ((this.selectedDisplayMode === this.displayModes.ANALYSIS || this.selectedDisplayMode === this.displayModes.VIEW) &&
        this.targetSelectionMode === this.state.targetSelectionModes.POLYGON_PLAN_TARGET) {
      this.drawingManager.setDrawingMode('polygon')
      this.drawingManager.setMap(null)
    } else {
      this.drawingManager.setDrawingMode('marker')
      this.drawingManager.setMap(null)
    }
  }

  $onInit () {
    this.document.ready(() => {
      this.doInit()
    })
  }

  doInit () {
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

  $onDestroy () {
    if (this.unsub) { this.unsub.unsubscribe() }

    if (this.drawingManager) {
      this.drawingManager.setDrawingMode('marker')
      this.drawingManager.setMap(null)
    }
    this.unsubscribeRedux()
  }

  $doCheck () {
    // Do a manual check on selectedTargetSelectionMode, as it is no longer a BehaviorSubject
    var oldValue = this.targetSelectionMode
    this.targetSelectionMode = this.state.selectedTargetSelectionMode || this.rSelectedTargetSelectionMode
    if (this.targetSelectionMode !== oldValue) {
      this.updateDrawingManagerState()
    }
  }

  mapStateToThis (reduxState) {
    return {
      activePlanId: reduxState.plan.activePlan && reduxState.plan.activePlan.id,
      planTargets: reduxState.selection.planTargets,
      rSelectedTargetSelectionMode: reduxState.toolbar.selectedTargetSelectionMode,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
      removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets))
    }
  }
}

MapSelectorPlanTargetController.$inject = ['$document', '$ngRedux', 'state']

let mapSelectorPlanTarget = {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorPlanTargetController
}

export default mapSelectorPlanTarget
