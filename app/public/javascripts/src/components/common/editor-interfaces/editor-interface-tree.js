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

  isEditable(obj) {
    return (typeof obj === 'number') || (typeof obj === 'string') || (typeof obj === 'boolean') || Array.isArray(obj)
  }

  isExpandable(obj) {
    return (typeof obj === 'object' && !angular.equals({}, obj))// && object isn't empty, ToDo: check that at least one child it showable
  }

  toggleIsKeyExpanded(index) {
    this.isKeyExpanded[index] = !this.isKeyExpanded[index]
  }
  
  doShow(prop){
    console.log(prop)
    if (!prop.visible) return false
    if (!this.objectToView.hasOwnProperty(prop.propertyName)) return false
    
    return true
  }
}

// AroInfoObjectViewController.$inject = []

let editorInterfaceTree = {
  templateUrl: '/components/common/editor-interfaces/editor-interface-tree.html',
  bindings: {
    objectToView: '=',      // Two Way binding, we will directly edit object values for now!
    displayProps: '<', 
    isEdit: '<', 
    indentationLevel: '<'
  },
  controller: EditorInterfaceTreeController
}
export default editorInterfaceTree
