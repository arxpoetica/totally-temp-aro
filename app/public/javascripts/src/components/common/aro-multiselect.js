// This is a multi-select component that wraps the bootstrap-multiselect library (http://davidstutz.github.io/bootstrap-multiselect/).
// The library (css and js) must be included somewhere in the html (index.html?) before using this component.

class AroMultiSelectController {
  constructor ($element) {
    this.$element = $element
    this.selectElement = null
    this.previousItemsLength
    this.previousSelectedItems = []
  }

  $onInit () {
    this.trackBy = this.trackBy || 'id' // The property used to track ng-options. Default to 'id' if not specified
    // Call the bootstrap-multiselect library's multiselect() method on our '<select>' child element.
    this.selectElement = this.$element.find('select')
    setTimeout(() => this.selectElement.multiselect({
      buttonWidth: '100%',
      enableHTML: !!this.enableHtml,
      onChange: () => {
        if (this.selectionChanged) {
          this.selectionChanged({ dataSource: this.datasourceType })
        }
      },
      maxHeight: this.maxHeight ? this.maxHeight : 200,
      includeSelectAllOption: !!this.enableSearch,
      enableFiltering: !!this.enableSearch,
      nonSelectedText: this.placeholder ? this.placeholder : 'None Selected',
      onDropdownShow: (event) => {
        var menu = $(event.currentTarget).find('.dropdown-menu')
        menu.css('overflow-x', 'auto')
        menu.css('width', '100%')
      }
    }), 0)
  }

  $doCheck () {
    if (this.previousItemsLength != this.allItems.length || this.previousModelLength !== this.model.length) {
      this.previousItemsLength = this.allItems.length
      this.previousModelLength = this.model.length
      setTimeout(() => {
        this.selectElement.multiselect('rebuild')
      }, 0)
    }
  }
}

AroMultiSelectController.$inject = ['$element']

let aroMultiSelect = {
  template: `
    <select multiple="multiple"
            ng-model="$ctrl.model"
            ng-options="item.name || item.code for item in $ctrl.allItems track by item[$ctrl.trackBy]">
    </select>
  `,
  bindings: {
    datasourceType: '@',
    model: '=', // Will be passed in as a ng-model to our select. Two Way binding for now!
    allItems: '<', // All the items to show.
    selectionChanged: '&', // [Optional] Called when the selected items change
    trackBy: '<', // [Optional] The property for the items to be used for tracking by. Defaults to 'id'
    enableSearch: '@',
    enableHtml: '@',
    placeholder: '@' // [optional] placeholder to show
  },
  controller: AroMultiSelectController
}

export default aroMultiSelect
