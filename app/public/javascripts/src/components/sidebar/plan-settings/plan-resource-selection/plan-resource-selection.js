
class ResourceSelectionController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
  }
  
  onSelectionChanged() {
    this.onChange({childKey:this.key, isValid:true})
  }
  
}

ResourceSelectionController.$inject = ['$http', '$timeout', 'state']

// Component did not work when it was called 'dataSelection'
let planResourceSelection = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/plan-resource-selection.html',
  bindings: {
    userId: '<',
    planId: '<', 
    key: '<', 
    onChange: '&'
  },
  controller: ResourceSelectionController
}

export default planResourceSelection