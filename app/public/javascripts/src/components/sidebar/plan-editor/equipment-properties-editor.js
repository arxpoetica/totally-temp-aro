import { createSelector } from 'reselect'
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import TrackedEquipment from '../../../service-typegen/dist/TrackedEquipment'
import EquipmentComponent from '../../../service-typegen/dist/EquipmentComponent'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'
import EquipmentBoundaryFeature from '../../../service-typegen/dist/EquipmentBoundaryFeature'
import PlanEditorActions from '../../../react/components/plan-editor/plan-editor-actions'

const getAllPlanFeatures = reduxState => reduxState.planEditor.features
const getSelectedPlanFeatures = reduxState => reduxState.selection.planEditorFeatures
const getEquipment = createSelector([getAllPlanFeatures, getSelectedPlanFeatures], (allPlanFeatures, selectedPlanFeatures) => {
  if (selectedPlanFeatures.length !== 1) {
    return null
  }
  const planFeature = allPlanFeatures[selectedPlanFeatures[0]]
  if (planFeature && planFeature.feature.dataType === 'equipment') {
    var returnFeature = AroFeatureFactory.createObject(planFeature.feature)
    // We are going to create a new geometry object, we do not want to inadvertently mutate the redux state.
    returnFeature.geometry = JSON.parse(JSON.stringify(planFeature.feature.geometry))
    return returnFeature
  } else {
    return null
  }
})

class EquipmentPropertiesEditorController {
  constructor (state, $ngRedux) {
    this.state = state
    this.isEditingFeatureProperties = false
    this.isDirty = false
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  markAsDirty () {
    this.isDirty = true
  }

  saveEquipmentProperties () {
    // Our equipment object is a copy of the one in the redux store.
    this.modifyEquipment(this.transactionId, { feature: this.viewFeature })
    this.updateMapObjectPosition && this.updateMapObjectPosition({ objectId: this.viewFeature.objectId, lat: this.viewFeature.geometry.coordinates[1], lng: this.viewFeature.geometry.coordinates[0] })
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
      viewFeature: getEquipment(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      modifyEquipment: (transactionId, equipment) => dispatch(PlanEditorActions.modifyFeature('equipment', transactionId, equipment))
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

EquipmentPropertiesEditorController.$inject = ['state', '$ngRedux']

let equipmentPropertiesEditor = {
  templateUrl: '/components/sidebar/plan-editor/equipment-properties-editor.html',
  bindings: {
    updateMapObjectPosition: '&'
  },
  controller: EquipmentPropertiesEditorController
}

export default equipmentPropertiesEditor