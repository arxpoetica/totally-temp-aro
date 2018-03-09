class TransactionStore {
  constructor($http) {
    this.$http = $http
    this.commandStack = []    // Stack of all commands executed
    this.uuidToFeatures = {}  // Map of feature UUID to feature object
    this.deletedFeatures = new Set()  // Set of all existing features that are deleted
    this.createdMarkers = {}  // All google maps markers created by this component
    this.uuidStore = []       // A list of UUIDs generated from the server
    this.getUUIDsFromServer()
  }

  // Get a list of UUIDs from the server
  getUUIDsFromServer() {
    const numUUIDsToFetch = 20
    this.$http.get(`/service/library/uuids/${numUUIDsToFetch}`)
    .then((result) => {
      this.uuidStore = this.uuidStore.concat(result.data)
    })
    .catch((err) => console.error(err))
  }

  // Get a UUID from the store
  getUUID() {
    if (this.uuidStore.length < 7) {
      // We are running low on UUIDs. Get some new ones from aro-service while returning one of the ones that we have
      this.getUUIDsFromServer()
    }
    return this.uuidStore.pop()
  }

  // Executes a command in the store
  executeCommand(command, params) {
    var result = command.execute(this, params)
    this.commandStack.push(command)
    return result
  }
}
class CommandAddLocation {
  execute(store, params) {

    // Create a new feature object
    var featureObj = {
      uuid: params.uuid ? params.uuid : store.getUUID(),  // Create a new UUID if this is a new object, else reuse it
      objectRevision: params.objectRevision,
      position: {
        lat: params.locationLatLng.lat(),
        lng: params.locationLatLng.lng()
      },
      numLocations: params.numLocations
    }
    store.uuidToFeatures[featureObj.uuid] = featureObj

    // Create a new google maps marker
    var newLocationMarker = new google.maps.Marker({
      position: params.locationLatLng,
      icon: '/images/map_icons/aro/households_default.png',
      draggable: true,
      map: params.map,
      uuid: featureObj.uuid
    })
    store.createdMarkers[featureObj.uuid] = newLocationMarker

    this.params = params
    return newLocationMarker
  }
}

class CommandMoveLocation {
  execute(store, params) {
    // Update the feature object in the store
    var featureObj = store.uuidToFeatures[params.marker.uuid]
    featureObj.position = {
      lat: params.newLocation.lat(),
      lng: params.newLocation.lng()
    }
    this.params = params
  }
}

class CommandEditLocation {
  execute(store, params) {
    // Update the feature object in the store
    var featureObj = store.uuidToFeatures[params.marker.uuid]
    featureObj.numLocations = params.numLocations
    this.params = params
  }
}

class CommandDeleteLocation {
  execute(store, params) {
    if (store.uuidToFeatures[params.uuid]) {
      // We have created this feature as part of our transaction (it is not an existing feature).
      // Simply remove it
      delete store.uuidToFeatures[params.uuid]
      store.createdMarkers[params.uuid].setMap(null)
      delete store.createdMarkers[params.uuid]
    } else {
      // This is an existing feature. Stop rendering this location in the tile.
      store.deletedFeatures.add(params.uuid)
    }
    this.params = params
  }
}

class LocationEditorController {

  constructor($http, $timeout, state, tileDataService) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.tileDataService = tileDataService
    this.addLocationData = {
      types: [
        'Household'
      ],
      selectedType: 'Household',
      numLocations: 1
    }

    this.currentTransaction = null

