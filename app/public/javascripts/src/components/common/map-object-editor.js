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
      display: 'block',
      position: 'absolute',
      visible: true,
      top: '100px',
      left: '100px'
    }

    var mapCanvas = $document.find('#map-canvas-container')[0]
    mapCanvas.ondragover = () => false;
    mapCanvas.ondrop = (event) => {
      console.log(event);
      // Convert pixels to latlng
      var dropLatLng = this.pixelToLatlng(event.clientX, event.clientY)
      console.log(dropLatLng)
      var feature = {
        objectId: this.getUUID(),
        geometry: {
          type: 'Point',
          coordinates: [dropLatLng.lng(), dropLatLng.lat()]
        }
      }
      this.createMapObject(feature, true)
      event.preventDefault();
    };
  }

  // Convert from pixel coordinates to latlngs. https://stackoverflow.com/a/30541162
  pixelToLatlng(xcoor, ycoor) {
    var ne = this.mapRef.getBounds().getNorthEast();
    var sw = this.mapRef.getBounds().getSouthWest();
    var projection = this.mapRef.getProjection();
    var topRight = projection.fromLatLngToPoint(ne);
    var bottomLeft = projection.fromLatLngToPoint(sw);
    var scale = 1 << this.mapRef.getZoom();
    var newLatlng = projection.fromPointToLatLng(new google.maps.Point(xcoor / scale + bottomLeft.x, ycoor / scale + topRight.y));
    return newLatlng;
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
      this.contextMenuElement = this.$element.find('.map-object-editor-context-menu-container')[0]
      this.$element[0].removeChild(this.contextMenuElement)
      var documentBody = this.$document.find('body')[0]
      documentBody.appendChild(this.contextMenuElement)
    }, 0)

    // Use the cross hair cursor while this control is initialized
    this.mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      this.handleMapEntitySelected(event)
    })

    this.onInit && this.onInit()
    // We register a callback so that the parent object can request a map object to be deleted
    this.registerObjectDeleteCallback && this.registerObjectDeleteCallback({deleteObjectWithId: this.deleteObjectWithId.bind(this)})
    this.registerCreateMapObjectsCallback && this.registerCreateMapObjectsCallback({createMapObjects: this.createMapObjects.bind(this)})
    this.registerRemoveMapObjectsCallback && this.registerRemoveMapObjectsCallback({removeMapObjects: this.removeCreatedMapObjects.bind(this)})
  }

  createMapObjects(features) {
    // "features" is an array that comes directly from aro-service. Create map objects for these features
    features.forEach((feature) => {
      this.createMapObject(feature, false)  // Feature is not created usin a map click
    })
  }

  createPointMapObject(feature) {
    // Create a "point" map object - a marker
    return new google.maps.Marker({
      objectId: feature.objectId, // Not used by Google Maps
      position: new google.maps.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]),
      icon: {
        url: this.objectIconUrl
      },
      draggable: true,
      map: this.mapRef
    })
  }

  createPolygonMapObject(feature) {
    // Create a "polygon" map object
    var polygonPath = []
    feature.geometry.coordinates[0].forEach((polygonVertex) => {
      polygonPath.push({
        lat: polygonVertex[1],  // Note array index
        lng: polygonVertex[0]   // Note array index
      })
    })

    return new google.maps.Polygon({
      objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPath,
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
      clickable: true,
      draggable: false,
      map: this.mapRef
    })
  }

  createMapObject(feature, usingMapClick) {

    var mapObject = null
    if (feature.geometry.type === 'Point') {
      mapObject = this.createPointMapObject(feature)
      // Set up listeners on the map object
      mapObject.addListener('dragend', (event) => this.onModifyObject && this.onModifyObject({mapObject}))
      mapObject.addListener('click', (event) => {
        // Select this map object
        this.selectMapObject(mapObject)
      })
      mapObject.addListener('rightclick', (event) => {
        // Display the context menu and select the clicked marker
        this.contextMenuCss.display = 'block'
        this.contextMenuCss.left = `${event.va.clientX}px`
        this.contextMenuCss.top = `${event.va.clientY}px`

        // Show the dropdown menu
        var dropdownMenu = this.$document.find('.map-object-editor-context-menu-dropdown')
        const isDropdownHidden = dropdownMenu.is(':hidden')
        if (isDropdownHidden) {
          var toggleButton = this.$document.find('.map-object-editor-context-menu')
          toggleButton.dropdown('toggle')
        }
        this.selectMapObject(mapObject)
        this.$timeout()
      })
    } else if (feature.geometry.type === 'Polygon') {
      mapObject = this.createPolygonMapObject(feature)
      // Set up listeners on the map object
      mapObject.addListener('click', (event) => {
        var isEditable = mapObject.getEditable()
        mapObject.setEditable(!isEditable)
      })
      var self = this
      mapObject.getPaths().forEach(function(path, index){
        google.maps.event.addListener(path, 'insert_at', function(){
          self.onModifyObject && self.onModifyObject({mapObject})
        });
        google.maps.event.addListener(path, 'remove_at', function(){
          self.onModifyObject && self.onModifyObject({mapObject})
        });
        google.maps.event.addListener(path, 'set_at', function(){
          self.onModifyObject && self.onModifyObject({mapObject})
        });
      });
      google.maps.event.addListener(mapObject, 'dragend', function(){
        self.onModifyObject && self.onModifyObject({mapObject})
      });
    } else {
      throw `createMapObject() not supported for geometry type ${feature.geometry.type}`
    }

    this.createdMapObjects[mapObject.objectId] = mapObject
    this.onCreateObject && this.onCreateObject({mapObject: mapObject, usingMapClick: usingMapClick})
    this.selectMapObject(mapObject)
  }

  handleMapEntitySelected(event) {
    if (!event || !event.latLng) {
      return
    }
    var dropdownMenu = this.$document.find('.map-object-editor-context-menu-dropdown')
    const isDropdownHidden = dropdownMenu.is(':hidden')
    if (!isDropdownHidden) {
      // This means that the context menu is being displayed. Do not create an object.
      return
    }
    var feature = {
      geometry: {
        type: 'Point',
        coordinates: [event.latLng.lng(), event.latLng.lat()]
      }
    }
    var isExistingObject = false
    if (event.locations && event.locations.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = event.locations[0].object_id
      isExistingObject = true
    } else if (event.equipmentFeatures && event.equipmentFeatures.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = event.equipmentFeatures[0].object_id
      isExistingObject = true
    } else {
      // The map was clicked on, but there was no location under the cursor. Create a new one.
      feature.objectId = this.getUUID()
      isExistingObject = false
    }
    this.createMapObject(feature, true)
    if (isExistingObject) {
      // We have clicked on an existing object. Stop rendering this object in the tile,
      this.tileDataService.addFeatureToExclude(feature.objectId)
      this.state.requestMapLayerRefresh.next({})
    }
  }

  selectMapObject(mapObject) {
    if (mapObject && !mapObject.icon) {
      // This is a polygon. Don't select
      return
    }
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
    this.selectMapObject(null)
    Object.keys(this.createdMapObjects).forEach((objectId) => {
      this.createdMapObjects[objectId].setMap(null)
    })
    this.createdMapObjects = {}
  }

  deleteObjectWithId(objectId) {
    this.selectMapObject(null)
    var mapObjectToDelete = this.createdMapObjects[objectId]
    mapObjectToDelete.setMap(null)
    delete this.createdMapObjects[objectId]
    this.onDeleteObject && this.onDeleteObject({mapObject: mapObjectToDelete})
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
    registerCreateMapObjectsCallback: '&',  // To be called to register a callback, which will create map objects for existing objectIds
    registerRemoveMapObjectsCallback: '&'   // To be called to register a callback, which will remove all created map objects
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor