import Constants from './constants'
import MapUtilities from './plan/map-utilities';
class MapObjectEditorController {

  constructor($http, $element, $compile, $document, $timeout, configuration, state, tileDataService, Utils) {
    this.$http = $http
    this.$element = $element
    this.$compile = $compile
    this.$document = $document
    this.$timeout = $timeout
    this.configuration = configuration
    this.state = state
    this.tileDataService = tileDataService
    this.utils = Utils
    this.mapRef = null
    this.overlayRightClickListener = null
    this.createObjectOnClick = true
    this.createdMapObjects = {}
    this.selectedMapObject = null
    this.iconAnchors = {}
    this.menuItems = []
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
      //console.log(event)
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
      event.preventDefault();
    };
    
    
    this.overlayRightClickListener = this.mapRef.addListener('rightclick', (event) => {
      // ToDo: this should be in plan-editor 
      if ('equipment' == this.featureType){
        var eventXY = this.getXYFromEvent(event)
        this.updateContextMenu(event.latLng, eventXY.x, eventXY.y)
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
    var dropdownMenu = this.$document.find('.map-object-editor-context-menu-dropdown')
    const isDropdownHidden = dropdownMenu.is(':hidden')
    if (!isDropdownHidden) {
      var toggleButton = this.$document.find('.map-object-editor-context-menu')
      toggleButton.dropdown('toggle')
    }
  }
  
  openContextMenu(x, y){
    if ('undefined' != typeof x) this.contextMenuCss.left = `${x}px`
    if ('undefined' != typeof y) this.contextMenuCss.top = `${y}px`
    
    // Display the context menu and select the clicked marker
    this.contextMenuCss.display = 'block'
    
    // Show the dropdown menu
    var dropdownMenu = this.$document.find('.map-object-editor-context-menu-dropdown')
    const isDropdownHidden = dropdownMenu.is(':hidden')
    if (isDropdownHidden) {
      var toggleButton = this.$document.find('.map-object-editor-context-menu')
      toggleButton.dropdown('toggle')
    }
    this.$timeout()
  }
  
  editExistingFeature(feature, latLng){
    var hitFeatures = {}
    hitFeatures['latLng'] = latLng
    if ('location' == this.featureType) hitFeatures['locations'] = [feature]
    if ('equipment' == this.featureType) hitFeatures['equipmentFeatures'] = [feature]
    
    this.state.mapFeaturesSelectedEvent.next(hitFeatures)
  }
  
  selectProposedFeature(objectId){
    this.selectMapObject(this.createdMapObjects[objectId])
  }
  
  startDrawingBoundaryForId(objectId){
    this.startDrawingBoundaryFor(this.createdMapObjects[objectId])
  }
  
  // deleteObjectWithId
  //createEditableExistingMapObject(feature, iconUrl)
  
  updateContextMenu(latLng, x, y){
    if ('equipment' == this.featureType){ // ToDo: need a better way to do this, should be in plan-editor 
      
      // NEED TO GET NEW FEATURES AS WELL
      var lat = latLng.lat()
      var lng = latLng.lng()
      this.getFeaturesAtPoint(latLng)
      .then((results) => {
        var menuItems = []
        var menuItemsById = {}
        
        results.forEach((resultList) => {
          resultList.forEach((result) => {
            //populate context menu aray here
            // we may need different behavour for different controllers using this
            
            // if this.createdMapObjects[objectId]
            var options = []
            // ToDo: sometimes it's _data_type other times it's dataType
            // regulate this using actual classes! 
            var dataTypeList = ['']
            if (result.hasOwnProperty('_data_type')) dataTypeList = result._data_type.split('.')
            if (result.hasOwnProperty('dataType')) dataTypeList = result.dataType.split('.')
            if (('equipment' == dataTypeList[0] || 'equipment_boundary' == dataTypeList[0]) 
                && (!result.is_deleted || 'false' == result.is_deleted)
                && !menuItemsById.hasOwnProperty( result.object_id) ){
              
              // ToDo: MORE discrepancies, we NEED to fix this
              if (result.hasOwnProperty('object_id')) result.objectId = result.object_id
              
              var feature = result
              if (this.createdMapObjects.hasOwnProperty(result.objectId) ){
                // it's on the edit layer / in the transaction
                feature = this.createdMapObjects[result.objectId].feature
                options.push('select')// select 
                if ('equipment' == dataTypeList[0]){
                  options.push('add boundary')// need to filter for: if not boundary 
                }
                options.push('delete')
              }else{
                options.push('edit existing')
              }
              
              var name = ''
              if ('equipment_boundary' == dataTypeList[0]){
                name = 'boundary'
              }else if(feature.hasOwnProperty('networkNodeType')){
                name = feature.networkNodeType
              }else{
                name = dataTypeList[1]
              }
              
              menuItemsById[result.objectId] = options
              menuItems.push({
                'objectId': result.objectId, 
                'options': options, 
                'dataTypeList': dataTypeList, 
                'name': name, 
                'feature': feature, 
                'latLng': latLng
              })
              
            }
          })
        })
        
        this.menuItems = menuItems
        if (menuItems.length <= 0){
          this.closeContextMenu()
        }else{
          this.openContextMenu(x, y)
        }
      })
    }else if('location' == this.featureType){
      this.menuItems = [{
        'objectId': this.selectedMapObject.objectId, 
        'options': ['delete'], 
        'dataTypeList': ['location'], 
        'name': 'location', 
        'feature': this.selectedMapObject, 
        'latLng': latLng
      }]
      
      this.openContextMenu(x, y)
    }
  }
  
  getFeaturesAtPoint(latLng){
    var lat = latLng.lat()
    var lng = latLng.lng()
    
    // Get zoom
    var zoom = this.mapRef.getZoom()
    var hitPromises = []
    hitPromises.push( new Promise((resolve, reject) => {
      var hits = []
      Object.getOwnPropertyNames(this.createdMapObjects).forEach((objectId) => {
        var mapObject = this.createdMapObjects[objectId]
        if ( mapObject.hitTest(latLng) ){
          hits.push(mapObject.feature)
        }
      })
      resolve(hits)
    }))
    // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
    var tileCoords = MapUtilities.getTileCoordinates(zoom, lat, lng)
    
    // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
    var clickedPointPixels = this.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)
    this.mapRef.overlayMapTypes.forEach((mapOverlay) => {
        hitPromises.push(mapOverlay.performHitDetection(zoom, tileCoords.x, tileCoords.y, clickedPointPixels.x, clickedPointPixels.y))
    })
    
    return Promise.all(hitPromises)
  }
  
  
  // ----- FOR TEST - will be moved to util file to be shared with tile.js ------------------- //
  
//Get the pixel coordinates of the clicked point WITHIN a tile (relative to the top left corner of the tile)
  getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng) {
    // 1. Get the top left coordinates of the tile in lat lngs
    var nwCornerLatLng = this.getNWTileCornerLatLng(zoom, tileCoords.x, tileCoords.y)
    // 2. Convert to pixels
    var nwCornerPixels = this.getPixelCoordinatesFromLatLng(nwCornerLatLng, zoom)
    // 3. Convert the clicked lat lng to pixels
    var clickedPointPixels = this.getPixelCoordinatesFromLatLng({ lat: lat, lng: lng }, zoom)

    return {
      x: clickedPointPixels.x - nwCornerPixels.x,
      y: clickedPointPixels.y - nwCornerPixels.y
    }
  }

