import { createSelector } from 'reselect'
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import TrackedEquipment from '../../../service-typegen/dist/TrackedEquipment'
import EquipmentComponent from '../../../service-typegen/dist/EquipmentComponent'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'
import EquipmentBoundaryFeature from '../../../service-typegen/dist/EquipmentBoundaryFeature'
import PlanEditorActions from '../../../react/components/plan-editor/plan-editor-actions'
import CoverageActions from '../../../react/components/coverage/coverage-actions'
import WktUtils from '../../../shared-utils/wkt-utils'

const getAllPlanFeatures = reduxState => reduxState.planEditor.features
const getSelectedPlanFeatures = reduxState => reduxState.selection.planEditorFeatures
const getEquipmentBoundary = createSelector([getAllPlanFeatures, getSelectedPlanFeatures], (allPlanFeatures, selectedPlanFeatures) => {
  if (selectedPlanFeatures.length !== 1) {
    return null
  }
  const planFeature = allPlanFeatures[selectedPlanFeatures[0]]
  if (planFeature && planFeature.feature.dataType === 'equipment_boundary') {
    return AroFeatureFactory.createObject(planFeature.feature)
  } else {
    return null
  }
})
const getBoundariesCoverage = reduxState => reduxState.coverage.boundaries
const getSelectedBoundaryCoverage = createSelector([getBoundariesCoverage, getSelectedPlanFeatures], (boundariesCoverage, selectedPlanFeatures) => {
  if (selectedPlanFeatures.length !== 1) {
    return null
  }
  return angular.copy(boundariesCoverage[selectedPlanFeatures[0]])
})

class BoundaryPropertiesEditorController {
  constructor (state, $http, $ngRedux) {
    this.state = state
    this.$http = $http
    this.isEditingFeatureProperties = false
    this.isDirty = false
    this.siteMoveUpdates = [
      'Auto-redraw',
      'Don\'t update'
    ]
    this.siteBoundaryGenerations = [
      'Road Distance'
    ]
    this.boundaryIdToName = {}
    this.state.boundaryTypes.forEach(boundaryType => { this.boundaryIdToName[boundaryType.id] = boundaryType.name })
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  markAsDirty () {
    this.isDirty = true
  }

  saveBoundaryProperties () {
    // Some error when trying to save a default blank product. Delete it. Note that this.viewBoundaryProps is a copy too.
    var boundaryToSave = JSON.parse(JSON.stringify(this.viewBoundaryProps))
    delete boundaryToSave.product
    this.modifyBoundary(this.transactionId, { feature: boundaryToSave })
    this.isDirty = false
  }

  // Legacy method
  getNewListItem (type) {
    if (type === 'plannedEquipment' || type === 'subComponents') {
      return new EquipmentComponent()
    }

    if (type === 'existingEquipment') {
      return new TrackedEquipment()
    }
  }

  getEquipmentCoordinates () {
    const equipmentId = this.viewBoundaryProps.networkObjectId
    if (this.transactionFeatures[equipmentId]) {
      // The equipment is in the transaction, return its geometry
      return Promise.resolve(this.transactionFeatures[equipmentId].feature.geometry)
    } else {
      // The equipment is not part of the transaction. Get its coordinates from the server.
      return this.$http.get(`/service/plan-feature/${this.planId}/equipment/${equipmentId}`)
        .then(result => Promise.resolve(result.data.geometry))
        .catch(err => console.error(err))
    }
  }

  calculateCoverage () {
    return this.getEquipmentCoordinates()
      .then(equipmentPoint => {
        // Get the POST body for optimization based on the current application state
        var optimizationBody = this.state.getOptimizationBody()
        
        // Replace analysis_type and add a point and radius
        optimizationBody.boundaryCalculationType = 'FIXED_POLYGON'
        optimizationBody.analysis_type = 'COVERAGE'

        optimizationBody.point = equipmentPoint
        // Get the polygon from the mapObject, not mapObject.feature.geometry, as the user may have edited the map object
        optimizationBody.polygon = this.viewBoundaryProps.geometry
        optimizationBody.directed = false
        console.log('--- boundary prop edit ---')
        console.log(optimizationBody)
        return this.$http.post('/service/v1/network-analysis/boundary', optimizationBody)
      })
      .then(result => this.addBoundaryCoverage(this.viewBoundaryProps.objectId, result.data))
      .then(() => this.showBoundaryCoverage())
      .catch((err) => {
        console.error(err)
        this.isWorkingOnCoverage = false
      })
  }

  mapStateToThis (reduxState) {
    return {
      planId: reduxState.plan.activePlan && reduxState.plan.activePlan.id,
      isEditingFeatureProperties: reduxState.planEditor.isEditingFeatureProperties,
      transactionId: reduxState.planEditor.transaction && reduxState.planEditor.transaction.id,
      transactionFeatures: reduxState.planEditor.features,
      selectedFeatures: reduxState.selection.planEditorFeatures,
      viewBoundaryProps: getEquipmentBoundary(reduxState),
      isBoundaryCoverageVisible: reduxState.coverage.isBoundaryCoverageVisible,
      selectedBoundaryCoverage: getSelectedBoundaryCoverage(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      modifyBoundary: (transactionId, boundary) => dispatch(PlanEditorActions.modifyFeature('equipment_boundary', transactionId, boundary)),
      showBoundaryCoverage: () => dispatch(CoverageActions.setBoundaryCoverageVisibility(true)),
      addBoundaryCoverage: (objectId, coverage) => dispatch(CoverageActions.addBoundaryCoverage(objectId, coverage))
    }
  }

  mergeToTarget (nextState, actions) {
    const oldSelectedFeatures = this.selectedFeatures
    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if (oldSelectedFeatures !== this.selectedFeatures) {
      this.isDirty = false
    }
  }
}

BoundaryPropertiesEditorController.$inject = ['state', '$http', '$ngRedux']

let boundaryPropertiesEditor = {
  templateUrl: '/components/sidebar/plan-editor/boundary-properties-editor.html',
  bindings: { },
  controller: BoundaryPropertiesEditorController
}

export default boundaryPropertiesEditor
