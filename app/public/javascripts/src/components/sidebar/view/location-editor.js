class LocationProperties {
  constructor(allowModification) {
    this.locationTypes = ['Household']
    this.selectedLocationType = this.locationTypes[0]
    this.numberOfLocations = 1
    this.allowModification = allowModification
    this.isDirty = false
  }
}

class LocationEditorController {
  constructor($timeout, $http, state) {
    this.$timeout = $timeout
    this.$http = $http
    this.state = state
    this.selectedMapObject = null
    this.objectIdToProperties = {}
    this.objectIdToMapObject = {}
    this.currentTransaction = null
    this.deleteObjectWithId = null // A function into the child map object editor, requesting the specified map object to be deleted
  }

  registerObjectDeleteCallback(deleteObjectWithIdCallback) {
    this.deleteObjectWithId = deleteObjectWithIdCallback
  }

  registerCreateMapObjectsCallback(createMapObjects) {
    this.createMapObjects = createMapObjects
  }

  registerRemoveMapObjectsCallback(removeMapObjects) {
    this.removeMapObjects = removeMapObjects
  }

  $onInit() {
    this.resumeOrCreateTransaction()
  }

  resumeOrCreateTransaction() {
    this.removeMapObjects && this.removeMapObjects()
    this.currentTransaction = null
    // See if we have an existing transaction for the currently selected location library
    var selectedLibraryItem = this.state.dataItems.location.selectedLibraryItems[0]
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
        this.currentTransaction = result.data
        return this.$http.get(`/service/library/transaction/${this.currentTransaction.id}/features`)
      })
      .then((result) => {
        // We have a list of features. Replace them in the objectIdToProperties map.
        this.objectIdToProperties = {}
        this.objectIdToMapObject = {}
        // Put the iconUrl in the features list
        result.data.forEach((item) => item.iconUrl = '/images/map_icons/aro/households_modified.png')
        // Important: Create the map objects first. The events raised by the map object editor will
        // populate the objectIdToMapObject object when the map objects are created
        this.createMapObjects && this.createMapObjects(result.data)
        // We now have objectIdToMapObject populated.
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

  getFeaturesCount() {
    return Object.keys(this.objectIdToProperties).length
  }

  commitTransaction() {
    if (!this.currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }

    // All modifications will already have been saved to the server. Commit the transaction.
    this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
      .then((result) => {
        // Transaction has been committed, start a new one
        this.state.recreateTilesAndCache()
        return this.resumeOrCreateTransaction()
      })
      .catch((err) => {
        this.currentTransaction = null
        this.state.recreateTilesAndCache()
        this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
        this.$timeout()
        console.error(err)
      })
  }

  getObjectIconUrl() {
    // Hardcoded for now
    return Promise.resolve('/images/map_icons/aro/households_modified.png')
  }

  getObjectSelectedIconUrl() {
    // Hardcoded for now
    return Promise.resolve('/images/map_icons/aro/households_selected.png')
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
            this.state.recreateTilesAndCache()
            return this.resumeOrCreateTransaction()
          })
          .catch((err) => {
            this.currentTransaction = null
            this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
            this.$timeout()
            console.error(err)
          })
      }
    })
  }

  // Marks the properties of the selected location as dirty (changed).
  markSelectedLocationPropertiesDirty() {
    if (this.selectedMapObject) {
      var objectProperties = this.objectIdToProperties[this.selectedMapObject.objectId]
      objectProperties.isDirty = true
    }
  }

  // Saves the properties of the selected location to aro-service
  saveSelectedLocationAndProperties() {
    if (this.selectedMapObject) {
      var selectedMapObject = this.selectedMapObject  // May change while the $http.post() is returning
      var locationObject = this.formatLocationForService(selectedMapObject.objectId)
      this.$http.put(`/service/library/transaction/${this.currentTransaction.id}/features`, locationObject)
        .then((result) => {
          this.objectIdToProperties[selectedMapObject.objectId].isDirty = false
          this.$timeout()
        })
        .catch((err) => console.error(err))
    }
  }

  // Formats a location (based on the objectId) so that it can be sent in calls to aro-service
  formatLocationForService(objectId) {
    var mapObject = this.objectIdToMapObject[objectId]
    var objectProperties = this.objectIdToProperties[objectId]
    var featureObj = {
      objectId: objectId,
      geometry: {
        type: 'Point',
        coordinates: [mapObject.position.lng(), mapObject.position.lat()] // Note - longitude, then latitude
      },
      attributes: {
        number_of_households: objectProperties.numberOfLocations
      },
      dataType: 'location'
    }
    return featureObj
  }

  handleObjectCreated(mapObject, usingMapClick, feature) {
    this.objectIdToProperties[mapObject.objectId] = new LocationProperties(feature.allowModification)
    this.objectIdToMapObject[mapObject.objectId] = mapObject
    var locationObject = this.formatLocationForService(mapObject.objectId)
    console.log(locationObject)
    this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`, locationObject)
    this.$timeout()
  }

  handleSelectedObjectChanged(mapObject) {
    this.selectedMapObject = mapObject
    this.$timeout()
  }

  handleObjectModified(mapObject) {
    var locationObject = this.formatLocationForService(mapObject.objectId)
    this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`, locationObject)
      .then((result) => {
        this.objectIdToProperties[mapObject.objectId].isDirty = false
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  handleObjectDeleted(mapObject) {
    this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}/features/${mapObject.objectId}`)
  }

  deleteSelectedObject() {
    // Ask the map to delete the selected object. If successful, we will get a callback where we can delete the object from aro-service.
    if (this.selectedMapObject) {
      this.deleteObjectWithId && this.deleteObjectWithId(this.selectedMapObject.objectId)
    }
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