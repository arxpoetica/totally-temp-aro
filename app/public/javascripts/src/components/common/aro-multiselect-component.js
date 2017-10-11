// This is a multi-select component that wraps the bootstrap-multiselect library (http://davidstutz.github.io/bootstrap-multiselect/).
// The library (css and js) must be included somewhere in the html (index.html?) before using this component.

class AroMultiSelectController {
  constructor($element) {
    this.$element = $element
    this.selectElement = null 
    this.previousItemsLength
  }

  $onInit() {
    // Call the bootstrap-multiselect library's multiselect() method on our '<select>' child element.
    this.selectElement = this.$element.find('select')
    setTimeout(() => this.selectElement.multiselect({
        buttonWidth: '100%',
        onChange: () => {
          if (this.selectionChanged) {
            this.selectionChanged()
          }
        },
        maxHeight: this.maxHeight ? this.maxHeight : 200
      }), 0);
  }

  $doCheck() {
    if (this.previousItemsLength != this.allItems.length) {
      this.previousItemsLength = this.allItems.length
      setTimeout(() => {
        this.selectElement.multiselect('rebuild');
      }, 0);
    }
  }
}

AroMultiSelectController.$inject = ['$element']

app.component('aroMultiSelect', {
  template: `
    <select multiple="multiple"
            ng-model="$ctrl.model"
            ng-options="item.name for item in $ctrl.allItems">
    </select>
  `,
  bindings: {
    model: '=',             // Will be passed in as a ng-model to our select. Two Way binding for now!
    allItems: '<',          // All the items to show.
    maxHeightInPixels: '<', // [Optional] The maximum height of the component in pixels
    selectionChanged: '&'   // [Optional] Called when the selected items change
  },
  controller: AroMultiSelectController
})