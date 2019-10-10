import { createSelector } from 'reselect'
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import TrackedEquipment from '../../../service-typegen/dist/TrackedEquipment'
import EquipmentComponent from '../../../service-typegen/dist/EquipmentComponent'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'
import EquipmentBoundaryFeature from '../../../service-typegen/dist/EquipmentBoundaryFeature'
import PlanEditorActions from '../../../react/components/plan-editor/plan-editor-actions'

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

class BoundaryPropertiesEditorController {
  constructor (state, $ngRedux) {
    this.state = state
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

  mapStateToThis (reduxState) {
    return {
      isEditingFeatureProperties: reduxState.planEditor.isEditingFeatureProperties,
      transactionId: reduxState.planEditor.transaction && reduxState.planEditor.transaction.id,
      transactionFeatures: reduxState.planEditor.features,
      selectedFeatures: reduxState.selection.planEditorFeatures,
      viewBoundaryProps: getEquipmentBoundary(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      modifyBoundary: (transactionId, boundary) => dispatch(PlanEditorActions.modifyFeature('equipment_boundary', transactionId, boundary))
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

BoundaryPropertiesEditorController.$inject = ['state', '$ngRedux']

let boundaryPropertiesEditor = {
  templateUrl: '/components/sidebar/plan-editor/boundary-properties-editor.html',
  bindings: {
    requestCalculateCoverage: '&'
  },
  controller: BoundaryPropertiesEditorController
}

export default boundaryPropertiesEditor
