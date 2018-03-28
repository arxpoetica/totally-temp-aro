class MapObjectEditorController {

  constructor() {
    this.mapRef = null
    this.createdMapObjects = {}
    this.selectedMapObject = null
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
      console.error('ERROR: Map Object Editor component initialized, but a map object is not available at this time.')
      return
    }

    this.mapRef = window[this.mapGlobalObjectName]
    var self = this
    this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function(event) {
      self.createMapObject(event)
    })

    this.onInit && this.onInit()
  }

  createMapObject(event) {

    // Create a map object
    const mapObject = new google.maps.Marker({
      objectId: this.getUUID(), // Not used by Google Maps
      position: event.latLng,
      icon: this.objectSelectedIconUrl,
      draggable: true,
      map: this.mapRef
    })
    this.createdMapObjects[mapObject.objectId] = mapObject
    this.selectedMapObject = mapObject

    this.onCreateObject && this.onCreateObject(mapObject)
    this.onSelectObject && this.onSelectObject(mapObject)

    // Set up listeners on the map object
    mapObject.addListener('dragend', (event) => this.onModifyObject && this.onModifyObject(mapObject))
    mapObject.addListener('click', (event) => {
      if (this.deleteMode) {
        // Delete this map object
        mapObject.setMap(null)
        delete this.createdMapObjects[mapObject.objectId]
        this.onDeleteObject && this.onDeleteObject(mapObject)
      } else {
        // Select this map object
        this.onSelectObject && this.onSelectObject(mapObject)
      }
    })
  }

  selectMapObject(mapObject) {
    if (this.selectedMapObject) {
      // Reset the icon of the currently selected map object
      this.selectedMapObject.setIcon(this.objectIconUrl)
    }
    this.selectedMapObject.setIcon(this.objectSelectedIconUrl)
  }

  removeCreatedMapObjects() {
    // Remove created objects from map
    Object.keys(this.createdMapObjects).forEach((objectId) => {
      this.createdMapObjects[objectId].setMap(null)
    })
    this.createdMapObjects = {}
  }

  $onDestroy() {
    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()
  }

}

let mapObjectEditor = {
  template: '',
  bindings: {
    mapGlobalObjectName: '@',
    objectIconUrl: '@',
    objectSelectedIconUrl: '@',
    deleteMode: '<',
    onInit: '&',
    onCreateObject: '&',
    onSelectObject: '&',
    onModifyObject: '&',
    onDeleteObject: '&'
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor