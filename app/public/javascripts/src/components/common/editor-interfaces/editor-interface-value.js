import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
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
    this.enumVal = ""
    this.isValid = true
    this.needsValidation = false
    if ("date" == this.displayProps.displayDataType || "datetime" == this.displayProps.displayDataType){
      this.dateVal = new Date(this.model)
    }
    
    // change this out for proper dynamic constraint checking
    if ('siteClli' == this.displayProps.propertyName || 'siteName' == this.displayProps.propertyName){
      this.isValid = this.checkConstraint()
      this.needsValidation = true
    }
    
  }
  
  getEnumSet(){
    if ("enum" == this.displayProps.displayDataType && this.displayProps.enumTypeURL){
      AroFeatureFactory.getEnumSet(this.rootMetaData, this.parentObj, '/service/type-enum/'+this.displayProps.enumTypeURL).then((enumSet) => {
        //console.log('get Enum: '+this.displayProps.enumTypeURL)
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
          this.enumVal = this.enumSet[0].description
          this.model = this.enumSet[0].id
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
  