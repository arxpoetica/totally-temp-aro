// A component for editing values in any generic javascript object. The component will display input
// boxes for string, boolean and integer types. Objects can be nested as deep as required (though it
// will get unweildy to use with too much nesting). Editing of arrays is NOT supported as of now.

class AroObjectEditorController {
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
    return (typeof obj === 'object')
  }

  toggleIsKeyExpanded(index) {
    this.isKeyExpanded[index] = !this.isKeyExpanded[index]
  }
}

// AroObjectEditorController.$inject = []

let aroObjectEditor = {
  templateUrl: '/components/common/aro-object-editor.html',
  bindings: {
    objectToEdit: '=',      // Two Way binding, we will directly edit object values for now!
    indentationLevel: '<'
  },
  controller: AroObjectEditorController
}

export default aroObjectEditor