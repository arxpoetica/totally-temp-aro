import MockService from './mockService'

class ManageGroupsController {

  constructor($http) {
  }
}

ManageGroupsController.$inject = ['$http']

let manageGroups = {
  templateUrl: '/components/global-settings/manage-groups.html',
  bindings: {
    managerView: '='
  },
  controller: ManageGroupsController
}

export default manageGroups