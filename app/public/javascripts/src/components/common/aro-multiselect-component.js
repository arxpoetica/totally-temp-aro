// This is a multi-select component that wraps the bootstrap-multiselect library (http://davidstutz.github.io/bootstrap-multiselect/).
// The library (css and js) must be included somewhere in the html (index.html?) before using this component.

class AroMultiSelectController {
  constructor($element) {
    this.$element = $element
  }

  $onInit() {
    // Call the bootstrap-multiselect library's multiselect() method on our '<select>' child element.
    var selectElement = this.$element.find('select')
    setTimeout(() => selectElement.multiselect({
        buttonWidth: '100%',
        onChange: () => {
          if (this.selectionChanged) {
            this.selectionChanged()
          }
        }
      }), 0);
  }
}

AroMultiSelectController.$inject = ['$element']

app.component('aroMultiSelect', {
  templateUrl: '/components/common/aro-multiselect-component.html',
  bindings: {
    model: '=',             // Will be passed in as a ng-model to our select
    allItems: '<',          // All the items to show
    selectionChanged: '&'   // Called when the selected items change
  },
  controller: AroMultiSelectController
})