// === editable value === //

class EditorInterfaceValueController {
  constructor() {
    //
  }

  $onInit() {
    if ("number" == this.displayProps.format){
      this.model = parseFloat(this.model)
    }
  }
  
}

let editorInterfaceValue = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-value.html',
  bindings: {
    displayProps: '=', 
    model: '=', 
    onChange: '&', 
    isEdit: '<'
  },
  controller: EditorInterfaceValueController
}
export default editorInterfaceValue
  