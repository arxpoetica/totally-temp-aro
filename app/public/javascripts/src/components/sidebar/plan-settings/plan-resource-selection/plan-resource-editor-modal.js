class PlanResourceEditorController {
  constructor(state) {
    this.state = state
    this.editingModes = Object.freeze({
      LIST_RESOURCE_MANAGERS: 'LIST_RESOURCE_MANAGERS',
      EDIT_RESOURCE_MANAGER: 'EDIT_RESOURCE_MANAGER',
      SHOW_PRICEBOOK_CREATOR: 'SHOW_PRICEBOOK_CREATOR'
    })
    this.selectedEditingMode = this.editingModes.LIST_RESOURCE_MANAGERS
    this.modalTitle = 'Resource Managers'
    this.editingManagerId = 1
  }

  modalHide() {
    this.state.showPlanResourceEditorModal = false
  }

  setEditingMode(newEditingMode) {
    this.selectedEditingMode = newEditingMode
    if (newEditingMode === this.editingModes.LIST_RESOURCE_MANAGERS) {
      this.modalTitle = 'Resource Managers'
    } else if (newEditingMode === this.editingModes.SHOW_PRICEBOOK_CREATOR) {
      this.modalTitle = 'Create PriceBook'
    }
  }

  setEditingManagerId(newId) {
    this.editingManagerId = newId
  }

  resourceManagerNameChanged(name) {
    this.modalTitle = name
  }

  onManagersChanged() {
    this.state.loadPlanResourceSelectionFromServer()
  }

  setSelectedResourceKey(resourceKey) {
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