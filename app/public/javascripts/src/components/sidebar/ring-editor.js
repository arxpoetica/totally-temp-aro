
class RingEditorController {
  constructor (state) {
    this.state = state
  }
}

RingEditorController.$inject = ['state']

let ringEditor = {
  templateUrl: '/components/sidebar/ring-editor.html',
  bindings: {
    
  },
  controller: RingEditorController
}

export default ringEditor