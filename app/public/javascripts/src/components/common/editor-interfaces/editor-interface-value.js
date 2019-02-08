

class EditorInterfaceValueController {
  constructor() {
    this.localIsEdit = false
  }
  /*
  $onInit(){
    
  }
  */
  
  onRefresh() {
    var newIsEdit = this.isEdit
    if (this.displayProps.hasOwnProperty('editable')){
      newIsEdit = this.isEdit && this.displayProps.editable
    }
    
    this.localIsEdit = newIsEdit
  }
  
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
  