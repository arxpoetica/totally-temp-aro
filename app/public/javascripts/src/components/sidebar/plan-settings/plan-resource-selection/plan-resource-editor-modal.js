class PlanResourceEditorController {
  constructor (state) {
    this.state = state
    this.editingModes = Object.freeze({
      LIST_RESOURCE_MANAGERS: 'LIST_RESOURCE_MANAGERS',
      EDIT_RESOURCE_MANAGER: 'EDIT_RESOURCE_MANAGER',
      SHOW_PRICEBOOK_CREATOR: 'SHOW_PRICEBOOK_CREATOR',
      SHOW_RATE_REACH_MANAGER_CREATOR: 'SHOW_RATE_REACH_MANAGER_CREATOR'
    })
    this.selectedEditingMode = this.editingModes.LIST_RESOURCE_MANAGERS
    this.editingManagerId = 1
  }

  modalHide () {
    this.state.showPlanResourceEditorModal = false
  }

  setEditingMode (newEditingMode) {
    console.log(newEditingMode)
    this.selectedEditingMode = newEditingMode
  }

  setEditingManagerId (newId) {
    this.editingManagerId = newId
  }

  onManagersChanged () {
    this.state.loadPlanResourceSelectionFromServer()
  }

  setSelectedResourceKey (resourceKey) {
    console.log(resourceKey)
    this.selectedResourceKey = resourceKey
  }
}

PlanResourceEditorController.$inject = ['state']

let planResourceEditorModal = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal.html',
  bindings: {
    selectedResourceKey: '<'
  },
  controller: PlanResourceEditorController
}

export default planResourceEditorModal
