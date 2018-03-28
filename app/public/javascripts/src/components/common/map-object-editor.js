class MapObjectEditorController {

  constructor($http, state, tileDataService) {
    this.$http = $http
    this.state = state
    this.tileDataService = tileDataService
    this.mapRef = null
    this.createdMapObjects = {}
    this.selectedMapObject = null
    this.uuidStore = []
    this.getUUIDsFromServer()
    this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.subscribe((event) => {
      this.handleMapEntitySelected(event)
    })
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

    this.onInit && this.onInit()
    // We register a callback so that the parent object can request a map object to be deleted
    this.registerObjectDeleteCallback && this.registerObjectDeleteCallback({deleteSelectedObject: this.deleteSelectedObject.bind(this)})
  }

  createMapObject(objectId, latLng) {

    // Create a map object
    const mapObject = new google.maps.Marker({
      objectId: objectId, // Not used by Google Maps
      position: latLng,
      icon: this.objectIconUrl,
      draggable: true,
      map: this.mapRef
    })
    this.createdMapObjects[mapObject.objectId] = mapObject
    this.onCreateObject && this.onCreateObject({mapObject})
    this.selectMapObject(mapObject)

    // Set up listeners on the map object
    mapObject.addListener('dragend', (event) => this.onModifyObject && this.onModifyObject({mapObject}))
    mapObject.addListener('click', (event) => {
      if (this.deleteMode) {
        // Delete this map object
        mapObject.setMap(null)
        delete this.createdMapObjects[mapObject.objectId]
        this.selectMapObject(null)
        this.onDeleteObject && this.onDeleteObject({mapObject})
      } else {
        // Select this map object
        this.selectMapObject(mapObject)
      }
    })
  }

  handleMapEntitySelected(event) {
    if (!event.locations || event.locations.length === 0) {
      // The map was clicked on, but there was no location under the cursor. Create a new one.
      this.createMapObject(this.getUUID(), event.latLng)
    } else {
      // The map was clicked on, and there was a location under the cursor
      const objectId = event.locations[0].object_id
      this.createMapObject(objectId, event.latLng)

      // Stop rendering this location in the tile
      this.tileDataService.addFeatureToExclude(objectId)
      this.state.requestMapLayerRefresh.next({})
    }
  }

  selectMapObject(mapObject) {
    if (this.selectedMapObject) {
      // Reset the icon of the currently selected map object
      this.selectedMapObject.setIcon(this.objectIconUrl)
    }
    this.selectedMapObject = mapObject
    if (this.selectedMapObject) {
      // Selected map object can be null if nothing is selected (e.g. when the user deletes a map object)
      this.selectedMapObject.setIcon(this.objectSelectedIconUrl)
    }
    this.onSelectObject && this.onSelectObject({mapObject})
  }

  removeCreatedMapObjects() {
    // Remove created objects from map
    Object.keys(this.createdMapObjects).forEach((objectId) => {
      this.createdMapObjects[objectId].setMap(null)
    })
    this.createdMapObjects = {}
  }

  deleteSelectedObject() {
    if (this.selectedMapObject) {
      var mapObjectToDelete = this.selectedMapObject
      this.selectMapObject(null)
      mapObjectToDelete.setMap(null)
      delete this.createdMapObjects[mapObjectToDelete.objectId]
    }
  }

  $onDestroy() {
    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()
    //unsubscribe map click observer
    this.mapFeaturesSelectedEventObserver.unsubscribe();
}

}

MapObjectEditorController.$inject = ['$http', 'state', 'tileDataService']

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
    onDeleteObject: '&',
    registerObjectDeleteCallback: '&' // To be called to register a callback, which will delete the selected object
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor