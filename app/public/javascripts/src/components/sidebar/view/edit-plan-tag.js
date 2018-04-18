class EditPlanTagController {
  
    constructor(state) {
      this.state = state
    }
  }
  
  EditPlanTagController.$inject = ['state']
  
  let editPlanTag = {
    templateUrl: '/components/sidebar/view/edit-plan-tag.html',
    bindings: {
      objectName : '@',
      searchList : '=',
      selectedList: '=',
      refreshTagList: '&'
    },
    controller: EditPlanTagController
  }
  
  export default editPlanTag