  // Returns the latitiude and longitude of the northwest corner of a tile
  // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_numbers_to_lon..2Flat.
  getNWTileCornerLatLng(tileZoom, tileX, tileY) {
    var n = Math.pow(2.0, tileZoom)
    var lon_deg = tileX / n * 360.0 - 180.0
    var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)))
    var lat_deg = lat_rad * 180.0 / Math.PI
    return {
      lat: lat_deg,
      lng: lon_deg
    }
  }

  // Returns the GLOBAL pixel coordinates (not screen pixel coordinates) for a lat long
  // https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
  getPixelCoordinatesFromLatLng(latLng, zoom) {
    var siny = Math.sin(latLng.lat * Math.PI / 180);
    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);
    this.TILE_SIZE = 256
    var xUnscaled = this.TILE_SIZE * (0.5 + latLng.lng / 360);
    var yUnscaled = this.TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
    var scale = Math.pow(2.0, zoom)
    
    return {
      x: Math.floor(xUnscaled * scale),
      y: Math.floor(yUnscaled * scale)
    }
  }
  
  
  // --------------------------------
  
  
  
  
  
  
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
      draggable: !feature.is_locked, // Allow dragging only if feature is not locked
      //clickable: !feature.is_locked, // Allow clicking (including right click) only if feature is not locked
      clickable: true, // if it's an icon we can select it then the panel will tell us it's locked
      map: this.mapRef
    })
    
    if (feature.is_locked) {
      mapMarker.setOptions({clickable:false}); //Don't allow right click for locked markers
      var lockIconOverlay = new google.maps.Marker({
        icon: {
          url: this.configuration.locationCategories.entityLockIcon, //,
          anchor: new google.maps.Point(12, 24)
        },
        clickable: false,
        map: this.mapRef
      })
      lockIconOverlay.bindTo('position', mapMarker, 'position')
      this.createdMapObjects[`${feature.objectId}_lockIconOverlay`] = lockIconOverlay 
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
    
    polygon.feature = feature
    
    polygon.hitTest = (latLng) => {
      if (!this.state.showSiteBoundary) return false
      return google.maps.geometry.poly.containsLocation(latLng, polygon)
    }
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
              //path.forEach((item) => console.log(`${item.lat()}, ${item.lng()}`))
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
    } else {
      throw `createMapObject() not supported for geometry type ${feature.geometry.type}`
    }
    
    
    mapObject.addListener('rightclick', (event) => {
      
      // 'event' contains a MouseEvent which we use to get X,Y coordinates. The key of the MouseEvent object
      // changes with google maps implementations. So iterate over the keys to find the right object.
      
      // ToDo: this kind of thing needs to be in the controller
      if ('location' == this.featureType){
        this.selectMapObject(mapObject)
      }
      var eventXY = this.getXYFromEvent(event)
      this.updateContextMenu(event.latLng, eventXY.x, eventXY.y)
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
        if (!feature.object_id || (!this.createdMapObjects.hasOwnProperty(feature.object_id) && !this.createdMapObjects.hasOwnProperty(feature.object_id + '_lockIconOverlay')) ){
          filteredList.push(feature)
        }
      }
      return filteredList
    }
    
    if (event.equipmentFeatures){
      event.equipmentFeatures = filterArrayByObjectId(event.equipmentFeatures)
    }
    
    if (event.locations){
      event.locations = filterArrayByObjectId(event.locations)
    }

    var feature = {
      geometry: {
        type: 'Point',
        coordinates: [event.latLng.lng(), event.latLng.lat()] 
      },
      is_locked: false,
      isExistingObject: false
    }
    
    var iconKey = Constants.MAP_OBJECT_CREATE_KEY_OBJECT_ID
    var featurePromise = null
    if (this.featureType === 'location' && event.locations && event.locations.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = event.locations[0].object_id
      feature.isExistingObject = true
      feature.is_locked = event.locations[0].is_locked
      
      featurePromise = this.$http.get(`/service/library/features/${this.modifyingLibraryId}/${feature.objectId}`)
      .then((result) => {
        var serviceFeature = result.data
        // use feature's coord NOT the event's coords
        feature.geometry.coordinates = serviceFeature.geometry.coordinates
        feature.attributes = serviceFeature.attributes
        feature.directlyEditExistingFeature = true
        return Promise.resolve(feature)
      })
    } else if (this.featureType === 'equipment' && event.equipmentFeatures && event.equipmentFeatures.length > 0) {
      // The map was clicked on, and there was an equipmentFeature under the cursor
      const clickedObject = event.equipmentFeatures[0]
      feature.objectId = clickedObject.object_id 
      feature.isExistingObject = true
      if (clickedObject._data_type === 'equipment_boundary.select') {
        iconKey = Constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY
        // Get the boundary geometry from aro-service
        featurePromise = this.$http.get(`/service/plan-feature/${this.state.plan.getValue().id}/equipment_boundary/${feature.objectId}?userId=${this.state.loggedInUser.id}`)
        .then((result) => {
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
        this.state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
        return
      }
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
        
        return this.getObjectIconUrl({ objectKey: iconKey, objectValue: featureToUse.objectId })
      })
      .then((iconUrl) => this.createMapObject(featureToUse, iconUrl, true, featureToUse.directlyEditExistingFeature))
      .then(() => {
        // If we are editing an existing polygon object, make it editable
        if (feature.isExistingObject && iconKey === Constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY) {
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
      }
    } else {
      //when deselected object close drop down if open
      this.closeContextMenu()
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

MapObjectEditorController.$inject = ['$http', '$element', '$compile', '$document', '$timeout', 'configuration', 'state', 'tileDataService', 'Utils']

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
    allowBoundaryCreation: '<',
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