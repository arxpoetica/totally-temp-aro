// === editable value === //

class EditorInterfaceValueController {
  constructor() {
    //
  }

  $onInit() {
    // I think its better to get an error so we know a displayDataType is wrong
    //if ("number" == this.displayProps.displayDataType){
    //  this.model = parseFloat(this.model)
    //}
    
    if ("date" == this.displayProps.displayDataType || "datetime" == this.displayProps.displayDataType){
      this.dateVal = new Date(this.model)
    }
    
  }
  
  
  
  setDate(){
    if (!this.isEdit 
        || 'undefined' == typeof this.dateVal 
        || (null === this.dateVal && 'object' == typeof this.dateVal)) return
    this.model = this.dateVal.getTime()
    this.onChange()
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
  