import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
// === editable value === //

class EditorInterfacePrimitiveController {
  constructor($timeout) {
    this.$timeout = $timeout
  }
  
  $onInit(){
    this.enumVal = ""
    this.enumSet = []
    this.isValid = true
    this.needsValidation = false
    this.dateVal = new Date()
  }
  
  onRefresh() {
    if ("date" == this.displayProps.displayDataType || "datetime" == this.displayProps.displayDataType){
      if ('undefined' == typeof this.model || isNaN(this.model) || 0 == this.model){
        this.dateVal = new Date()
        this.model = this.dateVal.getTime()
      }else{
        var newDateVal = new Date(this.model)
        if (newDateVal.getTime() != this.dateVal.getTime()){ // interesting fact: new Date(0) != new Date(0)
          this.dateVal = newDateVal
        }
      }
    }
    /*
    // change this out for proper dynamic constraint checking
    if ('siteClli' == this.displayProps.propertyName || 'siteName' == this.displayProps.propertyName){
      this.isValid = this.checkConstraint()
      this.needsValidation = true
    }else{
      this.isValid = true
      this.needsValidation = false
    }
    */
  }
  
  getEnumSet(){
    if ("enum" == this.displayProps.displayDataType && this.displayProps.enumTypeURL){
      AroFeatureFactory.getEnumSet(this.rootMetaData, this.parentObj, '/service/type-enum/'+this.displayProps.enumTypeURL)
      .then((enumSet) => {
        var oldEnumText = JSON.stringify(this.enumSet)
        var isEnumSame = (JSON.stringify(enumSet) == oldEnumText)
        
        this.enumSet = enumSet
        
        var isInSet = false
        for (let i=0; i<this.enumSet.length; i++){
          if (this.enumSet[i].id == this.model){
            this.enumVal = this.enumSet[i].description
            isInSet = true
            break
          }
        }
        if (!isInSet && this.enumSet && this.enumSet.length > 0){
          if (this.isEdit){
            this.enumVal = this.enumSet[0].description
            this.model = this.enumSet[0].id
          }else{
            this.enumVal = this.model
          }
          this.onChange()
        }else if(!isEnumSame){
          //need to refresh the local view
          this.$timeout()
        }
      }, (errorText) => {
        console.log(errorText)
        this.enumSet = []
      })
    }
  }
  
  setDate(){
    if (!this.isEdit 
        || 'undefined' == typeof this.dateVal 
        || (null === this.dateVal && 'object' == typeof this.dateVal)) return
    this.model = this.dateVal.getTime()
    this.onChange()
  }
  
  checkConstraint(){
    return ("" !== this.model)
  }
  
  onInput(){
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
  }
  
}

EditorInterfacePrimitiveController.$inject = ['$timeout']

let editorInterfacePrimitive = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-primitive.html',
  bindings: {
    displayProps: '=', 
    model: '=', 
    onChange: '&', 
    isEdit: '<', 
    parentObj: '<', 
    rootMetaData: '<'
  },
  controller: EditorInterfacePrimitiveController
}
export default editorInterfacePrimitive
  