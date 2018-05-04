// === editable value === //

class EditorInterfaceValueController {
  constructor() {
    //
  }

  $onInit() {
    //
  }
  
}

let editorInterfaceValue = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-value.html',
  bindings: {
    displayProps: '=', 
    model: '=', 
    isEdit: '<'
  },
  controller: EditorInterfaceValueController
}
export default editorInterfaceValue
  