class ResourceManagerController {
  constructor($http) {
    this.$http = $http
    // Define endpoints for each manager type ('manager type' maps to the 'selectedResourceKey' member variable)
    this.managerIdString = 'MANAGER_ID'
    this.managerEndpoints = {
      price_book: {
        getAllManagers: '/service/v1/pricebook',
        getManager: `/service/v1/pricebook/${this.managerIdString}`,
        createManager: '/service/v1/pricebook',
        getManagerAssignments: `/service/v1/pricebook/${this.managerIdString}/assignment`,
        putManagerAssignments: `/service/v1/pricebook/${this.managerIdString}/assignment`
      }
    }
  }

  createBlankManager() {
    var name = 'TestPricebook' + Math.random()
    var description = name

    // Create a resource manager
    var url = this.managerEndpoints[this.selectedResourceKey].createManager
    var createdManagerId = -1
    this.$http.post(url, {
      name: name,
      description: description
    })
    .then((result) => {
      // Get the default manager id
      createdManagerId = result.data.id
      return this.getDefaultManagerId()
    })
    .then((defaultManagerId) => {
      // Get the assignments for the default manager
      var url = this.managerEndpoints[this.selectedResourceKey].getManagerAssignments.replace(this.managerIdString, defaultManagerId)
      return this.$http.get(url)
    })
    .then((result) => {
      // Take the assignments of the default manager, set all values to 0 and then assign that to the newly created manager
      var newManagerAssignments = result.data
      newManagerAssignments.costAssignments.forEach((costAssignment) => {
        costAssignment.state = '*'
        costAssignment.cost = 0
      })
      newManagerAssignments.detailAssignments.forEach((detailAssignment) => {
        detailAssignment.quantity = 0
        detailAssignment.ratioFixed = 1
      })
      var url = this.managerEndpoints[this.selectedResourceKey].putManagerAssignments.replace(this.managerIdString, createdManagerId)
      return this.$http.put(url, newManagerAssignments)
    })
    .then(() => {
      this.setEditingManagerId({ newId: createdManagerId })
      this.setEditingMode({ mode: this.editMode })
    })
    .catch((err) => console.log(err))
  }

  editSelectedManager() {
    this.setEditingManagerId({ newId: this.selectedResourceManager.id })
    this.setEditingMode({ mode: this.editMode })
  }

  getDefaultManagerId() {
    return this.$http.get(this.managerEndpoints[this.selectedResourceKey].getAllManagers)
      .then((result) => Promise.resolve(result.data[0].id))
  }
}

ResourceManagerController.$inject = ['$http']

app.component('resourceManager', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager-component.html',
  bindings: {
    resourceItems: '<',
    selectedResourceKey: '=',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    setEditingManagerId: '&'
  },
  controller: ResourceManagerController
})