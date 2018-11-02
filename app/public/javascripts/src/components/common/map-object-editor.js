import Constants from './constants'
import WorkflowState from './workflow-state'
import MapUtilities from './plan/map-utilities'
import FeatureSelector from '../tiles/feature-selector'

class MapObjectEditorController {

  constructor($http, $element, $compile, $document, $timeout, state, tileDataService, contextMenuService, Utils) {
    this.$http = $http
    this.$element = $element
    this.$compile = $compile
    this.$document = $document
    this.$timeout = $timeout
    this.state = state
    this.tileDataService = tileDataService
    this.contextMenuService = contextMenuService
    this.utils = Utils
    this.mapRef = null
    this.overlayRightClickListener = null
    this.createObjectOnClick = true
    this.createdMapObjects = {}
    this.selectedMapObject = null
    this.iconAnchors = {}
    
    
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
  
  $onInit() {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Map Object Editor component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    if (!this.featureType) {
      console.warn('map-object-editor: featureType must be defined (currently either "location" or "equipment"')
    }
    
    // Use the cross hair cursor while this control is initialized
    this.mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      if(this.state.isRulerEnabled) return //disable any click action when ruler is enabled
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
      //console.log('drag ... start?')
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
      var grabOffsetX = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_OFFSET_X)
      var grabOffsetY = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_OFFSET_Y)
      var grabImageW = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_ICON_W)
      var grabImageH = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_ICON_H)
      var offsetX = (grabImageW * 0.5) - grabOffsetX // center
      var offsetY = grabImageH - grabOffsetY // bottom
      
      var dropLatLng = this.pixelToLatlng(event.clientX + offsetX, event.clientY + offsetY)

      if(event.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY) !== Constants.MAP_OBJECT_CREATE_SERVICE_AREA) {
        // ToDo feature should probably be a class
        var feature = {
          objectId: this.utils.getUUID(),
          geometry: {
            type: 'Point',
            coordinates: [dropLatLng.lng(), dropLatLng.lat()]
          }, 
          networkNodeType: event.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY)
        }
        
        this.getObjectIconUrl({ objectKey: Constants.MAP_OBJECT_CREATE_KEY_NETWORK_NODE_TYPE, objectValue: feature.networkNodeType })
        .then((iconUrl) => this.createMapObject(feature, iconUrl, true))
        .catch((err) => console.error(err))
      } else {
        var position = new google.maps.LatLng(dropLatLng.lat(), dropLatLng.lng());
        var radius = 1000; //radius in meters
        var path = this.generateHexagonPath(position,radius)
        var feature = {
          objectId: this.utils.getUUID(),
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[path]]
          },
          isExistingObject: false
        }
       this.createMapObject(feature, null, true)
      }

      event.preventDefault();
    };
    
    
    this.overlayRightClickListener = this.mapRef.addListener('rightclick', (event) => {
      // ToDo: this should be in plan-editor 
      if ('equipment' == this.featureType || 'serviceArea' == this.featureType){// we're editing a equipment and eqipment bounds NOT locations
        var eventXY = this.getXYFromEvent(event)
        this.updateContextMenu(event.latLng, eventXY.x, eventXY.y, null)
      }
    })
    
    
    this.onInit && this.onInit()
    // We register a callback so that the parent object can request a map object to be deleted
    this.registerObjectDeleteCallback && this.registerObjectDeleteCallback({deleteObjectWithId: this.deleteObjectWithId.bind(this)})
    this.registerCreateMapObjectsCallback && this.registerCreateMapObjectsCallback({createMapObjects: this.createMapObjects.bind(this)})
    this.registerRemoveMapObjectsCallback && this.registerRemoveMapObjectsCallback({removeMapObjects: this.removeCreatedMapObjects.bind(this)})
    this.registerCreateEditableExistingMapObject && this.registerCreateEditableExistingMapObject({createEditableExistingMapObject: this.createEditableExistingMapObject.bind(this)})

    
    this.state.clearEditingMode.skip(1).subscribe((clear) => {
      if (clear) {
        this.selectMapObject(null) //deselects the selected equipment 
      }
    })
    
  }
  
  
  // ----- rightclick menu ----- //

  getXYFromEvent(event){
    var mouseEvent = null
    Object.keys(event).forEach((eventKey) => {
      if (event.hasOwnProperty(eventKey) && (event[eventKey] instanceof MouseEvent)) {
        mouseEvent = event[eventKey]
      }
    })
    var x = mouseEvent.clientX
    var y = mouseEvent.clientY
    return {'x':x, 'y':y}
  }
  
  closeContextMenu(){
    this.contextMenuService.menuOff()
    this.$timeout()
  }
  
  openContextMenu(x, y, menuItems){
    this.contextMenuService.populateMenu(menuItems)
    this.contextMenuService.moveMenu(x, y)
    this.contextMenuService.menuOn()
    
    this.$timeout()
  }
  
  editExistingFeature(feature, latLng){
    var hitFeatures = {}
    hitFeatures['latLng'] = latLng
    if ('location' == this.featureType) hitFeatures['locations'] = [feature]
    if ('equipment' == this.featureType) hitFeatures['equipmentFeatures'] = [feature]
    if ('serviceArea' == this.featureType)  hitFeatures['serviceAreas'] = [feature]
    this.state.mapFeaturesSelectedEvent.next(hitFeatures)
  }
  
  selectProposedFeature(objectId){
    this.selectMapObject(this.createdMapObjects[objectId])
  }
  
  startDrawingBoundaryForId(objectId){
    this.startDrawingBoundaryFor(this.createdMapObjects[objectId])
  }
  /*
  editBoundary(objectId){
    this.selectMapObject(this.createdMapObjects[objectId])
    //this.selectedMapObject.setEditable(true);
  }
  */
  
  getDataTypeList(feature){
    var dataTypeList = ['']
    if (feature.hasOwnProperty('_data_type')) dataTypeList = feature._data_type.split('.')
    if (feature.hasOwnProperty('dataType')) dataTypeList = feature.dataType.split('.')
    return dataTypeList
  }
  
  filterFeatureForSelection(feature){
    // has it been deleted?
    if (feature.is_deleted && "false" != feature.is_deleted) return false
    // is the boundary type visible? (caf2 etc.)
    if (feature.hasOwnProperty('boundary_type') && feature.boundary_type != this.state.selectedBoundaryType.id) return false
    if (feature.hasOwnProperty('boundaryTypeId') && feature.boundaryTypeId != this.state.selectedBoundaryType.id) return false
    var objectId = '' 
    if (feature.hasOwnProperty('object_id')){
      objectId = feature.object_id
    }else if (feature.hasOwnProperty('objectId')){
      objectId = feature.objectId
    }
    
    if ('' != objectId && !this.createdMapObjects.hasOwnProperty(objectId)){
      // we have an objectId and the feature is NOT on the edit layer
      // check that the equipment layer is on for that feature
      var dataTypeList = this.getDataTypeList(feature)
      var validFeature = true
      if ('equipment' == dataTypeList[0]){
        validFeature = (dataTypeList.length > 0 && this.state.isFeatureLayerOn(dataTypeList[1]))
      }else{
        validFeature = this.state.isFeatureLayerOnForBoundary(feature)
        if (validFeature && this.tileDataService.modifiedBoundaries.hasOwnProperty(objectId) 
            && this.tileDataService.modifiedBoundaries[objectId].deleted){
          // a bounds that is on and has been modified
          // check to see if it's lying about being deleted
          validFeature = false
        }
      }
      if (!validFeature) return false
    }
    
    return true
  }
  
  updateContextMenu(latLng, x, y, clickedMapObject) {
    if ('equipment' == this.featureType){ // ToDo: need a better way to do this, should be in plan-editor 
      
      this.getFeaturesAtPoint(latLng)
      .then((results) => {
        // We may have come here when the user clicked an existing map object. For now, just add it to the list.
        // This should be replaced by something that loops over all created map objects and picks those that are under the cursor.
        if (clickedMapObject) {
          var clickedFeature = {
            _data_type: this.isMarker(clickedMapObject) ? 'equipment' : 'equipment_boundary',
            object_id: clickedMapObject.objectId,
            is_deleted: false
          }
          results.push(clickedFeature)
        }

        var menuItems = []
        var menuItemsById = {}
        
        results.forEach((result) => {
          //populate context menu aray here
          // we may need different behavour for different controllers using this
          var options = []
          var dataTypeList = this.getDataTypeList(result)
          if (result.hasOwnProperty('object_id')) result.objectId = result.object_id
          var validFeature = false
          
          // have we already added this one?
          if (('equipment' == dataTypeList[0] || 'equipment_boundary' == dataTypeList[0]) 
              && !menuItemsById.hasOwnProperty( result.objectId) ){
            validFeature = this.filterFeatureForSelection(result)
          }
          
          if (validFeature){  
            var feature = result
            if (this.createdMapObjects.hasOwnProperty(result.objectId) ){
              // it's on the edit layer / in the transaction
              feature = this.createdMapObjects[result.objectId].feature
              options.push( this.contextMenuService.makeItemOption('Select', 'fa-pencil', () => {this.selectProposedFeature(result.objectId)} ) )
              if ('equipment' == dataTypeList[0]){
                if (this.isBoundaryCreationAllowed({'mapObject':result})){
                  options.push( this.contextMenuService.makeItemOption('Add Boundary', 'fa-plus', () => {this.startDrawingBoundaryForId(result.objectId)}) )
                }
              }else if('equipment_boundary' == dataTypeList[0]){
                //options.push( this.contextMenuService.makeItemOption('Edit Boundary', 'fa-pencil', () => {this.editBoundary(result.objectId)}) )
              }
              options.push( this.contextMenuService.makeItemOption('Delete', 'fa-trash', () => {this.deleteObjectWithId(result.objectId)}) )
            }else{
              options.push( this.contextMenuService.makeItemOption('Edit Existing', 'fa-pencil', () => {this.editExistingFeature(result, latLng)}) )
            }
            
            var name = ''
            if ('equipment_boundary' == dataTypeList[0]){
              name = 'Boundary'
            }else if(feature.hasOwnProperty('networkNodeType')){
              name = feature.networkNodeType
            }else{
              name = dataTypeList[1]
            }
            
            if (this.state.configuration.networkEquipment.equipments.hasOwnProperty(name)){
              name = this.state.configuration.networkEquipment.equipments[name].label
            }else if(this.state.networkNodeTypesEntity.hasOwnProperty(name)){
              name = this.state.networkNodeTypesEntity[name]
            }
            
            menuItemsById[result.objectId] = options
            
            var data = {
              'objectId': result.objectId, 
              'dataTypeList': dataTypeList, 
              'feature': feature, 
              'latLng': latLng
            }
            menuItems.push( this.contextMenuService.makeMenuItem(name, data, options) )
          }
        })
      
        if (menuItems.length <= 0){
          this.closeContextMenu()
        }else{
          this.openContextMenu(x, y, menuItems)
        }
      })
    } else if ('serviceArea' == this.featureType) {

      this.getFeaturesAtPoint(latLng)
      .then((results) => {

        // We may have come here when the user clicked an existing map object. For now, just add it to the list.
        // This should be replaced by something that loops over all created map objects and picks those that are under the cursor.
        if (clickedMapObject) {
          var clickedFeature = {
            _data_type: 'service_layer',
            object_id: clickedMapObject.objectId,
            is_deleted: false
          }
          results.push(clickedFeature)
        }

        var menuItems = []
        var menuItemsById = {}

        if(results.length == 0) {
          var options = []
          //options.push('add Service Area')
          options.push( this.contextMenuService.makeItemOption('Add Service Area', 'fa-plus', () => {this.startDrawingBoundaryForSA(latLng)}) )
          var data = {
            'latLng': latLng
          }
          var name = 'Add Service Area'
          menuItems.push( this.contextMenuService.makeMenuItem(name, data, options) )
        } else {
          results.forEach((result) => {
            //populate context menu aray here
            // we may need different behavour for different controllers using this
            var options = []
            var dataTypeList = this.getDataTypeList(result)
            if (result.hasOwnProperty('object_id')) result.objectId = result.object_id
            var validFeature = false

            // have we already added this one?
            if ('service_layer' == dataTypeList[0]
              && !menuItemsById.hasOwnProperty(result.objectId)) {
              validFeature = true
            }

            if (validFeature) {
              var feature = result
              if (this.createdMapObjects.hasOwnProperty(result.objectId)) {
                // it's on the edit layer / in the transaction
                feature = this.createdMapObjects[result.objectId].feature
                options.push( this.contextMenuService.makeItemOption('Select', 'fa-pencil', () => {this.selectProposedFeature(result.objectId)} ) )
                options.push( this.contextMenuService.makeItemOption('Edit Service Area', 'fa-pencil', () => {this.editExistingFeature(result, latLng)}) )
                options.push( this.contextMenuService.makeItemOption('Delete', 'fa-trash', () => {this.deleteObjectWithId(result.objectId)}) )
              } else {
                options.push( this.contextMenuService.makeItemOption('Edit Existing', 'fa-pencil', () => {this.editExistingFeature(result, latLng)}) )
              }

              var name = ''
              if ('service_layer' == dataTypeList[0]) {
                name = 'Service Area: ' + result.code //'Service Area'
              } else {
                name = dataTypeList[1]
              }

              menuItemsById[result.objectId] = options
              
              var data = {
                'objectId': result.objectId, 
                'dataTypeList': dataTypeList, 
                'feature': feature, 
                'latLng': latLng
              }
              menuItems.push( this.contextMenuService.makeMenuItem(name, data, options) )
            }
          })
        }
        //this.menuItems = menuItems
        if (menuItems.length <= 0) {
          this.closeContextMenu()
        } else {
          this.openContextMenu(x, y, menuItems)
        }
      })
    } else if('location' == this.featureType){
      var name = 'Location'
      var options = [ this.contextMenuService.makeItemOption('Delete', 'fa-trash', () => {this.deleteObjectWithId(this.selectedMapObject.objectId)}) ]
      var menuItems = []
      var data = {
        'objectId': this.selectedMapObject.objectId, 
        'dataTypeList': ['location'], 
        'feature': this.selectedMapObject, 
        'latLng': latLng
      }
      menuItems.push( this.contextMenuService.makeMenuItem(name, data, options) )
      this.openContextMenu(x, y, menuItems)
    }
  }
  
  getFeaturesAtPoint(latLng){
    var lat = latLng.lat()
    var lng = latLng.lng()
    
    // Get zoom
    var zoom = this.mapRef.getZoom()
    
    // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
    var tileCoords = MapUtilities.getTileCoordinates(zoom, lat, lng)
    
    // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
    var clickedPointPixels = MapUtilities.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)

    return FeatureSelector.performHitDetection(this.tileDataService, { width: 256, height: 256 }, this.state.mapLayers.getValue(),
                                               zoom, tileCoords.x, tileCoords.y, clickedPointPixels.x, clickedPointPixels.y,
                                               this.state.selectedBoundaryType.id)
  }

  makeIconAnchor(iconUrl, callback){
    if ('undefined' == typeof callback) callback = {}
    var img = new Image();
    var loadCallBack = (w, h) => {
      this.iconAnchors[iconUrl] = new google.maps.Point(w*0.5, h*0.5)
      callback()
    }
    img.addEventListener("load", function(){
      loadCallBack( this.naturalWidth, this.naturalHeight)
    })
    img.src = iconUrl
  }
  
  setMapObjectIcon(mapObject, iconUrl){
    if (!this.iconAnchors.hasOwnProperty(iconUrl)){
      this.makeIconAnchor(iconUrl, () => {
        //mapObject.setIcon({path: google.maps.SymbolPath.CIRCLE, url: iconUrl, anchor: this.iconAnchors[iconUrl]})
        mapObject.setIcon({url: iconUrl, anchor: this.iconAnchors[iconUrl]})
      })
    }else{
      //mapObject.setIcon({path: google.maps.SymbolPath.CIRCLE, url: iconUrl, anchor: this.iconAnchors[iconUrl]})
      mapObject.setIcon({url: iconUrl, anchor: this.iconAnchors[iconUrl]})
    }
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
    if (!this.isMarker(mapObject) || !this.isBoundaryCreationAllowed({'mapObject':mapObject})) { 
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
      'background-color': 'rgba(255, 255, 255, 0.5)'
    }
    this.objectIdToDropCSS[mapObject.objectId] = dropTargetCSS
    return dropTargetCSS;
  }

  createMapObjects(features) {
    // "features" is an array that comes directly from aro-service. Create map objects for these features
    features.forEach((feature) => {
      this.createMapObject(feature, feature.iconUrl, false)  // Feature is not created usin a map click
    })
  }

  createPointMapObject(feature, iconUrl) {
    // Create a "point" map object - a marker
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = !((feature.workflow_state_id & WorkflowState.LOCKED.id)
                          || (feature.workflow_state_id & WorkflowState.INVALIDATED.id))
    var mapMarker = new google.maps.Marker({
      objectId: feature.objectId, // Not used by Google Maps
      featureType: feature.networkNodeType,
      position: new google.maps.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]),
      icon: {
        url: iconUrl
        // anchor: this.iconAnchors[this.objectIconUrl]
      },
      label: {
        text: '◯', 
        color: "#000000",
        fontSize: "46px"
      }, 
      draggable: isEditable, // Allow dragging only if feature is not locked
      clickable: true, // if it's an icon we can select it then the panel will tell us it's locked
      map: this.mapRef
    })
    
    if (!isEditable) {
      mapMarker.setOptions({clickable:false}); //Don't allow right click for locked markers
      if (feature.workflow_state_id & WorkflowState.LOCKED.id) {
        var lockIconOverlay = new google.maps.Marker({
          icon: {
            url: this.state.configuration.locationCategories.entityLockIcon,
            anchor: new google.maps.Point(12, 24)
          },
          clickable: false,
          map: this.mapRef
        })
        lockIconOverlay.bindTo('position', mapMarker, 'position')
        this.createdMapObjects[`${feature.objectId}_lockIconOverlay`] = lockIconOverlay 
      }
      if (feature.workflow_state_id & WorkflowState.INVALIDATED.id) {
        var lockIconOverlay = new google.maps.Marker({
          icon: {
            url: this.state.configuration.locationCategories.entityInvalidatedIcon,
            anchor: new google.maps.Point(12, 8)
          },
          clickable: false,
          map: this.mapRef
        })
        lockIconOverlay.bindTo('position', mapMarker, 'position')
        this.createdMapObjects[`${feature.objectId}_invalidatedIconOverlay`] = lockIconOverlay 
      }
    }

    // Refresh only the tile containing the object and its neighbours (in case the object overlaps onto another tile)
    this.tileDataService.addFeatureToExclude(feature.objectId)
    const zoom = this.mapRef.getZoom()
    const affectedTile = MapUtilities.getTileCoordinates(zoom, feature.geometry.coordinates[1], feature.geometry.coordinates[0])
    var tilesToRefresh = []
    const numNeighbours = 1
    for (var x = -numNeighbours; x <= numNeighbours; ++x) {
      for (var y = -numNeighbours; y <= numNeighbours; ++y) {
        tilesToRefresh.push({ zoom: zoom, x: affectedTile.x + x, y: affectedTile.y + y })
      }
    }
    this.tileDataService.markHtmlCacheDirty(tilesToRefresh)
    this.state.requestMapLayerRefresh.next(tilesToRefresh)
    // ToDo: this needs to be fixed by having a standard object model for features 
    if (!feature.hasOwnProperty('dataType')) feature.dataType = "equipment."+feature.networkNodeType
    
    mapMarker.feature = feature
    mapMarker.hitTest = (latLng) => {
      var scale = 1 << this.mapRef.getZoom()
      var w = mapMarker.icon.size.width / scale
      var h = mapMarker.icon.size.height / scale
      var lat = latLng.lat()
      var lng = latLng.lng()
      var markerLat = mapMarker.position.lat()
      var markerLng = mapMarker.position.lng()
      var east = mapMarker.position.lng() - w
      var west = mapMarker.position.lng() + w
      
      return (markerLng+w >= lng && lng >= markerLng-w 
          && markerLat+h >= lat && lat >= markerLat-h)
    }
    
    return mapMarker
  }

  createPolygonMapObject(feature) {
    // Create a "polygon" map object
    this.tileDataService.addFeatureToExclude(feature.objectId)
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
    
    // ToDo: this needs to be fixed by having a standard object model for features 
    if (!feature.hasOwnProperty('dataType')) feature.dataType = "equipment_boundary"
    
    polygon.feature = feature
    
    polygon.hitTest = (latLng) => {
      if (!this.state.showSiteBoundary) return false
      return google.maps.geometry.poly.containsLocation(latLng, polygon)
    }
    return polygon
  }

  createMultiPolygonMapObject(feature) {
    // Create a "polygon" map object
    this.tileDataService.addFeatureToExclude(feature.objectId)
    var polygonPath = []
    feature.geometry.coordinates[0][0].forEach((polygonVertex) => {
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
    
    polygon.feature = feature
    
    return polygon
  }

  // Return true if the given path is a closed path
  isClosedPath(path) {
    const firstPoint = path.getAt(0)
    const lastPoint = path.getAt(path.length - 1)
    const deltaLat = Math.abs(firstPoint.lat() - lastPoint.lat())
    const deltaLng = Math.abs(firstPoint.lng() - lastPoint.lng())
    const TOLERANCE = 0.0001
    return (deltaLat < TOLERANCE) && (deltaLng < TOLERANCE)
  }
  
  createEditableExistingMapObject(feature, iconUrl){
    this.createMapObject(feature, iconUrl, true, true)
  }
  
  createMapObject(feature, iconUrl, usingMapClick, existingObjectOverride) {
    if ('undefined' == typeof existingObjectOverride) {
      existingObjectOverride = false
    }
    var mapObject = null
    if (feature.geometry.type === 'Point') {
      
      // if an existing object just show don't edit
      if (feature.isExistingObject && !existingObjectOverride){
        this.displayViewObject({feature:feature})
        this.selectMapObject(null)
        return
      }
      mapObject = this.createPointMapObject(feature, iconUrl)
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
          if (!self.isClosedPath(path)) {
            // IMPORTANT to check if it is already a closed path, otherwise we will get into an infinite loop when trying to keep it closed
            if (index === 0) {
              // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
              path.setAt(0, path.getAt(path.length - 1))
              self.onModifyObject && self.onModifyObject({mapObject})
            } else if (index === path.length - 1) {
              // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
              path.setAt(path.length - 1, path.getAt(0))
              self.onModifyObject && self.onModifyObject({mapObject})
            }
          } else {
            self.onModifyObject && self.onModifyObject({mapObject})
          }
        });
      });
      google.maps.event.addListener(mapObject, 'dragend', function(){
        self.onModifyObject && self.onModifyObject({mapObject})
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      mapObject = this.createMultiPolygonMapObject(feature)
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
          if (!self.isClosedPath(path)) {
            // IMPORTANT to check if it is already a closed path, otherwise we will get into an infinite loop when trying to keep it closed
            if (index === 0) {
              // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
              path.setAt(0, path.getAt(path.length - 1))
              self.onModifyObject && self.onModifyObject({mapObject})
            } else if (index === path.length - 1) {
              // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
              path.setAt(path.length - 1, path.getAt(0))
              self.onModifyObject && self.onModifyObject({mapObject})
            }
          } else {
            self.onModifyObject && self.onModifyObject({mapObject})
          }
        });
      });
      // google.maps.event.addListener(mapObject, 'dragend', function(){
      //   self.onModifyObject && self.onModifyObject({mapObject})
      // });
    } else {
      throw `createMapObject() not supported for geometry type ${feature.geometry.type}`
    }
    
    
    mapObject.addListener('rightclick', (event) => {
      
      // 'event' contains a MouseEvent which we use to get X,Y coordinates. The key of the MouseEvent object
      // changes with google maps implementations. So iterate over the keys to find the right object.
      
      // ToDo: this kind of thing needs to be in the controller
      //console.log('rightclick editable object')
      //console.log(event)
      if ('location' == this.featureType){
        this.selectMapObject(mapObject)
      }
      var eventXY = this.getXYFromEvent(event)
      this.updateContextMenu(event.latLng, eventXY.x, eventXY.y, mapObject)
    })
    
    this.createdMapObjects[mapObject.objectId] = mapObject
    this.onCreateObject && this.onCreateObject({mapObject: mapObject, usingMapClick: usingMapClick, feature: feature})
    
    if (usingMapClick) this.selectMapObject(mapObject)
  }
  
  
  handleMapEntitySelected(event) {
    if (!event || !event.latLng) {
      return
    }
    
    // filter out equipment and locations already in the list
    // ToDo: should we do this for all types of features?
    var filterArrayByObjectId = (featureList) => {
      let filteredList = []
      for (let i=0; i<featureList.length; i++){
        let feature = featureList[i]
        if (!feature.object_id 
            || (!this.createdMapObjects.hasOwnProperty(feature.object_id) 
                && !this.createdMapObjects.hasOwnProperty(feature.object_id + '_lockIconOverlay')
                && !this.createdMapObjects.hasOwnProperty(feature.object_id + '_invalidatedIconOverlay')
                && this.filterFeatureForSelection(feature)
               ) 
          ){
          filteredList.push(feature)
        }
      }
      return filteredList
    }
    
    var equipmentFeatures = []
    if (event.equipmentFeatures){
      equipmentFeatures = filterArrayByObjectId(event.equipmentFeatures)
    }
    
    var locations = []
    if (event.locations){
      locations = filterArrayByObjectId(event.locations)
    }

    var feature = {
      geometry: {
        type: 'Point',
        coordinates: [event.latLng.lng(), event.latLng.lat()] 
      },
      isExistingObject: false
    }
    
    var iconKey = Constants.MAP_OBJECT_CREATE_KEY_OBJECT_ID
    var featurePromise = null
    if (this.featureType === 'location' && locations.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = locations[0].object_id
      feature.isExistingObject = true
      // A feature is "locked" if the workflow state is LOCKED or INVALIDATED.
      feature.workflow_state_id = locations[0].workflow_state_id
      featurePromise = this.$http.get(`/service/library/features/${this.modifyingLibraryId}/${feature.objectId}`)
      .then((result) => {
        var serviceFeature = result.data
        // use feature's coord NOT the event's coords
        feature.geometry.coordinates = serviceFeature.geometry.coordinates
        feature.attributes = serviceFeature.attributes
        feature.directlyEditExistingFeature = true
        return Promise.resolve(feature)
      })
    } else if (this.featureType === 'equipment' && equipmentFeatures.length > 0) {
      // The map was clicked on, and there was an equipmentFeature under the cursor
      const clickedObject = equipmentFeatures[0]
      feature.objectId = clickedObject.object_id 
      feature.isExistingObject = true
      if (clickedObject._data_type === 'equipment_boundary.select') {
        iconKey = Constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY
        // Get the boundary geometry from aro-service
        featurePromise = this.$http.get(`/service/plan-feature/${this.state.plan.getValue().id}/equipment_boundary/${feature.objectId}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
          // ToDo: check for empty object, reject on true
          if (!result.hasOwnProperty('data') || !result.data.hasOwnProperty('objectId')){
            return Promise.reject( `object: ${feature.objectId} may have been deleted` )
          }
          
          var serviceFeature = result.data
          serviceFeature.attributes = {
            network_node_object_id: serviceFeature.networkObjectId,
            networkNodeType: serviceFeature.networkNodeType
          }
          serviceFeature.isExistingObject = true
          return Promise.resolve(serviceFeature)
        })
      } else {
        // Quickfix - Display the equipment and return, do not make multiple calls to aro-service #159544541
        this.displayViewObject({feature:feature})
        this.selectMapObject(null)
        // Update selected feature in state so it is rendered correctly
        var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
        selectedViewFeaturesByType.equipment = {}
        selectedViewFeaturesByType.equipment[feature.objectId] = feature
        this.state.StateViewMode.reloadSelectedViewFeaturesByType(this.state,selectedViewFeaturesByType)
        return
      }
    } else if (this.featureType === 'serviceArea' && event.hasOwnProperty('serviceAreas')
      && event.serviceAreas.length > 0 && event.serviceAreas[0].hasOwnProperty('code')) {
      iconKey = Constants.MAP_OBJECT_CREATE_SERVICE_AREA
      var serviceArea = event.serviceAreas[0]
      feature.isExistingObject = true
      // Get the Service area geometry from aro-service
      featurePromise = this.state.StateViewMode.loadEntityList(this.$http, this.state, 'ServiceAreaView', serviceArea.id, 'id,code,name,sourceId,geom', 'id')
        .then((result) => {
          // ToDo: check for empty object, reject on true
          if (!result[0].hasOwnProperty('geom')) {
            return Promise.reject(`object: ${serviceArea.object_id} may have been deleted`)
          }

          var serviceFeature = result[0]
          serviceFeature.objectId = serviceArea.object_id
          serviceFeature.geometry = serviceFeature.geom
          serviceFeature.isExistingObject = true
          return Promise.resolve(serviceFeature)
        })
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
      feature.objectId = this.utils.getUUID()
      feature.isExistingObject = false
      featurePromise = Promise.resolve(feature)
    }

    var featureToUse = null
    featurePromise
      .then((result) => {
        featureToUse = result
        // When we are modifying existing objects, the iconUrl to use is provided by the parent control via a function.
        
        return this.getObjectIconUrl && this.getObjectIconUrl({ objectKey: iconKey, objectValue: featureToUse.objectId })
      })
      .then((iconUrl) => this.createMapObject(featureToUse, iconUrl, true, featureToUse.directlyEditExistingFeature))
      .then(() => {
        // If we are editing an existing polygon object, make it editable
        if (feature.isExistingObject && (iconKey === Constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY || 
          iconKey === Constants.MAP_OBJECT_CREATE_SERVICE_AREA)) {
          this.selectedMapObject.setEditable(true)
        }
      })
      .catch((err) => console.error(err))
  }

  isMarker(mapObject) {
    return mapObject && mapObject.icon
  }

  selectMapObject(mapObject) {
    // First de-select the currently selected map object (if any)
    if (this.selectedMapObject) {
      if (this.isMarker(this.selectedMapObject)) {
        //this.setMapObjectIcon(this.selectedMapObject, this.getIconsByFeatureType(this.selectedMapObject.featureType).iconUrl)
        //this.selectedMapObject.label.color = "black"
        var label = this.selectedMapObject.getLabel()
        label.color="#000000";
        this.selectedMapObject.setLabel(label);
      } else {
        this.selectedMapObject.setOptions(this.polygonOptions)
        this.selectedMapObject.setEditable(false)
      }
    }

    // Then select the map object
    if (mapObject) {  // Can be null if we are de-selecting everything
      if (this.isMarker(mapObject)) {
        //this.setMapObjectIcon(mapObject, this.getIconsByFeatureType(mapObject.featureType).selectedIconUrl)
        //mapObject.label.color = "green"
        var label = mapObject.getLabel()
        label.color="#009900";
        mapObject.setLabel(label);
        //mapObject.label: 
      } else {
        mapObject.setOptions(this.selectedPolygonOptions)
        mapObject.setEditable(true)
      }
    } else {
      //when deselected object close drop down if open
      this.closeContextMenu()
    }
    this.selectedMapObject = mapObject
    this.onSelectObject && this.onSelectObject({mapObject})
  }
  
  /*
  toggleEditSelectedPolygon() {
    if (!this.selectedMapObject || this.isMarker(this.selectedMapObject)) {
      return
    }
    var isEditable = this.selectedMapObject.getEditable()
    this.selectedMapObject.setEditable(!isEditable)
  }
  */
  
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
    if(mapObjectToDelete) {
      mapObjectToDelete.setMap(null)
      delete this.createdMapObjects[objectId]
      this.onDeleteObject && this.onDeleteObject({mapObject: mapObjectToDelete})
      this.closeContextMenu()
      //this.contextMenuCss.display = 'none'  // Hide the context menu      
      //console.log('delete object')
      //console.log(mapObjectToDelete)
    }
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
        objectId: self.utils.getUUID(),
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
      self.createMapObject(feature, null ,true)
      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
      // Kill the drawing manager
      self.drawing.drawingManager.setMap(null)
      self.drawing.drawingManager = null
      self.drawing.markerIdForBoundary = null
    });
  }

  startDrawingBoundaryForSA(latLng) {

    if (this.drawing.drawingManager) {
      // If we already have a drawing manager, discard it.
      console.warn('We already have a drawing manager active')
      this.drawing.drawingManager.setMap(null)
      this.drawing.drawingManager = null
    }

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
        objectId: self.utils.getUUID(),
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[]]
        },
        isExistingObject: false
      }
      event.overlay.getPaths().forEach((path) => {
        var pathPoints = []
        path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
        pathPoints.push(pathPoints[0])  // Close the polygon
        feature.geometry.coordinates[0].push(pathPoints)
      })
      self.createMapObject(feature, null ,true)
      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
      // Kill the drawing manager
      self.drawing.drawingManager.setMap(null)
      self.drawing.drawingManager = null
      self.drawing.markerIdForBoundary = null
    });
  }

  generateHexagonPath(position,radius) {
    var pathPoints = [];
    for(var angle= -90;angle < 270; angle+=60) {
      var point = google.maps.geometry.spherical.computeOffset(position, radius, angle)
      pathPoints.push([point.lng(), point.lat()]);    
    }
    pathPoints.push(pathPoints[0])  // Close the polygon

    return pathPoints
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
    if (this.overlayRightClickListener) {
      google.maps.event.removeListener(this.overlayRightClickListener)
      this.overlayRightClickListener = null
    }
    
    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()

    //unsubscribe map click observer
    this.mapFeaturesSelectedEventObserver.unsubscribe();
    this.dragEndEventObserver.unsubscribe();
    this.dragStartEventObserver.unsubscribe();

    // Go back to the default map cursor
    this.mapRef.setOptions({ draggableCursor: null })
    
    /*
    // Remove the context menu from the document body
    this.$timeout(() => {
      var documentBody = this.$document.find('body')[0]
      documentBody.removeChild(this.contextMenuElement)
      var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
      mapCanvas.removeChild(this.dropTargetElement)
    }, 0)
    */
    
    // Remove any dragging DOM event listeners
    var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
    mapCanvas.ondragover = null
    mapCanvas.ondrop = null
  }
}

MapObjectEditorController.$inject = ['$http', '$element', '$compile', '$document', '$timeout', 'state', 'tileDataService', 'contextMenuService', 'Utils']

let mapObjectEditor = {
  templateUrl: '/components/common/map-object-editor.html',
  bindings: {
    mapGlobalObjectName: '@',
    mapContainerId: '@',  // The HTML element that contains the map
    getObjectIconUrl: '&',
    getObjectSelectedIconUrl: '&',
    modifyingLibraryId: '<',  // Can be null, valid only if we are modifying locations
    deleteMode: '<',
    createObjectOnClick: '<',
    //allowBoundaryCreation: '<',
    isBoundaryCreationAllowed: '&', 
    hideObjectIds: '<',    // A set of IDs that we will suppress visibility for
    featureType: '@',
    onInit: '&',
    onCreateObject: '&',
    onSelectObject: '&',
    onModifyObject: '&',
    onDeleteObject: '&',
    displayViewObject: '&', 
    onObjectDroppedOnMarker: '&',
    registerObjectDeleteCallback: '&', // To be called to register a callback, which will delete the selected object
    registerCreateMapObjectsCallback: '&',  // To be called to register a callback, which will create map objects for existing objectIds
    registerRemoveMapObjectsCallback: '&',   // To be called to register a callback, which will remove all created map objects
    registerCreateEditableExistingMapObject: '&'  // To be called to register a callback, which will create a map object from and existing object
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor