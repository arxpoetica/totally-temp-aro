class ResourceManagerController {
  constructor($http, $document, state) {
    this.$http = $http
    this.$document = $document
    this.state = state
    // Hold a mapping that we use to map from resource keys to endpoints
    this.resourceKeyToEndpointId = {
      price_book: 'pricebook',
      roic_manager: 'roic-manager',
      arpu_manager: 'arpu-manager',
      impedance_mapping_manager: 'impedance-manager'
    }
    // Define endpoints for each manager type ('manager type' maps to the 'selectedResourceKey' member variable)
    this.managerIdString = 'MANAGER_ID'
    this.managerEndpoints = {
      price_book: {
        deleteManager: `/service/v1/pricebook/${this.managerIdString}`
      }
    }
  }

  $onInit() {
    this.selectFirstResourceManager()
  }

  $onChanges(changesObj) {
    if (changesObj.selectedResourceKey) {
      this.selectFirstResourceManager()
    }
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

  createBlankPriceBook() {
    this.setEditingManagerId({ newId: null })
    this.setEditingMode({ mode: 'SHOW_PRICEBOOK_CREATOR' })
  }

  cloneSelectedPriceBook() {
    this.setEditingManagerId({ newId: this.selectedResourceManager.id })
    this.setEditingMode({ mode: 'SHOW_PRICEBOOK_CREATOR' })
  }

  cloneSelectedManagerFromSource(managerId) {

    if (managerId === 'pricebook') {
      // Have to put this switch in here because the API for pricebook cloning is different. Can remove once API is unified.
      this.cloneSelectedPriceBook()
    } else {
      // Create a resource manager
      this.getNewResourceDetailsFromUser()
      .then((resourceName) => {
        // Create a new manager with the specified name and description
        return this.$http.post(`/service/v1/${managerId}?source_manager=${this.selectedResourceManager.id}`,
                              { name: resourceName, description: resourceName })
      })
      .then((result) => this.onManagerCreated(result.data.id))
      .catch((err) => console.error(err))
    }
  }

  onManagerCreated(createdManagerId) {
    this.setEditingManagerId({ newId: createdManagerId })
    this.setEditingMode({ mode: this.editMode })
    this.onManagersChanged && this.onManagersChanged()
    this.selectFirstResourceManager()
    return Promise.resolve()
  }

  editSelectedManager() {
    this.setEditingManagerId({ newId: this.selectedResourceManager.id })
    this.setEditingMode({ mode: this.editMode })
    this.setCurrentSelectedResourceKey({ resourceKey: this.selectedResourceKey })
  }

  askUserToConfirmManagerDelete(managerName) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete resource manager?',
        text: `Are you sure you want to delete ${managerName}`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }, (result) => {
        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  deleteManager(deleteUrl) {
    this.$http.delete(deleteUrl)
      .then((result) => {
        this.onManagersChanged && this.onManagersChanged()
        this.selectFirstResourceManager()
      })
      .catch((err) => console.error(err))
  }

  deleteSelectedResourceManager(managerId) {
    this.askUserToConfirmManagerDelete(this.selectedResourceManager.name)
      .then((okToDelete) => {
        if (okToDelete) {
          this.deleteManager(`/service/v1/${managerId}/${this.selectedResourceManager.id}`)
        }
      })
      .catch((err) => console.error(err))
  }

  // Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before showing the SweetAlert
  fixBootstrapModal() {
    var modalNodes = this.$document[0].querySelectorAll('.modal')
    if (!modalNodes) return

    modalNodes.forEach((modalNode) => {
      modalNode.removeAttribute('tabindex')
      modalNode.classList.add('js-swal-fixed')
    })
  }

  // Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before hiding the SweetAlert
  restoreBootstrapModal() {
    var modalNode = this.$document[0].querySelector('.modal.js-swal-fixed')
    if (!modalNode) return

    modalNode.setAttribute('tabindex', '-1')
    modalNode.classList.remove('js-swal-fixed')
  }

  getNewResourceDetailsFromUser() {
    this.state.planInputsModal.next(true)
    return Promise.resolve('asdf')
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

ResourceManagerController.$inject = ['$http', '$document', 'state']

let resourceManager = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager.html',
  bindings: {
    resourceItems: '<',
    selectedResourceKey: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    setEditingManagerId: '&',
    onManagersChanged: '&',
    setCurrentSelectedResourceKey: '&'
  },
  controller: ResourceManagerController
}

export default resourceManager