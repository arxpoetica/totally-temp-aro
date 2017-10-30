class PlanResourceEditorController {
  constructor(state) {
    this.state = state
    this.editingModes = Object.freeze({
      LIST_RESOURCE_MANAGERS: 0,
      EDIT_RESOURCE_MANAGER: 1
    })
    this.selectedEditingMode = this.editingModes.LIST_RESOURCE_MANAGERS
    this.selectedResourceKey = 'price_book'
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
    }
  }

  setEditingManagerId(newId) {
    this.editingManagerId = newId
  }

  priceBookNameChanged(name) {
    this.modalTitle = name
  }
}

PlanResourceEditorController.$inject = ['state']

app.component('planResourceEditorModal', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal-component.html',
  bindings: {},
  controller: PlanResourceEditorController
})