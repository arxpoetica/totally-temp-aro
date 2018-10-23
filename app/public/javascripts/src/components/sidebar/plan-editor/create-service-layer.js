class CreateServiceLayerController {
  
  constructor($http,$timeout,state,Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils
    this.discardChanges = false
    this.currentTransaction = null
    this.serviceLayerName = null
    this.serviceLayerCode = null
  }

  createServiceLayerTemplate() {
    this.serviceLayerFeature = {
      dataType: 'service_layer',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[]]
      },
      attributes: {
        name: null,
        code: null
      }
    }
  }

  registerCreateMapObjectCallback(createMapObjects) {
    this.createServiceLayerTemplate()

    // createMapObjects.forEach((mapObject,index)  => {
    //   mapObject.overlay.getPaths().forEach((path) => {
    //     var pathPoints = []
    //     path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
    //     pathPoints.push(pathPoints[0])  // Close the polygon
    //     this.serviceLayerFeature.geometry.coordinates[0].push(pathPoints)
    //   })
    // })

    var mapObject = createMapObjects[0]
    mapObject.overlay.getPaths().forEach((path) => {
      var pathPoints = []
      path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
      pathPoints.push(pathPoints[0])  // Close the polygon
      this.serviceLayerFeature.geometry.coordinates[0].push(pathPoints)
    })
    //console.log(JSON.stringify(this.serviceLayerFeature))
  }

  resumeOrCreateTransaction() {
    this.currentTransaction = null
    // See if we have an existing transaction for the currently selected location library
    var selectedLibraryItem = this.state.dataItems.service_layer.selectedLibraryItems[0]
    this.$http.get(`/service/library/transaction?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
        if (existingTransactions.length > 0) {
          // We have an existing transaction for this library item. Use it.
          return Promise.resolve({ data: existingTransactions[0] })
        } else {
          // Create a new transaction and return it
          return this.$http.post('/service/library/transaction', {
            libraryId: selectedLibraryItem.identifier,
            userId: this.state.loggedInUser.id
          })
        }
      })
      .then((result) => {
        this.discardChanges = false
        this.currentTransaction = result.data
      })
      .catch((err) => {
        this.discardChanges = false
        this.state.selectedDisplayMode.next(this.state.displayModes.VIEW)
        this.$timeout()
        console.warn(err)
      })
  }

  commitTransaction() {
    if (!this.currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }
    if (this.serviceLayerFeature.geometry.coordinates[0].length <= 0) {
      console.error('Service Layer Not Drawn. We should never be in this state. Aborting commit...')
      return
    }

    this.serviceLayerFeature.attributes.name = this.serviceLayerName
    this.serviceLayerFeature.attributes.code = this.serviceLayerCode
    // send serviceLayer feature to service
    this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`,this.serviceLayerFeature)
    .then((result) => {
      // All modifications will already have been saved to the server. Commit the transaction.
      return this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
    })
    .then((result) => {
      // Transaction has been committed, start a new one
      this.discardChanges = true
      this.currentTransaction = null
      this.createServiceLayerTemplate()
      this.state.recreateTilesAndCache()
      return this.resumeOrCreateTransaction()
    })
    .catch((err) => {
      this.discardChanges = true
      this.currentTransaction = null
      this.createServiceLayerTemplate()
      this.state.recreateTilesAndCache()
      this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
      this.$timeout()
      console.error(err)
    })
  }

  discardTransaction() {
    swal({
      title: 'Delete transaction?',
      text: `Are you sure you want to delete transaction with ID ${this.currentTransaction.id} for library ${this.currentTransaction.libraryName}`,
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, discard',
      cancelButtonText: 'No',
      showCancelButton: true,
      closeOnConfirm: true
    }, (deleteTransaction) => {
      if (deleteTransaction) {
        // The user has confirmed that the transaction should be deleted
        this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}`)
          .then((result) => {
            // Transaction has been discarded, start a new one
            this.discardChanges = true
            this.currentTransaction = null
            this.createServiceLayerTemplate()
            this.state.recreateTilesAndCache()
            return this.resumeOrCreateTransaction()
          })
          .catch((err) => {
            this.discardChanges = true
            this.currentTransaction = null
            this.createServiceLayerTemplate()
            this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
            this.$timeout()
            console.error(err)
          })
      }
    })
  }

  $onInit() {
    this.createServiceLayerTemplate()
    this.resumeOrCreateTransaction()
  }

}
  
CreateServiceLayerController.$inject = ['$http','$timeout','state','Utils']

let createServiceLayer = {
  templateUrl: '/components/sidebar/plan-editor/create-service-layer.html',
  controller: CreateServiceLayerController
}

export default createServiceLayer