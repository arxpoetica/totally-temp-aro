// This is a multi-select component that wraps the bootstrap-multiselect library (http://davidstutz.github.io/bootstrap-multiselect/).
// The library (css and js) must be included somewhere in the html (index.html?) before using this component.

class AroMultiSelectController {
  constructor($element) {
    this.$element = $element
    this.selectElement = null 
    this.previousItemsLength
    this.previousSelectedItems = []
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
        maxHeight: this.maxHeight ? this.maxHeight : 200,
        includeSelectAllOption: this.enableSearch ? true : false,
        enableFiltering: this.enableSearch ? true : false,
        nonSelectedText: this.placeholder ? this.placeholder : 'None Selected'
      }), 0);
  }

  $doCheck() {
    if (this.isRebuildNeed()) {
      this.previousItemsLength = this.allItems.length
      this.previousSelectedItems = this.currentSelectedItems
      setTimeout(() => {
        this.selectElement.multiselect('rebuild');
      }, 0);
    }
  }

  isRebuildNeed() {
    //This will rebuild, when we add new data items.
    if(this.previousItemsLength != this.allItems.length) {
      return true
    }

    if(this.currentSelectedItems.length != this.previousSelectedItems.length) {
      return true
    }
    
    //Rebuilding multi-select when haskey missmatch between UI and bootstrab
    if(this.currentSelectedItems.length > 0 && this.previousSelectedItems.length > 0) {
      if (!angular.equals(this.currentSelectedItems[0].$$hashKey, this.previousSelectedItems[0].$$hashKey)) {
         return true
      }
    }
    return false
  }
}

AroMultiSelectController.$inject = ['$element']

let aroMultiSelect = {
  template: `
    <select multiple="multiple"
            ng-model="$ctrl.model"
            ng-options="item.name || item.code for item in $ctrl.allItems">
    </select>
  `,
  bindings: {
    model: '=',             // Will be passed in as a ng-model to our select. Two Way binding for now!
    allItems: '<',          // All the items to show.
    currentSelectedItems: '<', // currently Selected Items
    maxHeightInPixels: '<', // [Optional] The maximum height of the component in pixels
    selectionChanged: '&',   // [Optional] Called when the selected items change
    enableSearch: '@',
    placeholder: '@'  // [optional] placeholder to show
  },
  controller: AroMultiSelectController
}

export default aroMultiSelect