class EditableMapObject {

  constructor(map, feature, eventHandlers) {
    // Object description
    // feature = {
    //   objectId: 'xyz',  // Globally unique object ID
    //   geometry: {
    //     type: 'point',
    //     coordinates: google.maps.LatLng() // Basically whatever we can pass to maps creation
    //   },
    //   draggable: true, //or false
    //   icon: 'icon'  // For point geometries
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
    this.createMapObject(map)
  }

  createMapObject(map) {

    // Create the map object
    this.mapObject = null
    switch(this.feature.geometry.type) {
      case 'point':
        this.mapObject = new google.maps.Marker({
          position: this.feature.geometry.coordinates,
          icon: this.feature.icon,
          draggable: this.feature.draggable,
          map: map,
          objectId: this.feature.objectId
        })
      break;

      default:
        throw `createMapObject() does not support geometries with type ${this.feature.geometry.type}`
    }
    
    // Subscribe to map object events
    this.mapObject.addListener('dragstart', (event) => this.eventHandlers.onStartEditing && this.eventHandlers.onStartEditing(event))
    this.mapObject.addListener('dragend', (event) => this.eventHandlers.onEndEditing && this.eventHandlers.onEndEditing(event))
    this.mapObject.addListener('mousedown', (event) => this.eventHandlers.onMouseDown && this.eventHandlers.onMouseDown(event))

    // Raise the onCreate event
    this.eventHandlers.onCreate && this.eventHandlers.oncreate(this)
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
        geometry: {
          type: 'point',
          coordinates: event.latLng
        },
        draggable: true,
        icon: '/images/map_icons/aro/coverage_target.png'
      }
      var handlers = {

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