class LocationProperties {
  constructor() {
    this.locationTypes = ['Household']
    this.selectedLocationType = this.locationTypes[0]
    this.numberOfLocations = 1
  }
}

class LocationEditorController {
  constructor($timeout, $http, state) {
    this.$timeout = $timeout
    this.$http = $http
    this.state = state
    this.selectedMapObject = null
    this.objectIdToProperties = {}
    this.currentTransaction = null
  }

  $onInit() {

    // See if we have an existing transaction for the currently selected location library
    var selectedLibraryItem = this.state.dataItems.location.selectedLibraryItems[0]
    this.$http.get(`/service/library/transaction?user_id=${this.state.getUserId()}`)
      .then((result) => {
        var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
        if (existingTransactions.length > 0) {
          // We have an existing transaction for this library item. Use it.
          return Promise.resolve({ data: existingTransactions[0] })
        } else {
          // Create a new transaction and return it
          return this.$http.post('/service/library/transaction', {
            libraryId: selectedLibraryItem.identifier,
            userId: this.state.getUserId()
          })
        }
      })
      .then((result) => {
        this.currentTransaction = result.data
        return this.$http.get(`/service/library/transaction/${this.currentTransaction.id}/features`)
      })
      .then((result) => {
        // We have a list of features. Replace them in the objectIdToProperties map.
        this.objectIdToProperties = {}
        result.data.forEach((feature) => {
          var locationProperties = new LocationProperties()
          locationProperties.numberOfLocations = feature.attributes.number_of_households
          this.objectIdToProperties[feature.objectId] = locationProperties
        })
      })
      .catch((err) => {
        console.error(err)
        this.isInErrorState = true
        this.$timeout()
      })
  }

  commitTransaction() {
    if (!this.currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }

    // All modifications will already have been saved to the server. Commit the transaction.
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
      .then((result) => {
        // Committing will close the transaction. To keep modifying, open a new transaction
        this.currentTransaction = null
        this.state.recreateTilesAndCache()
        this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
        this.$timeout()
      })
      .catch((err) => {
        this.currentTransaction = null
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
            this.currentTransaction = null
            this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
            this.$timeout()
          })
          .catch((err) => {
            this.currentTransaction = null
            this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
            this.$timeout()
          })
      }
    })
  }

  handleObjectCreated(mapObject) {
    this.objectIdToProperties[mapObject.objectId] = new LocationProperties()
    this.$timeout()
  }

  handleSelectedObjectChanged(mapObject) {
    this.selectedMapObject = mapObject
    this.$timeout()
  }
}

LocationEditorController.$inject = ['$timeout', '$http', 'state']

let locationEditor = {
  templateUrl: '/components/sidebar/view/location-editor.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: LocationEditorController
}

export default locationEditor