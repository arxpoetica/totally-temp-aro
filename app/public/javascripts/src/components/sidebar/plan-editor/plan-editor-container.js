
class PlanEditorContainerController {
  constructor (state) {
    this.state = state
  }
}

PlanEditorContainerController.$inject = ['state']

let planEditor = {
  templateUrl: '/components/sidebar/plan-editor/plan-editor-container.html',
  bindings: {},
  controller: PlanEditorContainerController
}

export default planEditor
