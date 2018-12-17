import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
// === editable value === //

class EditorInterfaceValueController {
  constructor() {
    //
  }
  
  $onInit(){
    this.enumVal = ""
    this.enumSet = []
    this.isValid = true
    this.needsValidation = false
    this.dateVal = new Date()
  }
  
  onRefresh() {
    if ( ("date" == this.displayProps.displayDataType || "datetime" == this.displayProps.displayDataType) && !isNaN(this.model)){
      var newDateVal = new Date(this.model)
      if (newDateVal.getTime() != this.dateVal.getTime()){ // interesting fact: new Date(0) != new Date(0)
        this.dateVal = newDateVal
      }
    }
    return
    // change this out for proper dynamic constraint checking
    if ('siteClli' == this.displayProps.propertyName || 'siteName' == this.displayProps.propertyName){
      this.isValid = this.checkConstraint()
      this.needsValidation = true
    }else{
      this.isValid = true
      this.needsValidation = false
    }
  }
  
  getEnumSet(){
    if ("enum" == this.displayProps.displayDataType && this.displayProps.enumTypeURL){
      AroFeatureFactory.getEnumSet(this.rootMetaData, this.parentObj, '/service/type-enum/'+this.displayProps.enumTypeURL).then((enumSet) => {
        //console.log('get Enum: '+this.displayProps.enumTypeURL)
        this.enumSet = enumSet
        /*
        console.log(this.displayProps.enumTypeURL)
        console.log(enumSet)
        console.log(" - ")
        */
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
  