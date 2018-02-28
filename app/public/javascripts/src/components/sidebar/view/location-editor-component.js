var CommandTypes = Object.freeze({
  ADD_LOCATION: 'ADD_LOCATION',
  MOVE_LOCATION: 'MOVE_LOCATION'
})

class CommandAddLocation {
  execute(params) {
    this.newLocationMarker = new google.maps.Marker({
      position: params.locationLatLng,
      icon: '/images/map_icons/aro/households_default.png',
      draggable: true,
      map: params.map,
      numLocations: params.numLocations,
      commandParams: params
    })
    this.params = params
    return this.newLocationMarker
  }
}

class CommandMoveLocation {
  execute(params) {
    this.params = params
  }
}

class CommandEditLocation {
  execute(params) {
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
      numberOfLocations: 5
    }
    this.commandStack = []
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
      var newLocationMarker = command.execute({
        locationLatLng: event.latLng,
        numLocations: self.addLocationData.numberOfLocations,
        map: self.mapRef
      })
      self.commandStack.push(command)
      self.$timeout() // Trigger change detection

      // Monitor events on the marker for dragstart and dragend
      newLocationMarker.addListener('dragstart', (event) => {
        self.handleDragStart(event)
      })
      newLocationMarker.addListener('dragend', (event) => {
        self.handleDragEnd(newLocationMarker, event)
      })
      newLocationMarker.addListener('mousedown', (event) => {
        if (self.selectedLocation) {
          self.selectedLocation.setIcon('/images/map_icons/aro/households_default.png')
        }
        self.selectedLocation = newLocationMarker
        self.selectedLocation.setIcon('/images/map_icons/aro/households_selected.png')
        self.addLocationData.numberOfLocations = newLocationMarker.commandParams.numLocations
        self.$timeout()
      })
    });
  }

  handleDragStart(event) {
    this.dragStartLatLng = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng())
  }

  handleDragEnd(marker, event) {
    var command = new CommandMoveLocation()
    command.execute({
      marker: marker,
      oldLocation: this.dragStartLatLng,
      newLocation: new google.maps.LatLng(event.latLng.lat(), event.latLng.lng())
    })
    this.dragStartLatLng = null
    this.commandStack.push(command)
    this.$timeout() // Trigger change detection
  }

  handleNumLocationsChanged() {
    if (this.selectedLocation) {
      this.selectedLocation.numLocations = this.addLocationData.numberOfLocations
      var command = new CommandEditLocation()
      command.execute({
        numLocations: this.addLocationData.numberOfLocations
      })
      this.commandStack.push(command)
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