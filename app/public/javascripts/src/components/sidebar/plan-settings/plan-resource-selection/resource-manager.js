import ResourceManagerActions from '../../../../react/components/resource-manager/resource-manager-actions'

class ResourceManagerController {
  constructor ($http, $document, $ngRedux, state) {
    this.$http = $http
    this.$document = $document
    this.state = state
    this.filterByOptions = {}
    this.searchText = ''
    // Hold a mapping that we use to map from resource keys to endpoints
    this.resourceKeyToEndpointId = {
      price_book: 'pricebook',
      roic_manager: 'roic-manager',
      arpu_manager: 'arpu-manager',
      impedance_mapping_manager: 'impedance-manager',
      tsm_manager: 'tsm-manager',
      competition_manager: 'competitor-manager',
      rate_reach_manager: 'rate-reach-matrix'
    }

    // ToDo: once server can make new versions of all types this won't be needed
    this.canMakeNewFilter = {
      'price_book': true,
      'rate_reach_manager': true,
      'competition_manager': true
    }

    this.managerIdString = 'MANAGER_ID'
    this.rows = []

    this.displayProps = [
      {
        'propertyName': 'name',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Name',
        'enumTypeURL': '',
        'displayDataType': 'string',
        'defaultValue': '',
        'editable': true,
        'visible': true
      },
      {
        'propertyName': 'resourceType', // 'managerType',
        'levelOfDetail': 0,
        'format': '',
        'displayName': 'Resource Type',
        'enumTypeURL': '',
        'displayDataType': 'string',
        'defaultValue': '',
        'editable': false,
        'visible': true
      }
    ]

    this.idProp = 'id' // unique id of each row

    this.actions = [
      {
        buttonText: 'Edit', // Edit
        buttonClass: 'btn-light',
        iconClass: 'fa-edit',
        toolTip: 'Edit',
        isEnabled: (row, index) => {
          return this.canEdit(row)
        },
        callBack: (row, index) => {
          this.editSelectedManager(row)
        }
      },
      {
        buttonText: 'Clone', // Clone
        buttonClass: 'btn-light',
        iconClass: 'fa-copy',
        toolTip: 'Clone',
        callBack: (row, index) => {
          this.cloneSelectedManagerFromSource(row)
        }
      },
      {
        buttonText: 'Delete', // Delete
        buttonClass: 'btn-outline-danger',
        iconClass: 'fa-trash-alt',
        toolTip: 'Delete',
        isEnabled: (row, index) => {
          return this.canAdmin(row)
        },
        callBack: (row, index) => {
          this.deleteSelectedResourceManager(row)
        }
      }
    ]
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  canEdit (row) {
    return this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_WRITE'].permissions, row.permissions)
  }

  canAdmin (row) {
    return this.state.loggedInUser.hasPermissions(this.state.authPermissionsByName['RESOURCE_ADMIN'].permissions, row.permissions)
  }

  $onChanges (changes) {
    if (changes.hasOwnProperty('resourceItems') || changes.hasOwnProperty('selectedResourceKey')) {
      this.getRows()
    }
    if (changes.hasOwnProperty('resourceItems')) {
      this.buildFilterOptions()
    }
    if (changes.hasOwnProperty('selectedResourceKey')) {
      this.getRows()
    }
  }

  onSelectedResourceKeyChanged () {
    this.setCurrentSelectedResourceKey({ resourceKey: this.selectedResourceKey })
  }

  buildFilterOptions () {
    var newFilterByOptions = { 'all': 'all' }

    for (const key in this.resourceItems) {
      if (this.resourceItems.hasOwnProperty(key)) {
        if (this.resourceItems[key].hasOwnProperty('allManagers')) {
          var desc = key
          if (this.resourceItems[key].hasOwnProperty('description')) {
            desc = this.resourceItems[key].description
          }
          newFilterByOptions[key] = desc
        }
      }
    }
    this.filterByOptions = newFilterByOptions
  }
  onSearch () {
    this.getRows()
  }

  getRows () {
    if (!this.state.loggedInUser) {
      return
    }

    var props = ''
    if (this.searchText.trim() !== '') {
      props += `&name=${this.searchText}`
    }
    if (this.selectedResourceKey && (this.selectedResourceKey !== 'all')) {
      props += `&resourceType=${this.selectedResourceKey}`
    }
    if (props !== '') {
      props = '?' + props
    }
    this.$http.get(`service/v2/resource-manager${props}`)
      .then((result) => {
        var newRows = []
        var i
        for (i = 0; i < result.data.length; i++) {
          if (!result.data[i].deleted) {
            var row = result.data[i]
            newRows.push(row)
          }
        }
        this.rows = newRows
      })
    // end promise
  }

  createByEditMode (createMode, sourceId) {
    this.setEditingManagerId({ newId: sourceId })
    this.setEditingMode({ mode: createMode })
  }

  cloneSelectedManagerFromSource (selectedManager) {
    this.newManager(selectedManager.resourceType, selectedManager.id)
  }

  newManager (resourceType, sourceId) {
    if ('undefined' === typeof sourceId) sourceId = null // new one
    this.setCurrentSelectedResourceKey({ resourceKey: resourceType })

    // TODO: once endpoint is ready use v2/resource-manager for pricebook and rate-reach-matrix as well
    var managerId = this.resourceKeyToEndpointId[resourceType]
    if (managerId === 'pricebook') {
      // Have to put this switch in here because the API for pricebook cloning is different. Can remove once API is unified.
      this.createByEditMode(this.createPriceBookMode, sourceId)
    } else if (managerId === 'rate-reach-matrix') {
      this.createByEditMode(this.createRateReachManagerMode, sourceId)
    } else {
      // Create a resource manager
      this.getNewResourceDetailsFromUser()
        .then((resourceName) => {
        // Create a new manager with the specified name and description
          var idParam = ''
          if (null != sourceId) idParam = `resourceManagerId=${sourceId}&`
          return this.$http.post(`/service/v2/resource-manager?${idParam}user_id=${this.state.loggedInUser.id}`,
            { resourceType: resourceType, name: resourceName, description: resourceName })
        })
        .then((result) => {
          // this.onManagerCreated(result.data.id)
          // server is returning null for resourceType, until that's fixed:
          if (result.data && result.data.resourceType === null) result.data.resourceType = resourceType
          this.editSelectedManager(result.data)
        })
        .catch((err) => console.error(err))
    }
  }
  /*
  onManagerCreated (createdManagerId) {
    this.setEditingManagerId({ newId: createdManagerId })
    this.setEditingMode({ mode: this.editMode })
    this.onManagersChanged && this.onManagersChanged()
    return Promise.resolve()
  }
  */
  editSelectedManager (selectedManager) {
    this.setEditingManagerId({ newId: selectedManager.id })
    this.setCurrentSelectedResourceKey({ resourceKey: selectedManager.resourceType })
    this.startEditingResourceManager(selectedManager.id, selectedManager.resourceType, selectedManager.name)
    this.setEditingMode({ mode: this.editMode })
  }

  askUserToConfirmManagerDelete (managerName) {
    return new Promise((resolve, reject) => {
      swal({
        title: 'Delete resource manager?',
        text: `Are you sure you want to delete "${managerName}"?`,
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

  deleteManager (selectedManager) {
    this.$http.delete(`service/v2/resource-manager/${selectedManager.id}`)
      .then((result) => {
        this.onManagersChanged && this.onManagersChanged()
      // this.resourceItems[this.selectedResourceKey].selectedManager = this.resourceItems[this.selectedResourceKey].allManagers[0]
      })
      .catch((err) => console.error(err))
  }

  deleteSelectedResourceManager (selectedManager) {
    this.askUserToConfirmManagerDelete(selectedManager.name)
      .then((okToDelete) => {
        if (okToDelete) {
          this.deleteManager(selectedManager)
        }
      })
      .catch((err) => console.error(err))
  }

  // Showing a SweetAlert from within a modal dialog does not work (The input box is not clickable).
  // Workaround from https://github.com/t4t5/sweetalert/issues/412#issuecomment-234675096
  // Call this function before showing the SweetAlert
  fixBootstrapModal () {
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
  restoreBootstrapModal () {
    var modalNode = this.$document[0].querySelector('.modal.js-swal-fixed')
    if (!modalNode) return

    modalNode.setAttribute('tabindex', '-1')
    modalNode.classList.remove('js-swal-fixed')
  }

  getNewResourceDetailsFromUser () {
    // Get the name for a new plan from the user
    this.fixBootstrapModal() // Workaround to show SweetAlert from within a modal dialog
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
        this.restoreBootstrapModal() // Workaround to show SweetAlert from within a modal dialog
        if (resourceName) {
          resolve(resourceName)
        } else {
          reject('Cancelled')
        }
      })
    })
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      startEditingResourceManager: (id, type, name) => dispatch(ResourceManagerActions.startEditingResourceManager(id, type, name))
    }
  }
}

ResourceManagerController.$inject = ['$http', '$document', '$ngRedux', 'state']

let resourceManager = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager.html',
  bindings: {
    resourceItems: '<',
    selectedResourceKey: '<',
    listMode: '<',
    editMode: '<',
    createPriceBookMode: '<',
    createRateReachManagerMode: '<',
    setEditingMode: '&',
    setEditingManagerId: '&',
    onManagersChanged: '&',
    setCurrentSelectedResourceKey: '&'
  },
  controller: ResourceManagerController
}

export default resourceManager
