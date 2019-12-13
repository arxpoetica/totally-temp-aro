import ResourceManagerActions from '../../../../react/components/resource-manager/resource-manager-actions'

class PlanResourceEditorController {
  constructor ($ngRedux, state) {
    this.state = state
    this.editingModes = Object.freeze({
      LIST_RESOURCE_MANAGERS: 'LIST_RESOURCE_MANAGERS',
      EDIT_RESOURCE_MANAGER: 'EDIT_RESOURCE_MANAGER',
      SHOW_PRICEBOOK_CREATOR: 'SHOW_PRICEBOOK_CREATOR',
      SHOW_RATE_REACH_MANAGER_CREATOR: 'SHOW_RATE_REACH_MANAGER_CREATOR'
    })
    this.selectedEditingMode = this.editingModes.LIST_RESOURCE_MANAGERS
    this.editingManagerId = 1
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }
  
  modalHide () {
    this.setEditingMode(this.editingModes.LIST_RESOURCE_MANAGERS)
    this.state.showPlanResourceEditorModal = false
    this.clearResourceManagers()
  }

  setEditingMode (newEditingMode) {
    this.selectedEditingMode = newEditingMode
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
      reduxEditingManagerType: reduxState.resourceManager.editingManager && reduxState.resourceManager.editingManager.type
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      clearResourceManagers: () => dispatch(ResourceManagerActions.clearResourceManagers())
    }
  }
}

PlanResourceEditorController.$inject = ['$ngRedux', 'state']

let planResourceEditorModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal.html',
  controller: PlanResourceEditorController
}

export default planResourceEditorModal
