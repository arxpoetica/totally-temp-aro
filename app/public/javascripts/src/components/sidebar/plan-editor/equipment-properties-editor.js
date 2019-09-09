class EquipmentPropertiesEditorController {
  constructor (state, $ngRedux) {
    this.state = state
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      isEditingFeatureProperties: reduxState.planEditor.isEditingFeatureProperties,
      transactionFeatures: reduxState.planEditor.features,
      selectedFeatures: reduxState.selection.planEditor
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
    }
  }
}

EquipmentPropertiesEditorController.$inject = ['state', '$ngRedux']

let planSummary = {
  templateUrl: '/components/sidebar/plan-editor/plan-summary.html',
  bindings: {},
  controller: EquipmentPropertiesEditorController
}

export default planSummary
