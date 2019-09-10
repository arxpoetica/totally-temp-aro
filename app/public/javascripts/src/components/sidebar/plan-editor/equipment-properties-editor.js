import { createSelector } from 'reselect'
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import TrackedEquipment from '../../../service-typegen/dist/TrackedEquipment'
import EquipmentComponent from '../../../service-typegen/dist/EquipmentComponent'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'
import EquipmentBoundaryFeature from '../../../service-typegen/dist/EquipmentBoundaryFeature'

const getAllPlanFeatures = reduxState => reduxState.planEditor.features
const getSelectedPlanFeatures = reduxState => reduxState.selection.planEditorFeatures
const getEquipment = createSelector([getAllPlanFeatures, getSelectedPlanFeatures], (allPlanFeatures, selectedPlanFeatures) => {
  if (selectedPlanFeatures.length !== 1) {
    return null
  }
  return AroFeatureFactory.createObject(allPlanFeatures[selectedPlanFeatures[0]].feature)
})

class EquipmentPropertiesEditorController {
  constructor (state, $ngRedux) {
    this.state = state
    this.isEditingFeatureProperties = false
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      isEditingFeatureProperties: reduxState.planEditor.isEditingFeatureProperties,
      transactionFeatures: reduxState.planEditor.features,
      selectedFeatures: reduxState.selection.planEditor,
      viewFeature: getEquipment(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }
}

EquipmentPropertiesEditorController.$inject = ['state', '$ngRedux']

let planSummary = {
  templateUrl: '/components/sidebar/plan-editor/equipment-properties-editor.html',
  bindings: {
    requestEditViewObject: '&'
  },
  controller: EquipmentPropertiesEditorController
}

export default planSummary
