import ResourceManagerActions from '../../../../react/components/resource-manager/resource-manager-actions'

class PlanResourceEditorController {
  constructor ($ngRedux, state, $timeout) {
    this.state = state
    this.$timeout = $timeout
    this.editingManagerId = 1
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    this.onBackToList = () => {
      this.setEditingMode(this.editingModes.LIST_RESOURCE_MANAGERS)
      // angular doesn't seem to cause a digest when this is called from a react component
      this.$timeout()
    }
  }

  modalHide () {
    this.setEditingMode(this.editingModes.LIST_RESOURCE_MANAGERS)
    this.state.showPlanResourceEditorModal = false
    this.clearResourceManagers()
  }

  setEditingManagerId (newId) {
    this.editingManagerId = newId
  }

  onManagersChanged () {
    this.state.loadPlanResourceSelectionFromServer()
  }

  setSelectedResourceKey (resourceKey) {
    this.state.editingPlanResourceKey = resourceKey
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      reduxEditingManagerType: reduxState.resourceManager.editingManager && reduxState.resourceManager.editingManager.type,
      selectedEditingMode: reduxState.resourceManager.selectedEditingMode,
      editingModes: reduxState.resourceManager.editingModes
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      clearResourceManagers: () => dispatch(ResourceManagerActions.clearResourceManagers()),
      setEditingMode: editingMode => dispatch(ResourceManagerActions.setEditingMode(editingMode))
    }
  }
}

PlanResourceEditorController.$inject = ['$ngRedux', 'state', '$timeout']

let planResourceEditorModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal.html',
  controller: PlanResourceEditorController
}

export default planResourceEditorModal
