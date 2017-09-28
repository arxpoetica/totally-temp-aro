// This is a multi-select component that wraps the bootstrap-multiselect library (http://davidstutz.github.io/bootstrap-multiselect/).
// The library (css and js) must be included somewhere in the html (index.html?) before using this component.

class AroMultiSelectController {
  constructor() {
    // Create an ID for the multiselect that we will use in the selector. Cant have periods in the id.
    this.multiSelectId = 'multiselect' + Math.random().toString().replace('.', '_')
  }

  $onInit() {
    // Call the multiselect() method on our select.
    setTimeout(() => $(`#${this.multiSelectId}`).multiselect({
        buttonWidth: '100%',
        onChange: () => {
          if (this.selectionChanged) {
            this.selectionChanged()
          }
        }
      }), 0);
  }
}

app.component('aroMultiSelect', {
  templateUrl: '/components/common/aro-multiselect-component.html',
  bindings: {
    model: '=',
    allItems: '<',
    selectionChanged: '&'
  },
  controller: AroMultiSelectController
})