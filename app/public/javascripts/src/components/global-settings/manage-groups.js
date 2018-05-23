import MockService from './mockService'

class ManageGroupsController {

  constructor($http) {

    this.groups = [
      {
        name: 'Administrators',
        isAdmin: true
      },
      {
        name: 'CAF Planners',
        isAdmin: false
      },
      {
        name: 'Ohio CAF PLanners',
        isAdmin: false
      }
    ]
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