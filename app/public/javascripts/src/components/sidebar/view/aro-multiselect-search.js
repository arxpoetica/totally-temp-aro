class AroMultiselectSearchController {
  
    constructor(state) {
      this.state = state
    }
  }
  
  AroMultiselectSearchController.$inject = ['state']
  
  let aroMultiselectSearch = {
    templateUrl: '/components/sidebar/view/aro-multiselect-search.html',
    bindings: {
      objectName : '@',
      labelId : '@',
      searchList : '=',
      selected: '=',
      refreshTagList: '&',
      onSelectionChanged: '&'
    },
    controller: AroMultiselectSearchController
  }
  
  export default aroMultiselectSearch