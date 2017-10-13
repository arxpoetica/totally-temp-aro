class AroObjectEditorController {
  constructor() {
    // Store the "Object.keys()" function so we can use it in the markup
    this.ObjectKeys = Object.keys
  }

  $onInit() {
    this.paddingLeftPixels = this.paddingLeftPixels || 0
    console.log(this.objectToEdit)
  }

  isEditable(obj) {
    return (typeof obj === 'number') || (typeof obj === 'string') || (typeof obj === 'boolean')
  }

  isExpandable(obj) {
    return (typeof obj === 'object') && (!Array.isArray(obj))
  }
}

// AroObjectEditorController.$inject = []

app.component('aroObjectEditor', {
  templateUrl: '/components/common/aro-object-editor-component.html',
  bindings: {
    objectToEdit: '=',      // Two Way binding, we will directly edit object values for now!
    paddingLeftPixels: '<'
  },
  controller: AroObjectEditorController
})