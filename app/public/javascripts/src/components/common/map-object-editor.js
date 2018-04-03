class MapObjectEditorController {

  constructor($http, $element, $document, $timeout, state, tileDataService) {
    this.$http = $http
    this.$element = $element
    this.$document = $document
    this.$timeout = $timeout
    this.state = state
    this.tileDataService = tileDataService
    this.mapRef = null
    this.createdMapObjects = {}
    this.selectedMapObject = null
    this.uuidStore = []
    this.getUUIDsFromServer()
    // Save the context menu element so that we can remove it when the component is destroyed
    this.contextMenuElement = null
    this.contextMenuCss = {
      display: 'none',
      position: 'absolute',
      visible: true,
      top: '100px',
      left: '100px'
    }
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

    // Remove the context menu from the map-object editor and put it as a child of the <BODY> tag. This ensures
    // that the context menu appears on top of all the other elements. Wrap it in a $timeout(), otherwise the element
    // changes while the component is initializing, and we get a AngularJS error.
    this.$timeout(() => {
      this.contextMenuElement = this.$element.find(`.dropdown-menu`)[0]
      this.$element[0].removeChild(this.contextMenuElement)
      var documentBody = this.$document.find('body')[0]
      documentBody.appendChild(this.contextMenuElement)
    }, 0)

    // Add a click handler on the entire document so that we can hide the context menu if the user clicks outside the menu.
    this.$document.on('click', () => {
      this.contextMenuCss.display = 'none'
      this.$timeout()
    })
    this.mapRightClickListener = this.mapRef.addListener('rightclick', () => {
      this.contextMenuCss.display = 'none'
      this.$timeout()
    })

    // Use the cross hair cursor while this control is initialized
    this.mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      this.handleMapEntitySelected(event)
    })

    this.onInit && this.onInit()
    // We register a callback so that the parent object can request a map object to be deleted
    this.registerObjectDeleteCallback && this.registerObjectDeleteCallback({deleteSelectedObject: this.deleteSelectedObject.bind(this)})
    this.registerCreateMapObjectsCallback && this.registerCreateMapObjectsCallback({createMapObjects: this.createMapObjects.bind(this)})
  }

  createMapObjects(features) {
    // "features" is an array that comes directly from aro-service. Create map objects for these features
    features.forEach((feature) => {
      this.createMapObject(feature.objectId, new google.maps.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]))
    })
  }

  createMapObject(objectId, latLng) {

    // Create a map object
    const mapObject = new google.maps.Marker({
      objectId: objectId, // Not used by Google Maps
      position: latLng,
      icon: {
        url: this.objectIconUrl,
        anchor: new google.maps.Point(120, 120)
      },
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
    mapObject.addListener('rightclick', (event) => {
      // Display the context menu and select the clicked marker
      this.contextMenuCss.display = 'block'
      this.contextMenuCss.left = `${event.pixel.x}px`
      this.contextMenuCss.top = `${event.pixel.y}px`
      this.selectMapObject(mapObject)
      this.$timeout()
    })
  }

  handleMapEntitySelected(event) {
    if (!event || !event.latLng) {
      return
    }
    if (this.contextMenuCss.display === 'block') {
      // This means that the context menu is being displayed. Do not create an object.
      return
    }
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
      this.onDeleteObject && this.onDeleteObject({mapObject: mapObjectToDelete})
    }
    this.contextMenuCss.display = 'none'  // Hide the context menu
  }

  $onDestroy() {
    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()

    //unsubscribe map click observer
    this.mapFeaturesSelectedEventObserver.unsubscribe();

    // Go back to the default map cursor
    this.mapRef.setOptions({ draggableCursor: null })

    // Remove the context menu from the document body
    this.$timeout(() => {
      var documentBody = this.$document.find('body')[0]
      documentBody.removeChild(this.contextMenuElement)
    }, 0)

    // Remove the click handler we had added on the document.
    this.$document.off('click')
    if (this.mapRightClickListener) {
      this.mapRightClickListener.remove()
    }
  }
}

MapObjectEditorController.$inject = ['$http', '$element', '$document', '$timeout', 'state', 'tileDataService']

let mapObjectEditor = {
  templateUrl: '/components/common/map-object-editor.html',
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
    registerObjectDeleteCallback: '&', // To be called to register a callback, which will delete the selected object
    registerCreateMapObjectsCallback: '&'  // To be called to register a callback, which will create map objects for existing objectIds
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor