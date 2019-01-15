import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
// === editable value === //

class EditorInterfaceNullableNumberController {
  constructor($timeout) {
    this.$timeout = $timeout
  }
  
  $onInit(){
    //this.enumVal = ""
    //this.enumSet = []
    this.isValid = true
    this.needsValidation = false
    //this.dateVal = new Date()
  }
  
  onRefresh() {
    
  }
  
  /*
  checkConstraint(){
    return ("" !== this.model)
  }
  */
  onInput(){
    /*
    if (this.needsValidation){
      if (!this.checkConstraint()){
        this.isValid = false
      }else{
        this.isValid = true
        this.onChange()
      }
    }else{
      this.onChange()
    }
    */
    this.onChange()
  }
  
}

EditorInterfaceNullableNumberController.$inject = ['$timeout']

let editorInterfaceNullableNumber = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-nullable-number.html',
  bindings: {
    displayProps: '=', 
    model: '=', 
    onChange: '&', 
    isEdit: '<', 
    parentObj: '<', 
    rootMetaData: '<'
  },
  controller: EditorInterfaceNullableNumberController
}
export default editorInterfaceNullableNumber
  