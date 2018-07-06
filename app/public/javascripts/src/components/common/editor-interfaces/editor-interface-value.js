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
    
    if ("date" == this.displayProps.displayDataType || "datetime" == this.displayProps.displayDataType){
      this.dateVal = new Date(this.model)
    }
    
    if ("enum" == this.displayProps.displayDataType && this.displayProps.enumTypeURL){
      /*
      AroFeatureFactory.getEnumSetByURN('/service/type-enum/'+this.displayProps.enumTypeURL).then((enumSet) => {
        console.log('SUCCESS!')
        console.log(enumSet)
        this.enumSet = enumSet
      })
      */
      AroFeatureFactory.getEnumSet(this.rootMetaData, this.parentObj, '/service/type-enum/'+this.displayProps.enumTypeURL).then((enumSet) => {
        console.log('SUCCESS!')
        console.log(enumSet)
        this.enumSet = enumSet
      })
    }
    
  }
  
  onChangeDebug(){
    console.log(this.model)
    this.onChange()
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
    isEdit: '<', 
    parentObj: '<', 
    rootMetaData: '<'
  },
  controller: EditorInterfaceValueController
}
export default editorInterfaceValue
  