class PlanEditorController {
  
  constructor(state) {
    this.state = state
    this.editorModes = Object.freeze({
      ADD: 'ADD',
      DELETE: 'DELETE',
      MOVE: 'MOVE',
      EDIT_BOUNDARY: 'EDIT_BOUNDARY'
    })
    this.selectedEditorMode = this.editorModes.ADD
  }

  // Sets the editor mode, and subscribes/unsubscribes from map events
  setEditorMode(newMode) {
    this.selectedEditorMode = newMode
  }
}

PlanEditorController.$inject = ['state']

app.component('planEditor', {
  templateUrl: '/components/sidebar/plan-editor/plan-editor-component.html',
  bindings: {},
  controller: PlanEditorController
})