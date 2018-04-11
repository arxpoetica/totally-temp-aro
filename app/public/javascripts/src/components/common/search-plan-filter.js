class SearchPlanFilterController {
  
    constructor($element, $document, $timeout, state) {
      this.$element = $element
      this.$document = $document
      this.$timeout = $timeout
      this.state = state
      this.selectedItems = []
    }
  }
  
  SearchPlanFilterController.$inject = ['$element', '$document', '$timeout', 'state']
  
  let searchPlanFilter = {
    templateUrl: '/components/common/search-plan-filter.html',
    bindings: {
      objectName : '@',
      searchList : '<',
      applySearch: '&'
    },
    controller: SearchPlanFilterController
  }
  
  export default searchPlanFilter