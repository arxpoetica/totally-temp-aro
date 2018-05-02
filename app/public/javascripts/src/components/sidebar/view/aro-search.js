class AroSearchController {
  
    constructor(state) {
      this.state = state
    }
  }
  
  AroSearchController.$inject = ['state']
  
  let aroSearch = {
    templateUrl: '/components/sidebar/view/aro-search.html',
    bindings: {
      objectName : '@',
      searchList : '=',
      selected: '=',
      refreshTagList: '&',
      onSelectionChanged: '&'
    },
    controller: AroSearchController
  }
  
  export default aroSearch