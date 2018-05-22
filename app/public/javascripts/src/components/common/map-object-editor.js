import Constants from './constants'
class MapObjectEditorController {

  constructor($http, $element, $compile, $document, $timeout, state, tileDataService) {
    this.$http = $http
    this.$element = $element
    this.$compile = $compile
    this.$document = $document
    this.$timeout = $timeout
    this.state = state
    this.tileDataService = tileDataService
    this.mapRef = null
    this.createObjectOnClick = true
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
    this.drawing = {
      drawingManager: null,
      markerIdForBoundary: null   // The objectId of the marker for which we are drawing the boundary
    }
    this.polygonOptions = {
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
    }
    this.selectedPolygonOptions = {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF1493',
      fillOpacity: 0.4,
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
      this.contextMenuElement = this.$element.find('.map-object-editor-context-menu-container')[0]
      this.$element[0].removeChild(this.contextMenuElement)
      var documentBody = this.$document.find('body')[0]
      documentBody.appendChild(this.contextMenuElement)

      this.dropTargetElement = this.$element.find('.map-object-drop-targets-container')[0]
      this.$element[0].removeChild(this.dropTargetElement)
      var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
      mapCanvas.appendChild(this.dropTargetElement)
    }, 0)

    // Use the cross hair cursor while this control is initialized
    this.mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      this.handleMapEntitySelected(event)
    })

    // Add handlers for drag-and-drop creation of elements
    var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
    this.objectIdToDropCSS = {}
    this.isHavingBoundaryDraggedOver = false
    // On drag over, only allow dropping if the object being dragged is a networkEquipment
    mapCanvas.ondragover = (event) => {
      // Note that we do not have access the the event.dataTransfer data, only the types. This is by design.
      var hasEntityType = (event.dataTransfer.types.indexOf(Constants.DRAG_DROP_ENTITY_KEY) >= 0)
      var hasBoundaryType = (event.dataTransfer.types.indexOf(Constants.DRAG_IS_BOUNDARY) >= 0)
      this.isHavingBoundaryDraggedOver = hasBoundaryType
      this.$timeout()
      return !(hasEntityType || hasBoundaryType);  // false == allow dropping
    }
    this.dragStartEventObserver = this.state.dragEndEvent.skip(1).subscribe((event) => {
      this.objectIdToDropCSS = {} // So that we will regenerate the CSS in case the map has zoomed/panned
      this.$timeout()
    })
    this.dragEndEventObserver = this.state.dragEndEvent.skip(1).subscribe((event) => {
      this.isHavingBoundaryDraggedOver = false
      this.$timeout()
    })
    mapCanvas.ondrop = (event) => {
      this.isHavingBoundaryDraggedOver = false
      this.$timeout()
      var hasBoundaryType = (event.dataTransfer.types.indexOf(Constants.DRAG_IS_BOUNDARY) >= 0)
      if (hasBoundaryType) {
        // This will be handled by our custom drop targets. Do not use the map canvas' ondrop to handle it.
        return
      }      
      // Convert pixels to latlng
      var dropLatLng = this.pixelToLatlng(event.clientX, event.clientY)
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

    this.onInit && this.onInit()
    // We register a callback so that the parent object can request a map object to be deleted
    this.registerObjectDeleteCallback && this.registerObjectDeleteCallback({deleteObjectWithId: this.deleteObjectWithId.bind(this)})
    this.registerCreateMapObjectsCallback && this.registerCreateMapObjectsCallback({createMapObjects: this.createMapObjects.bind(this)})
    this.registerRemoveMapObjectsCallback && this.registerRemoveMapObjectsCallback({removeMapObjects: this.removeCreatedMapObjects.bind(this)})
  }

  handleOnDropped(eventArgs) {
    this.onObjectDroppedOnMarker && this.onObjectDroppedOnMarker(eventArgs)
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

  // Convert from latlng to pixel coordinates. https://stackoverflow.com/a/2692617
  latLngToPixel(latLng) {
    var scale = Math.pow(2, this.mapRef.getZoom())
    var nw = new google.maps.LatLng(
      this.mapRef.getBounds().getNorthEast().lat(),
      this.mapRef.getBounds().getSouthWest().lng()
    )
    var worldCoordinateNW = this.mapRef.getProjection().fromLatLngToPoint(nw)
    var worldCoordinate = this.mapRef.getProjection().fromLatLngToPoint(latLng)
    return {
      x: Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
      y: Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
    }
  }

  // Gets the CSS for a drop target based on a map object. Can return null if not a valid drop target.
  getDropTargetCSSForMapObject(mapObject) {
    if (!this.isMarker(mapObject)) {
      return null
    }
    // Without the 'this.objectIdToDropCSS' cache we get into an infinite digest cycle
    var dropTargetCSS = this.objectIdToDropCSS[mapObject.objectId]
    if (dropTargetCSS) {
      return dropTargetCSS
    }
    const radius = 50;  // Pixels
    var pixelCoords = this.latLngToPixel(mapObject.getPosition())
    dropTargetCSS = {
      position: 'absolute',
      left: `${pixelCoords.x - radius}px`,
      top: `${pixelCoords.y - radius}px`,
      border: 'solid 3px black',
      'border-style': 'dashed',
      'border-radius': `${radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      'background-color': 'rgba(255, 255, 255, 0.5'
    }
    this.objectIdToDropCSS[mapObject.objectId] = dropTargetCSS
    return dropTargetCSS;
  }

  createMapObjects(features) {
    // "features" is an array that comes directly from aro-service. Create map objects for these features
    features.forEach((feature) => {
      this.createMapObject(feature, false)  // Feature is not created usin a map click
    })
  }

  createPointMapObject(feature) {
    // Create a "point" map object - a marker
    console.log(feature.objectId)
    this.tileDataService.addFeatureToExclude(feature.objectId)
    this.state.requestMapLayerRefresh.next({})
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

    var polygon = new google.maps.Polygon({
      objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPath,
      clickable: true,
      draggable: false,
      map: this.mapRef
    })
    polygon.setOptions(this.polygonOptions)
    return polygon
  }

  createMapObject(feature, usingMapClick, featureData) {
    console.log('createMapObject')
    console.log(featureData)
    if ('undefined' == typeof featureData) featureData = {}
    
    var mapObject = null
    if (feature.geometry.type === 'Point') {
      mapObject = this.createPointMapObject(feature)
      // Set up listeners on the map object
      mapObject.addListener('dragend', (event) => this.onModifyObject && this.onModifyObject({mapObject}))
      mapObject.addListener('click', (event) => {
        // Select this map object
        this.selectMapObject(mapObject)
      })
    } else if (feature.geometry.type === 'Polygon') {
      mapObject = this.createPolygonMapObject(feature)
      // Set up listeners on the map object
      mapObject.addListener('click', (event) => {
        // Select this map object
        this.selectMapObject(mapObject)
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

    mapObject.addListener('rightclick', (event) => {
      //console.log(event)
      // Display the context menu and select the clicked marker
      this.contextMenuCss.display = 'block'
      this.contextMenuCss.left = `${event.xa.clientX}px`
      this.contextMenuCss.top = `${event.xa.clientY}px`

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
    
    /*
    // is this an existing equipment? 
    var plan = this.state.plan.getValue()
    this.$http.get('/service/plan-feature/'+plan.id+'/equipment/'+mapObject.objectId)
    .then((response) => {
      console.log( response.data )
      this.createdMapObjects[mapObject.objectId] = mapObject
      this.onCreateObject && this.onCreateObject({mapObject: mapObject, usingMapClick: usingMapClick, feature: feature, featureData: response.data})
      // can't run this until 
      this.selectMapObject(mapObject)
    })
    */
    this.createdMapObjects[mapObject.objectId] = mapObject
    this.onCreateObject && this.onCreateObject({mapObject: mapObject, usingMapClick: usingMapClick, feature: feature, featureData: featureData})
    //this.onCreateObject && this.onCreateObject({mapObject: mapObject, usingMapClick: usingMapClick, feature: feature, featureData: {} })
    
    this.selectMapObject(mapObject)
  }

  handleMapEntitySelected(event) {
    console.log('MapEntitySelected')
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
    var isEquipment = false
    if (event.locations && event.locations.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = event.locations[0].object_id
      isExistingObject = true
    } else if (event.equipmentFeatures && event.equipmentFeatures.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = event.equipmentFeatures[0].object_id
      isExistingObject = true
      isEquipment = true
    } else {
      // The map was clicked on, but there was no location under the cursor.
      // If there is a selected polygon, set it to non-editable
      if (this.selectedMapObject && !this.isMarker(this.selectedMapObject)) {
        this.selectedMapObject.setEditable(false)
      }
      this.selectMapObject(null)
      if (!this.createObjectOnClick) {
        return    // We do not want to create the map object on click
      }
      feature.objectId = this.getUUID()
      isExistingObject = false
    }
    
    
    if (isExistingObject && isEquipment) {
      // editing existing or planned equipment, get that data
      var plan = this.state.plan.getValue()
      this.$http.get('/service/plan-feature/'+plan.id+'/equipment/'+feature.objectId)
      .then((response) => {
        console.log('service return')
        console.log( response.data )
        this.createMapObject(feature, true, response.data)
      })
    }else{
      this.createMapObject(feature, true)
    }
    
  }

  isMarker(mapObject) {
    return mapObject && mapObject.icon
  }

  selectMapObject(mapObject) {
    console.log('selected mapObject')
    console.log(mapObject)
    // First de-select the currently selected map object (if any)
    if (this.selectedMapObject) {
      if (this.isMarker(this.selectedMapObject)) {
        this.selectedMapObject.setIcon(this.objectIconUrl)
      } else {
        this.selectedMapObject.setOptions(this.polygonOptions)
        this.selectedMapObject.setEditable(false)
      }
    }

    // Then select the map object
    if (mapObject) {  // Can be null if we are de-selecting everything
      if (this.isMarker(mapObject)) {
        //console.log('item selected')
        mapObject.setIcon(this.objectSelectedIconUrl)
      } else {
        mapObject.setOptions(this.selectedPolygonOptions)
      }
    }
    this.selectedMapObject = mapObject
    this.onSelectObject && this.onSelectObject({mapObject})
  }

  toggleEditSelectedPolygon() {
    if (!this.selectedMapObject || this.isMarker(this.selectedMapObject)) {
      return
    }
    var isEditable = this.selectedMapObject.getEditable();
    this.selectedMapObject.setEditable(!isEditable);
  }

  removeCreatedMapObjects() {
    // Remove created objects from map
    this.selectMapObject(null)
    Object.keys(this.createdMapObjects).forEach((objectId) => {
      this.createdMapObjects[objectId].setMap(null)
    })
    this.createdMapObjects = {}
  }

  deleteSelectedObject() {
    if (this.selectedMapObject) {
      this.deleteObjectWithId(this.selectedMapObject.objectId)
    }
  }

  deleteObjectWithId(objectId) {
    if (this.selectedMapObject && (this.selectedMapObject.objectId === objectId)) {
      // Deselect the currently selected object, as it is about to be deleted.
      this.selectMapObject(null)
    }
    var mapObjectToDelete = this.createdMapObjects[objectId]
    mapObjectToDelete.setMap(null)
    delete this.createdMapObjects[objectId]
    this.onDeleteObject && this.onDeleteObject({mapObject: mapObjectToDelete})
    this.contextMenuCss.display = 'none'  // Hide the context menu
  }

  startDrawingBoundaryFor(mapObject) {
    if (!this.isMarker(mapObject)) {
      console.warn('startDrawingBoundarFor() called on a non-marker object.')
      return
    }

    if (this.drawing.drawingManager) {
      // If we already have a drawing manager, discard it.
      console.warn('We already have a drawing manager active')
      this.drawing.drawingManager.setMap(null)
      this.drawing.drawingManager = null
    }
    this.drawing.markerIdForBoundary = mapObject.objectId // This is the object ID for which we are drawing the boundary
    this.drawing.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions:this.selectedPolygonOptions
    });
    this.drawing.drawingManager.setMap(this.mapRef);
    var self = this;
    google.maps.event.addListener(this.drawing.drawingManager, 'overlaycomplete', function(event) {
      // Create a boundary object using the regular object-creation workflow. A little awkward as we are converting
      // the polygon object coordinates to aro-service format, and then back to google.maps.Polygon() paths later.
      // We keep it this way because the object creation workflow does other things like set up events, etc.
      var feature = {
        objectId: self.getUUID(),
        geometry: {
          type: 'Polygon',
          coordinates: []
        },
        attributes: {
          network_node_object_id: self.drawing.markerIdForBoundary
        }
      }
      event.overlay.getPaths().forEach((path) => {
        var pathPoints = []
        path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
        pathPoints.push(pathPoints[0])  // Close the polygon
        feature.geometry.coordinates.push(pathPoints)
      })
      self.createMapObject(feature, true)
      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
      // Kill the drawing manager
      self.drawing.drawingManager.setMap(null)
      self.drawing.drawingManager = null
      self.drawing.markerIdForBoundary = null
    });
  }

  $onChanges(changesObj) {
    if (changesObj && changesObj.hideObjectIds && (this.hideObjectIds) instanceof Set) {
      // First set all objects as visible
      Object.keys(this.createdMapObjects).forEach((objectId) => this.createdMapObjects[objectId].setVisible(true))
      // Then hide the ones that we want
      Object.keys(this.createdMapObjects).forEach((objectId) => {
        if (this.hideObjectIds.has(objectId)) {
          this.createdMapObjects[objectId].setVisible(false)
          if (this.createdMapObjects[objectId] === this.selectedMapObject) {
            this.selectMapObject(null)
          }
        }
      })
    }
  }

  $onDestroy() {
    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()

    //unsubscribe map click observer
    this.mapFeaturesSelectedEventObserver.unsubscribe();
    this.dragEndEventObserver.unsubscribe();
    this.dragStartEventObserver.unsubscribe();

    // Go back to the default map cursor
    this.mapRef.setOptions({ draggableCursor: null })

    // Remove the context menu from the document body
    this.$timeout(() => {
      var documentBody = this.$document.find('body')[0]
      documentBody.removeChild(this.contextMenuElement)
      var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
      mapCanvas.removeChild(this.dropTargetElement)
    }, 0)

    // Remove any dragging DOM event listeners
    var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
    mapCanvas.ondragover = null
    mapCanvas.ondrop = null
  }
}

MapObjectEditorController.$inject = ['$http', '$element', '$compile', '$document', '$timeout', 'state', 'tileDataService']

let mapObjectEditor = {
  templateUrl: '/components/common/map-object-editor.html',
  bindings: {
    mapGlobalObjectName: '@',
    mapContainerId: '@',  // The HTML element that contains the map
    objectIconUrl: '@',
    objectSelectedIconUrl: '@',
    deleteMode: '<',
    createObjectOnClick: '<',
    allowBoundaryCreation: '<',
    hideObjectIds: '<',    // A set of IDs that we will suppress visibility for
    onInit: '&',
    onCreateObject: '&',
    onSelectObject: '&',
    onModifyObject: '&',
    onDeleteObject: '&',
    onObjectDroppedOnMarker: '&',
    registerObjectDeleteCallback: '&', // To be called to register a callback, which will delete the selected object
    registerCreateMapObjectsCallback: '&',  // To be called to register a callback, which will create map objects for existing objectIds
    registerRemoveMapObjectsCallback: '&'   // To be called to register a callback, which will remove all created map objects
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor