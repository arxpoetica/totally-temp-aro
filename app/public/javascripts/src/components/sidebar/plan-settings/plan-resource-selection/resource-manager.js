class ResourceManagerController {
  constructor($http, $document, state) {
    this.$http = $http
    this.$document = $document
    this.state = state
    this.filterByOptions = {}
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
    this.managerIdString = 'MANAGER_ID'
    this.managerDeleteUrl = {
      price_book: `/service/v1/pricebook/${this.managerIdString}`,
      roic_manager: `/service/v1/roic_manager/${this.managerIdString}`,
      arpu_manager: `/service/v1/arpu_manager/${this.managerIdString}`,
      impedance_mapping_manager: `/service/v1/impedance_mapping_manager/${this.managerIdString}`,
      tsm_manager: `/service/v1/tsm_manager/${this.managerIdString}`,
      competition_manager: `/service/v1/competition_manager/${this.managerIdString}`,
      rate_reach_manager: `/service/rate-reach-matrix/resource/${this.managerIdString}`
    }
    
    this.rows = []
    
    this.displayProps = [
      {
        "propertyName": "managerType",
        "levelOfDetail": 0,
        "format": "",
        "displayName": "Resource Type",
        "enumTypeURL": "",
        "displayDataType": "string",
        "defaultValue": "",
        "editable": false,
        "visible": true
      },
      {
        "propertyName": "name",
        "levelOfDetail": 0,
        "format": "",
        "displayName": "Name",
        "enumTypeURL": "",
        "displayDataType": "string",
        "defaultValue": "",
        "editable": true,
        "visible": true
      }
    ]
    
    this.actions = [
      {
        buttonText: '', //Delete
        buttonClass: "btn-danger", 
        iconClass: "fa-trash-alt", 
        toolTip: "Delete", 
        callBack: (row, index) => {
          //console.log('Delete')
          //console.log(row)
          this.deleteSelectedResourceManager(row)
        }
      }, 
      {
        buttonText: '', //Edit
        buttonClass: "btn-primary", 
        iconClass: "fa-edit", 
        toolTip: "Edit", 
        callBack: (row, index) => {
          //console.log('Edit') 
          //console.log(row)
          this.editSelectedManager(row)
        }
      }, 
      {
        buttonText: '', // Clone
        buttonClass: "btn-primary", 
        iconClass: "fa-copy", 
        toolTip: "Clone", 
        callBack: (row, index) => {
          //console.log('Clone')
          //console.log(row)
          this.cloneSelectedManagerFromSource(row)
        }
      }/*
      {
        buttonText: '', // Permissions
        buttonClass: "btn-primary", // use default
        iconClass: "fa-user-plus", 
        toolTip: "Permissions", 
        callBack: function(index, row){console.log('permissions');console.log(row)}
      }
      */
    ]
    
  }
  
  
  $onChanges(changes){
    if (changes.hasOwnProperty('resourceItems') || changes.hasOwnProperty('selectedResourceKey')){
      this.buildRows()
    }
    if (changes.hasOwnProperty('resourceItems')){
      this.buildFilterOptions()
    }
  }
  
  onSelectedResourceKeyChanged(){
    this.buildRows()
  }
  
  buildRows(){
    var newRows = []
    
    for (const key in this.resourceItems) {
      if (this.resourceItems.hasOwnProperty(key)){
        if (this.resourceItems[key].hasOwnProperty("allManagers")
            && ('all' == this.selectedResourceKey || key == this.selectedResourceKey)
        ){
          newRows = newRows.concat( this.resourceItems[key].allManagers )
        }
      }
    }
    this.rows = newRows
  }
  
  buildFilterOptions(){
    var newFilterByOptions = {'all':'all'}
    
    for (const key in this.resourceItems) {
      if (this.resourceItems.hasOwnProperty(key)){
        if (this.resourceItems[key].hasOwnProperty("allManagers")){
          var desc = key
          if (this.resourceItems[key].hasOwnProperty('description')){
            desc = this.resourceItems[key].description
          }
          //newFilterByOptions.push({'label':desc, 'value':key})
          newFilterByOptions[key] = desc
        }
      }
    }
    
    this.filterByOptions = newFilterByOptions
  }
  
  $doCheck() {
    if (this.resourceItems && this.resourceItems !== this.oldResourceItems) {
      this.oldResourceItems = this.resourceItems
    }
  }

  createBlankPriceBook() {
    this.setEditingManagerId({ newId: null })
    this.setEditingMode({ mode: this.createPriceBookMode })
  }

  cloneSelectedPriceBook(selectedManager) {
    this.setEditingManagerId({ newId: selectedManager.id })
    this.setEditingMode({ mode: this.createPriceBookMode })
  }

  createBlankRateReachManager() {
    this.setEditingManagerId({ newId: null })
    this.setEditingMode({ mode: this.createRateReachManagerMode })
  }

  cloneSelectedRateReachManager(selectedManager) {
    this.setEditingManagerId({ newId: selectedManager.id })
    this.setEditingMode({ mode: this.createRateReachManagerMode })
  }

  cloneSelectedManagerFromSource(selectedManager) {
    
    var managerId = this.resourceKeyToEndpointId[selectedManager.managerType]
    if (managerId === 'pricebook') {
      // Have to put this switch in here because the API for pricebook cloning is different. Can remove once API is unified.
      this.cloneSelectedPriceBook(selectedManager)
    } else if (managerId === 'rate-reach-matrix') {
      this.cloneSelectedRateReachManager(selectedManager)
    } else {
      // Create a resource manager
      this.getNewResourceDetailsFromUser()
      .then((resourceName) => {
        // Create a new manager with the specified name and description
        return this.$http.post(`/service/v1/${managerId}?source_manager=${selectedManager.id}`,
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
    return Promise.resolve()
  }

  editSelectedManager(selectedManager) {
    this.setEditingManagerId({ newId: selectedManager.id })
    this.setEditingMode({ mode: this.editMode })
    this.setCurrentSelectedResourceKey({ resourceKey: selectedManager.managerType })
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
    console.log(deleteUrl)
    this.$http.delete(deleteUrl)
    .then((result) => {
      this.onManagersChanged && this.onManagersChanged()
      //this.resourceItems[this.selectedResourceKey].selectedManager = this.resourceItems[this.selectedResourceKey].allManagers[0]
    })
    .catch((err) => console.error(err))
  }

  deleteSelectedResourceManager(selectedManager) {
    this.askUserToConfirmManagerDelete(selectedManager.name)
    .then((okToDelete) => {
      if (okToDelete) {
        const managerIdToDelete = selectedManager.id
        // this.selectedResourceKey selectedManager.managerType
        const deleteUrl = this.managerDeleteUrl[selectedManager.managerType].replace(this.managerIdString, managerIdToDelete)
        this.deleteManager(deleteUrl)
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