class ResourceManagerController {
  constructor($http, $document) {
    this.$http = $http
    this.$document = $document
    // Define endpoints for each manager type ('manager type' maps to the 'selectedResourceKey' member variable)
    this.managerIdString = 'MANAGER_ID'
    this.managerEndpoints = {
      price_book: {
        getAllManagers: '/service/v1/pricebook',
        getManager: `/service/v1/pricebook/${this.managerIdString}`,
        createManager: '/service/v1/pricebook',
        deleteManager: `/service/v1/pricebook/${this.managerIdString}`,
        getManagerAssignments: `/service/v1/pricebook/${this.managerIdString}/assignment`,
        putManagerAssignments: `/service/v1/pricebook/${this.managerIdString}/assignment`
      }
    }
  }

  $onInit() {
    this.selectFirstResourceManager()
  }

  selectFirstResourceManager() {
    if (this.resourceItems
        && this.resourceItems[this.selectedResourceKey]
        && this.resourceItems[this.selectedResourceKey].allManagers.length > 0) {
      this.selectedResourceManager = this.resourceItems[this.selectedResourceKey].allManagers[0]
    }
  }

  onSelectedResourceKeyChanged() {
    this.selectFirstResourceManager()
  }

  $doCheck() {
    if (this.resourceItems && this.resourceItems !== this.oldResourceItems) {
      this.selectFirstResourceManager()
      this.oldResourceItems = this.resourceItems
    }
  }

  createBlankManager() {
    // Create a resource manager
    var url = this.managerEndpoints[this.selectedResourceKey].createManager
    var createdManagerId = -1
    this.getNewPlanDetailsFromUser()
    .then((resourceName) => {
      return this.$http.post(url, {
        name: resourceName,
        description: resourceName
      })
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
      this.onManagersChanged && this.onManagersChanged()
      this.selectFirstResourceManager()
    })
    .catch((err) => console.error(err))
  }

  cloneSelectedManager() {
    // Create a resource manager
    var url = this.managerEndpoints[this.selectedResourceKey].createManager
    var createdManagerId = -1
    this.getNewPlanDetailsFromUser()
    .then((resourceName) => {
      return this.$http.post(url, {
        name: resourceName,
        description: resourceName
      })
    })
    .then((result) => {
      createdManagerId = result.data.id
      // Get the assignments for the selected manager
      var url = this.managerEndpoints[this.selectedResourceKey].getManagerAssignments.replace(this.managerIdString, this.selectedResourceManager.id)
      return this.$http.get(url)
    })
    .then((result) => {
      // Take the assignments for the selected manager and overwrite them onto the created manager
      var url = this.managerEndpoints[this.selectedResourceKey].putManagerAssignments.replace(this.managerIdString, createdManagerId)
      return this.$http.put(url, result.data)
    })
    .then(() => {
      this.setEditingManagerId({ newId: createdManagerId })
      this.setEditingMode({ mode: this.editMode })
      this.onManagersChanged && this.onManagersChanged()
      this.selectFirstResourceManager()
    })
    .catch((err) => console.error(err))
  }

  editSelectedManager() {
    this.setEditingManagerId({ newId: this.selectedResourceManager.id })
    this.setEditingMode({ mode: this.editMode })
  }

  deleteSelectedManager() {
    var url = this.managerEndpoints[this.selectedResourceKey].deleteManager.replace(this.managerIdString, this.selectedResourceManager.id)
    this.$http.delete(url)
    .then((result) => {
      this.onManagersChanged && this.onManagersChanged()
      this.selectFirstResourceManager()
    })
    .catch((err) => console.error(err))
  }

  getDefaultManagerId() {
    return this.$http.get(this.managerEndpoints[this.selectedResourceKey].getAllManagers)
      .then((result) => Promise.resolve(result.data[0].id))
  }

  // Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before showing the SweetAlert
  fixBootstrapModal() {
    var modalNodes = this.$document[0].querySelectorAll('.modal[tabindex="-1"]');
    if (!modalNodes) return;

    modalNodes.forEach((modalNode) => {
      modalNode.removeAttribute('tabindex');
      modalNode.classList.add('js-swal-fixed');
    })
  }

  // Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before hiding the SweetAlert
  restoreBootstrapModal() {
    var modalNode = this.$document[0].querySelector('.modal.js-swal-fixed');
    if (!modalNode) return;

    modalNode.setAttribute('tabindex', '-1');
    modalNode.classList.remove('js-swal-fixed');
  }

  getNewPlanDetailsFromUser() {
    // Get the name for a new plan from the user
    this.fixBootstrapModal()  // Workaround to show SweetAlert from within a modal dialog
    return new Promise((resolve, reject) => {
      var swalOptions = {
        title: 'Resource name required',
        text: 'Enter the name of the new resource',
        type: 'input',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'OK'
      }
      swal(swalOptions, (resourceName) => {
        this.restoreBootstrapModal()  // Workaround to show SweetAlert from within a modal dialog
        if (resourceName) {
          resolve(resourceName)
        } else {
          reject('Cancelled')
        }
      })
    })
  }

}

ResourceManagerController.$inject = ['$http', '$document']

app.component('resourceManager', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager-component.html',
  bindings: {
    resourceItems: '<',
    selectedResourceKey: '=',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    setEditingManagerId: '&',
    onManagersChanged: '&'
  },
  controller: ResourceManagerController
})