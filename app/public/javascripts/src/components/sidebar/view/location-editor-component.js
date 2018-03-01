class TransactionStore {
  constructor() {
    this.commandStack = []    // Stack of all commands executed
    this.uuidToFeatures = {}  // Map of feature UUID to feature object
  }

  // Get a UUID. Generating random ones for now. Eventually we need to get these from aro-service
  getUUID() {
    // Note that this just returns RANDOM UUIDs, NOT RFC4122 COMPLIANT
    var s4 = () => {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  // Executes a command in the store
  executeCommand(command, params) {
    var result = command.execute(this, params)
    this.commandStack.push(command)
    console.log(JSON.stringify(this.uuidToFeatures))
    return result
  }

}
class CommandAddLocation {
  execute(store, params) {

    // Create a new feature object
    var featureObj = {
      uuid: store.getUUID(),
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

class LocationEditorController {

  constructor($document, $timeout, state) {
    this.$timeout = $timeout
    this.state = state
    this.addLocationData = {
      types: [
        'Business',
        'Household',
        'Cell tower'
      ],
      selectedType: 'Household',
      numLocations: 5
    }

    this.store = new TransactionStore()
    this.selectedLocation = null
  }

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Location Editor component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.CREATE

    // Handler for map click - this is when we create a new location
    var self = this
    google.maps.event.addListener(this.mapRef, 'click', function(event) {
      if (self.state.selectedTargetSelectionMode !== self.state.targetSelectionModes.CREATE) {
        return
      }
      // Create a new marker for the location, only if we are in the right selection mode
      var command = new CommandAddLocation()
      var params = {
        locationLatLng: event.latLng,
        numLocations: self.addLocationData.numLocations,
        map: self.mapRef
      }
      var newLocationMarker = self.store.executeCommand(command, params)
      self.selectMarker(newLocationMarker)
      self.$timeout() // Trigger change detection

      // Monitor events on the marker for dragstart and dragend
      newLocationMarker.addListener('dragstart', (event) => {
        self.handleDragStart(event)
      })
      newLocationMarker.addListener('dragend', (event) => {
        self.handleDragEnd(newLocationMarker, event)
      })
      newLocationMarker.addListener('mousedown', (event) => {
        self.selectMarker(newLocationMarker)
      })
    });
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

  $onDestroy() {
    // Unsubscribe all map listeners
    google.maps.event.removeListener(this.clickListener)

    // Reset selection mode to single select mode
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.SINGLE
  }
}

LocationEditorController.$inject = ['$document', '$timeout', 'state']

app.component('locationEditor', {
  templateUrl: '/components/sidebar/view/location-editor-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: LocationEditorController
})