class PlanResourceEditorController {
  constructor(state) {
    this.state = state
  }

  modalHide() {
    this.state.showPlanResourceEditorModal = false
  }

  modalShow() {
    this.planResourceToEdit = this.state.resourceItems[this.state.editingPlanResourceKey]
  }
}

PlanResourceEditorController.$inject = ['state']

app.component('planResourceEditorModal', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal-component.html',
  bindings: {},
  controller: PlanResourceEditorController
})