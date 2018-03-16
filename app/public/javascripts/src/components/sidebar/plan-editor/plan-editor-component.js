class EditableMapObject {

  constructor(map, feature, eventHandlers) {
    // Object description
    // feature = {
    //   objectId: 'xyz',  // Globally unique object ID
    //   geometries: [{
    //     key: 'asdf', // Sub-key for the geometry. Has to be unique within this object
    //     type: 'point',
    //     coordinates: google.maps.LatLng() // Basically whatever we can pass to maps creation
    //     draggable: true, //or false
    //     icon: 'icon'  // For point geometries
    //   } ..... ],
    // }

    // Event handlers - optional, specify only the ones you want to subscribe to
    // eventHandlers = {
    //   onCreate,
    //   onStartEditing,
    //   onEndEditing,
    //   onChangeGeometry,
    //   onChangeProperty,
    //   onMouseDown
    // }
    this.feature = feature
    this.eventHandlers = eventHandlers
    this.createMapObjects(map)
  }

  createMapObjects(map) {
    this.mapObjects = {}
    this.feature.geometries.forEach((geometry) => this.createMapObject(map, geometry))

    // Raise the onCreate event
    this.eventHandlers.onCreate && this.eventHandlers.oncreate(this)
  }

  createMapObject(map, geometry) {

    // Create the map object
    var mapObject = null
    switch(geometry.type) {
      case 'point':
        mapObject = new google.maps.Marker({
          position: geometry.coordinates,
          icon: geometry.icon,
          draggable: geometry.draggable,
          map: map,
          editableMapObject: this
        })
      break;

      default:
        throw `createMapObject() does not support geometries with type ${this.feature.geometry.type}`
    }
    
    // Subscribe to map object events
    mapObject.addListener('dragstart', (event) => this.eventHandlers.onStartEditing && this.eventHandlers.onStartEditing(event))
    mapObject.addListener('dragend', (event) => this.eventHandlers.onEndEditing && this.eventHandlers.onEndEditing(event))
    mapObject.addListener('mousedown', (event) => this.eventHandlers.onMouseDown && this.eventHandlers.onMouseDown(event))

    this.mapObjects[geometry.key] = mapObject
  }

  setIcon(newIcon) {
    this.mapObject.setIcon(newIcon)
  }
}

class PlanEditorController {
  
  constructor(state, $http) {
    this.state = state
    this.$http = $http
    this.editorModes = Object.freeze({
      ADD: 'ADD',
      DELETE: 'DELETE',
      MOVE: 'MOVE',
      EDIT_BOUNDARY: 'EDIT_BOUNDARY'
    })
    this.selectedEditorMode = this.editorModes.ADD
    this.uuidStore = []
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

  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Location Editor component initialized, but a map object is not available at this time.')
      return
    }

    this.mapRef = window[this.mapGlobalObjectName]
    var self = this
    this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function(event) {
      self.handleMapClick(event)
    })
  }

  handleMapClick(event) {
    if (this.selectedEditorMode === this.editorModes.ADD) {
      // We are in "Add entity" mode
      var feature = {
        objectId: this.getUUID(),
        geometries: [{
          key: 'coordinate',
          type: 'point',
          coordinates: event.latLng,
          draggable: true,
          icon: '/images/map_icons/aro/coverage_target.png'
        }],
      }
      var handlers = {
        onCreate: (editableMapObject) => {
          // Get the POST body for optimization based on the current application state
          var optimizationBody = this.state.getOptimizationBody()
          // Replace analysis_type and add a point and radius
          optimizationBody.analysis_type = 'COVERAGE'
          optimizationBody.point = {
            type: 'Point',
            coordinates: [this.targetMarker.position.lng(), this.targetMarker.position.lat()]
          }
          // Always send radius in meters to the back end
          optimizationBody.radius = this.coverageRadius * this.configuration.units.length_units_to_meters
          
        }
      }
      var mapObject = new EditableMapObject(this.mapRef, feature, handlers)
    }
  }

  // Sets the editor mode, and subscribes/unsubscribes from map events
  setEditorMode(newMode) {
    this.selectedEditorMode = newMode
  }

  $onDestroy() {

    // Remove listener
    google.maps.event.removeListener(this.clickListener)

  }
}

PlanEditorController.$inject = ['state', '$http']

app.component('planEditor', {
  templateUrl: '/components/sidebar/plan-editor/plan-editor-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: PlanEditorController
})