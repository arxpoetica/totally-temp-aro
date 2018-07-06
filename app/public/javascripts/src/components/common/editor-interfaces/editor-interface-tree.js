// A component for editing values in any generic javascript object. The component will display input
// boxes for string, boolean and integer types. Objects can be nested as deep as required (though it
// will get unweildy to use with too much nesting). Editing of arrays is NOT supported as of now.

//ToDo: inherit from AroObjectEditorController 

class EditorInterfaceTreeController {
  constructor() {
    // Store the "Object.keys()" function so we can use it in the markup
    this.ObjectKeys = Object.keys
    this.pixelsPerIndentationLevel = 20
    this.isKeyExpanded = {}
  }

  $onInit() {
    this.indentationLevel = this.indentationLevel || 0
  }
  
  toggleIsKeyExpanded(index) {
    this.isKeyExpanded[index] = !this.isKeyExpanded[index]
  }
  
  doShow(prop, data){
    if ('undefined' == typeof data || null == data) data = this.objectToView
    if ('undefined' == typeof data || null == data) return false
    //console.log(prop)
    //console.log(data)
    if (!prop.visible) return false
    if (!data.hasOwnProperty(prop.propertyName)) return false
    
    return true
  }
  
  isList(){
    //console.log(this.objectMetaData)
    //console.log( ('undefined' != typeof this.objectMetaData && this.objectMetaData.displayDataType.startsWith('array') ) )
    return ('undefined' != typeof this.objectMetaData && this.objectMetaData.displayDataType.startsWith('array') )
  }
  
  getSummeryCount(propVal){
    var summeryCount = 0
    
    //ng-if="$ctrl.hasChildren(propVal)
    //propVal.getDisplayProperties()
    if ("function" == typeof propVal.getDisplayProperties){
      var props = propVal.getDisplayProperties()
      for (var i=0; i<props.length; i++){
        if (props[i].hasOwnProperty('levelOfDetail') && "1" == props[i].levelOfDetail){
          summeryCount++
        }
      }
    }
    //console.log(summeryCount)
    return summeryCount
  }
  
  hasChildren(data){
    if ('undefined' == typeof data || null == data) return false
    return ('function' == typeof data.getDisplayProperties)
  }
  /*
  makeList(prop){
    var listVals = []
    if ("tree" == prop.displayDataType){
      listVals = [this.objectToView[prop.propertyName]] // note the array wrapper 
    }else if("list" == prop.displayDataType){
      listVals = this.objectToView[prop.propertyName]
    }
    return listVals
  }
  */
  
  addItem(propVal, prop){
    // the weird extra () down there is because of the way angular stores function references 
    // this.getNewListItem() actualy returns the function signature then the following (prop.propertyName) calls it with our parameter 
    var newItem = this.getNewListItem()(prop.propertyName) 
    if ('undefined' != typeof newItem) propVal.push( newItem )
  }
  
  deleteItem(parent, index, metaData){
    if (!this.isEdit) return
    //console.log(parent)
    //console.log(listVals)
    //console.log(index)
    //console.log(this.objectToView)
    var itemName = metaData.displayName +' '+ (index+1)
    
    swal({
      title: 'Delete '+itemName+'?',
      text: 'Are you sure you want to delete '+itemName+'?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
      showCancelButton: true,
      closeOnConfirm: true
    }, (deleteTransaction) => {
      if (deleteTransaction) {
        // The user has confirmed that the transaction should be deleted
        //listVals.splice(index, 1)
        parent.splice(index, 1)
        this.onChange()
      }
    })
    
  }
  
  // ---
  
  debugLog(mess){
    console.log(mess)
  }
  
  debugSet(){
    console.log(this.objectToView)
    console.log(this.objectToView.getDisplayProperties())
    console.log('')
  }
  
  // ---
}

// AroInfoObjectViewController.$inject = []

let editorInterfaceTree = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-tree.html',
  bindings: {
    objectToView: '=',      // Two Way binding, we will directly edit object values for now!
    objectMetaData: '<', 
    onChange: '&', 
    getNewListItem: '&', 
    isEdit: '<', 
    parentObj: '=', 
    rootMetaData: '<', 
    indentationLevel: '<' 
  },
  controller: EditorInterfaceTreeController
}
export default editorInterfaceTree
