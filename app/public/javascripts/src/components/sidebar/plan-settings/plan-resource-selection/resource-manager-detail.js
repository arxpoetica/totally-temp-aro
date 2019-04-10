
class ResourceManagerDetailController {
  constructor () {
    
  }
  
}

//ResourceManagerDetailController.$inject = ['$http', '$document', 'state']

let resourceManagerDetail = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager-detail.html',
  bindings: {
    resourceManager: '='
  },
  controller: ResourceManagerDetailController
}

export default resourceManagerDetail