    this.isInErrorState = false
    this.store = new TransactionStore($http)
    this.selectedLocation = null
    this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.subscribe((event) => this.handleMapEntitySelected(event))
  }

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Location Editor component initialized, but a map object is not available at this time.')
      return
    }

    // We should have exactly one location data source selected. If not, return. The component will
    // show an error message and cannot be interacted with.
    if (this.state.dataItems.location && this.state.dataItems.location.selectedLibraryItems.length !== 1) {
      this.isInErrorState = true
      return
    }

    this.mapRef = window[this.mapGlobalObjectName]
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.CREATE

    // Handler for map click - this is when we create a new location
    var self = this
    this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function(event) {
      if (self.state.selectedTargetSelectionMode !== self.state.targetSelectionModes.CREATE) {
        return
      }
      self.createEditableMarker(event.latLng, null, null)
    });

    // See if we have an existing transaction for the currently selected location library
    var selectedLibraryItem = this.state.dataItems.location.selectedLibraryItems[0]
    this.$http.get(`/service/library/transaction?user_id=${this.state.getUserId()}`)
    .then((result) => {
      var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
      if (existingTransactions.length > 0) {
        // We have an existing transaction for this library item. Use it.
        return Promise.resolve({ data: existingTransactions[0]})
      } else {
        return this.$http.post('/service/library/transaction', {
          libraryId: selectedLibraryItem.identifier,
          userId: this.state.getUserId()
        })
      }
    })
    .then((result) => {
      this.currentTransaction = result.data
      this.$timeout()
    })
    .catch((err) => {
      console.error(err)
      this.isInErrorState = true
      this.$timeout()
    })
  }

  handleMapEntitySelected(event) {
    if (!(this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.SINGLE
          || this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.DELETE)
        || this.state.activeViewModePanel !== this.state.viewModePanels.EDIT_LOCATIONS) {
      return  // Currently only supporting editing of single entities
    }
    if (!event.latLng || !event.locations || event.locations.length === 0) {
      return  // Only supporting editing of a single location
    }

    // Note that UUID and object revision should come from aro-service.
    // Use UUID for featureId. If not found, use location_id
    var featureId = event.locations[0].object_id || event.locations[0].location_id

    if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.SINGLE) {
      this.createEditableMarker(event.latLng, featureId, 2)
    } else if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.DELETE) {
      var command = new CommandDeleteLocation()
      var params = {
        uuid: featureId
      }
      this.store.executeCommand(command, params)
    }

    // Stop rendering this location in the tile
    this.tileDataService.addFeatureToExclude(featureId)
    this.state.requestMapLayerRefresh.next({})
  }

  createEditableMarker(coordinateLatLng, uuid, objectRevision) {
    // Create a new marker for the location, only if we are in the right selection mode
    var command = new CommandAddLocation()
    var params = {
      uuid: uuid,
      objectRevision: objectRevision,
      locationLatLng: coordinateLatLng,
      numLocations: this.addLocationData.numLocations,
      map: this.mapRef
    }
    var newLocationMarker = this.store.executeCommand(command, params)
    this.selectMarker(newLocationMarker)
    this.$timeout() // Trigger change detection

    // Monitor events on the marker for dragstart and dragend
    newLocationMarker.addListener('dragstart', (event) => {
      this.handleDragStart(event)
    })
    newLocationMarker.addListener('dragend', (event) => {
      this.handleDragEnd(newLocationMarker, event)
    })
    newLocationMarker.addListener('mousedown', (event) => {
      if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.DELETE) {
        // We are in delete mode.
        var command = new CommandDeleteLocation()
        var params = {
          uuid: newLocationMarker.uuid,
        }
        this.store.executeCommand(command, params)
        this.$timeout()
      } else {
        // We are not in delete mode. Select the marker
        this.selectMarker(newLocationMarker)
      }
    })
  }

  selectMarker(marker) {
    if (this.selectedLocation) {
      this.selectedLocation.setIcon('/images/map_icons/aro/households_default.png')
    }
    this.selectedLocation = marker
    this.selectedLocation.setIcon('/images/map_icons/aro/households_selected.png')
    var featureObj = this.store.uuidToFeatures[marker.uuid]
    this.addLocationData.numLocations = featureObj.numLocations
    this.$timeout()
  }

  handleDragStart(event) {
    this.dragStartLatLng = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng())
  }

  handleDragEnd(marker, event) {
    var command = new CommandMoveLocation()
    var params = {
      marker: marker,
      oldLocation: this.dragStartLatLng,
      newLocation: new google.maps.LatLng(event.latLng.lat(), event.latLng.lng())
    }
    this.store.executeCommand(command, params)
    this.dragStartLatLng = null
    this.$timeout() // Trigger change detection
  }

  handleNumLocationsChanged() {
    if (this.selectedLocation) {
      var command = new CommandEditLocation()
      var params = {
        marker: this.selectedLocation,
        numLocations: this.addLocationData.numLocations
      }
      this.store.executeCommand(command, params)
    }
  }

  commitTransaction() {
    if (!this.currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }

    var featurePostPromises = []
    // Promises for created and modified locations
    Object.keys(this.store.uuidToFeatures).forEach((uuid) => {
      var rawFeature = this.store.uuidToFeatures[uuid]
      var formattedFeature = {
        objectId: uuid,
        geometry: {
          type: 'Point',
          coordinates: [rawFeature.position.lng, rawFeature.position.lat]
        },
        attributes: {
          number_of_households: rawFeature.numLocations
        }
      }
      featurePostPromises.push(this.$http.post(`/service/library/transaction/${this.currentTransaction.id}/features`, formattedFeature))
    })

    // Promises for deleted locations
    this.store.deletedFeatures.forEach((uuid) => {
      var rawFeature = this.store.uuidToFeatures[uuid]
      var formattedFeature = {
        objectId: uuid
      }
      featurePostPromises.push(this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}/features`), formattedFeature)
    })

    // First, push all features into the transaction
    Promise.all(featurePostPromises)
    .then((result) => {
      // Then commit the transaction
      return this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
    })
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

  $onDestroy() {
    // Remove all markers that we have created
    Object.keys(this.store.createdMarkers).forEach((key) => {
      var marker = this.store.createdMarkers[key]
      marker.setMap(null)
    })
    this.store.createdMarkers = null

    // Reset selection mode to single select mode
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.SINGLE

    // Remove listener
    google.maps.event.removeListener(this.clickListener)

    //unsubscribe map click observer
    this.mapFeaturesSelectedEventObserver.unsubscribe();
  }
}

LocationEditorController.$inject = ['$http', '$timeout', 'state', 'tileDataService']

app.component('locationEditor', {
  templateUrl: '/components/sidebar/view/location-editor-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: LocationEditorController
})