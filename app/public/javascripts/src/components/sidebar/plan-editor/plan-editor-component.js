class PlanEditorController {
  
  constructor(state) {
    this.state = state
  }
}

PlanEditorController.$inject = ['state']

app.component('planEditor', {
  templateUrl: '/components/sidebar/plan-editor/plan-editor-component.html',
  bindings: {},
  controller: PlanEditorController
})