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
    //console.log(data)
    //console.log(this.objectToView)
    if ('undefined' == typeof data || null == data) data = this.objectToView
    if ('undefined' == typeof data || null == data) return false
    
    if (!prop.visible) return false
    if (!data.hasOwnProperty(prop.propertyName)) return false
    
    return true
  }
  
  getSummeryCount(props){
    var summeryCount = 0
    for (var i=0; i<props.length; i++){
      if (props[i].hasOwnProperty('levelOfDetail') && "1" == props[i].levelOfDetail){
        summeryCount++
      }
    }
    
    return summeryCount
  }
  
  hasChildren(data){
    if ('undefined' == typeof data || null == data) return false
    return ('function' == typeof data.getDisplayProperties)
  }
  
  makeList(prop){
    var listVals = []
    if ("tree" == prop.format){
      listVals = [this.objectToView[prop.propertyName]] // note the array wrapper 
    }else if("list" == prop.format){
      listVals = this.objectToView[prop.propertyName]
    }
    return listVals
  }
}

// AroInfoObjectViewController.$inject = []

let editorInterfaceTree = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-tree.html',
  bindings: {
    objectToView: '=',      // Two Way binding, we will directly edit object values for now!
    onChange: '&', 
    isEdit: '<', 
    indentationLevel: '<'
  },
  controller: EditorInterfaceTreeController
}
export default editorInterfaceTree
