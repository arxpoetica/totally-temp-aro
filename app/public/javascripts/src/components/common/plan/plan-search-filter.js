class SearchPlanFilterController {
  
    constructor($element, $document, $timeout, state) {
      this.$element = $element
      this.$document = $document
      this.$timeout = $timeout
      this.state = state
      this.selectedItems = []

      var filterDropdown = this.$element.find('.filter-dropdown')

      filterDropdown.on('click', (event) => {
        const isDropdownHidden = filterDropdown.is(':hidden')
        if(!isDropdownHidden && event.target.id !== 'apply-filter') {
          event.stopPropagation()
        }
      })
    }
  }
  
  SearchPlanFilterController.$inject = ['$element', '$document', '$timeout', 'state']
  
  let searchPlanFilter = {
    templateUrl: '/components/common/plan/plan-search-filter.html',
    bindings: {
      objectName : '@',
      searchList : '<',
      applySearch: '&',
      refreshTagList: '&'
    },
    controller: SearchPlanFilterController
  }
  
  export default searchPlanFilter