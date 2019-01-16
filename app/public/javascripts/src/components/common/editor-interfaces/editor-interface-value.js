

class EditorInterfaceValueController {
  constructor() {
    
  }
  /*
  $onInit(){
    
  }
  */
}

//EditorInterfaceValueController.$inject = ['']

let editorInterfaceValue = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-value.html',
  bindings: {
    displayProps: '=', 
    model: '=', 
    onChange: '&', 
    isEdit: '<', 
    parentObj: '<', 
    rootMetaData: '<'
  },
  controller: EditorInterfaceValueController
}
export default editorInterfaceValue
  