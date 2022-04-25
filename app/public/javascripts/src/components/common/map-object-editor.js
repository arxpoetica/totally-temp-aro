import Constants from './constants'
import WorkflowState from '../../shared-utils/workflow-state'
import MapUtilities from './plan/map-utilities'
import FeatureSelector from '../tiles/feature-selector'
import Utilities from './utilities'
import MenuAction, { MenuActionTypes } from '../common/context-menu/menu-action'
import MenuItem, { MenuItemTypes } from '../common/context-menu/menu-item'
import uuidStore from '../../shared-utils/uuid-store'
import SelectionActions from '../../react/components/selection/selection-actions'
import DeleteMenu from '../../react/components/data-edit/maps-delete-menu.js'

class MapObjectEditorController {
  constructor ($http, $element, $compile, $document, $timeout, $ngRedux, state, tileDataService, contextMenuService, Utils) {
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
    this.selectedMapObjectPreviousShape = {}
    this.iconAnchors = {}
    this.polygonInvalidMsg = {
      title: 'Invalid Polygon',
      text: 'Polygon shape is invalid, please try again. Ensure that the polygon is not self-intersecting.'
    }

    this.drawing = {
      drawingManager: null,
      markerIdForBoundary: null // The objectId of the marker for which we are drawing the boundary
    }
    this.polygonOptions = {
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF1493',
      fillOpacity: 0.4
    }
    this.selectedPolygonOptions = {
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FF1493',
      fillOpacity: 0.4
    }

    this.deleteMenu = new DeleteMenu()

    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onInit () {
    // We should have a map variable at this point
    if (!window[this.mapGlobalObjectName]) {
      console.error('ERROR: Map Object Editor component initialized, but a map object is not available at this time.')
      return
    }
    this.mapRef = window[this.mapGlobalObjectName]

    if (!this.featureType) {
      console.warn('map-object-editor: featureType must be defined (currently either "location" or "equipment"')
    }

    this.$timeout(() => {
      this.dropTargetElement = this.$element.find('.map-object-drop-targets-container')[0]
      this.$element[0].removeChild(this.dropTargetElement)
      var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
      mapCanvas.appendChild(this.dropTargetElement)
    }, 0)

    // Use the cross hair cursor while this control is initialized
    this.mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.mapFeaturesSelectedEventObserver = this.state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      if (this.state.isRulerEnabled || this.rIsRulerEnabled) return // disable any click action when ruler is enabled
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
      return !(hasEntityType || hasBoundaryType) // false == allow dropping
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
      var grabOffsetX = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_OFFSET_X)
      var grabOffsetY = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_OFFSET_Y)
      var grabImageW = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_ICON_W)
      var grabImageH = event.dataTransfer.getData(Constants.DRAG_DROP_GRAB_ICON_H)
      var offsetX = (grabImageW * 0.5) - grabOffsetX // center
      var offsetY = grabImageH - grabOffsetY // bottom

      var dropLatLng = this.pixelToLatlng(event.clientX + offsetX, event.clientY + offsetY)

      if (event.dataTransfer.getData(Constants.DRAG_DROP_ENTITY_DETAILS_KEY) !== Constants.MAP_OBJECT_CREATE_SERVICE_AREA) {
        // ToDo feature should probably be a class
        var feature = {
          objectId: uuidStore.getUUID(),
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
        var position = new google.maps.LatLng(dropLatLng.lat(), dropLatLng.lng())
        var radius = (40000 / Math.pow(2, this.mapRef.getZoom())) * 2 * 256 // radius in meters
        var path = this.generateHexagonPath(position, radius)
        var feature = {
          objectId: uuidStore.getUUID(),
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[path]]
          },
          isExistingObject: false
        }
        this.createMapObject(feature, null, true)
      }

      event.preventDefault()
    }

    this.overlayRightClickListener = this.mapRef.addListener('rightclick', (event) => {
      // ToDo: this should be in plan-editor
      if (this.featureType == 'equipment' || this.featureType == 'serviceArea') { // we're editing a equipment and eqipment bounds NOT locations
        var eventXY = this.getXYFromEvent(event)
        if (!eventXY) return
        this.updateContextMenu(event.latLng, eventXY.x, eventXY.y, null)
      }
    })

    this.onInit && this.onInit()
    // We register a callback so that the parent object can request a map object to be deleted
    this.registerObjectDeleteCallback && this.registerObjectDeleteCallback({ deleteObjectWithId: this.deleteObjectWithId.bind(this) })
    this.registerCreateMapObjectsCallback && this.registerCreateMapObjectsCallback({ createMapObjects: this.createMapObjects.bind(this) })
    this.registerRemoveMapObjectsCallback && this.registerRemoveMapObjectsCallback({ removeMapObjects: this.removeCreatedMapObjects.bind(this) })
    this.registerCreateEditableExistingMapObject && this.registerCreateEditableExistingMapObject({ createEditableExistingMapObject: this.createEditableExistingMapObject.bind(this) })
    this.registerDeleteCreatedMapObject && this.registerDeleteCreatedMapObject({ deleteCreatedMapObject: this.deleteCreatedMapObject.bind(this) })
    this.registerSelectProposedFeature && this.registerSelectProposedFeature({ selectProposedFeature: this.selectProposedFeature.bind(this) })
    this.registerMapObjectFromEvent && this.registerMapObjectFromEvent({ mapObjectFromEvent: this.handleMapEntitySelected.bind(this) })
    this.registerHighlightMapObject && this.registerHighlightMapObject({ highlightMapObject: this.highlightMapObject.bind(this) })
    this.registerDehighlightMapObject && this.registerDehighlightMapObject({ dehighlightMapObject: this.dehighlightMapObject.bind(this) })
    this.registerUpdateMapObjectPosition && this.registerUpdateMapObjectPosition({ updateMapObjectPosition: this.updateMapObjectPosition.bind(this) })

    this.state.clearEditingMode.skip(1).subscribe((clear) => {
      if (clear) {
        this.selectMapObject(null) // deselects the selected equipment
      }
    })
  }

  // ----- rightclick menu ----- //

  getXYFromEvent (event) {
    var mouseEvent = null
    Object.keys(event).forEach((eventKey) => {
      if (event.hasOwnProperty(eventKey) && (event[eventKey] instanceof MouseEvent)) {
        mouseEvent = event[eventKey]
      }
    })
    if (!mouseEvent) return
    var x = mouseEvent.clientX
    var y = mouseEvent.clientY
    return { 'x': x, 'y': y }
  }

  closeContextMenu () {
    this.contextMenuService.menuOff()
    this.$timeout()
  }

  openContextMenu (x, y, menuItems) {
    var bounds = []
    var boundsByNetworkNodeObjectId = {}
    menuItems.forEach((menuItem) => {
      var feature = menuItem.feature
      if (feature && feature.network_node_object_id) {
        bounds.push(feature)
        boundsByNetworkNodeObjectId[feature.network_node_object_id] = menuItem
      }
    })

    this.utils.getBoundsCLLIs(bounds, this.state)
      .then((results) => {
        results.forEach((result) => {
          const clliCode = (result.data.networkNodeEquipment.siteInfo.siteClli) || '(empty CLLI code)'
          boundsByNetworkNodeObjectId[result.data.objectId].displayName = `Boundary: ${clliCode}`
        })
        this.contextMenuService.populateMenu(menuItems)
        this.contextMenuService.moveMenu(x, y)
        this.contextMenuService.menuOn()
        this.$timeout()
      })
  }

  viewExistingFeature (feature, latLng) {
    var hitFeatures = {}
    hitFeatures['latLng'] = latLng
    if (this.featureType == 'location') hitFeatures['locations'] = [feature]
    if (this.featureType == 'equipment') hitFeatures['equipmentFeatures'] = [feature]
    if (this.featureType == 'serviceArea') hitFeatures['serviceAreas'] = [feature]
    this.state.mapFeaturesSelectedEvent.next(hitFeatures)
  }

  selectProposedFeature (objectId) {
    if (!this.createdMapObjects.hasOwnProperty(objectId)) return false
    this.selectMapObject(this.createdMapObjects[objectId])
    return true
  }

  startDrawingBoundaryForId (objectId) {
    this.startDrawingBoundaryFor(this.createdMapObjects[objectId])
  }
  /*
  editBoundary(objectId){
    this.selectMapObject(this.createdMapObjects[objectId])
    //this.selectedMapObject.setEditable(true);
  }
  */

  filterFeatureForSelection (feature) {
    // has it been deleted?
    if (feature.is_deleted && feature.is_deleted != 'false') return false
    // is the boundary type visible? (caf2 etc.)
    if (feature.hasOwnProperty('boundary_type') && feature.boundary_type != this.state.selectedBoundaryType.id) return false
    if (feature.hasOwnProperty('boundaryTypeId') && feature.boundaryTypeId != this.state.selectedBoundaryType.id) return false
    var objectId = ''
    if (feature.hasOwnProperty('object_id')) {
      objectId = feature.object_id
    } else if (feature.hasOwnProperty('objectId')) {
      objectId = feature.objectId
    }

    if (objectId != '' && !this.createdMapObjects.hasOwnProperty(objectId)) {
      // we have an objectId and the feature is NOT on the edit layer
      // check that the equipment layer is on for that feature
      const featureType = this.utils.getFeatureMenuItemType(feature)
      var validFeature = true
      if (featureType === MenuItemTypes.EQUIPMENT) {
        const dataTypeComponents = (feature._data_type || feature.dataType || '').split('.')
        validFeature = (dataTypeComponents.length > 0 && this.state.isFeatureLayerOn(dataTypeComponents[1]))
      } else {
        validFeature = this.state.isFeatureLayerOnForBoundary(feature)
        if (validFeature && this.tileDataService.modifiedBoundaries.hasOwnProperty(objectId) &&
            this.tileDataService.modifiedBoundaries[objectId].deleted) {
          // a bounds that is on and has been modified
          // check to see if it's lying about being deleted
          validFeature = false
        }
      }
      if (!validFeature) return false
    }

    return true
  }

  updateContextMenu (latLng, x, y, clickedMapObject) {
    if (this.featureType === 'equipment') { // ToDo: need a better way to do this, should be in plan-editor
      this.getFeaturesAtPoint(latLng)
        .then((results) => {
          // We may have come here when the user clicked an existing map object. For now, just add it to the list.
          // This should be replaced by something that loops over all created map objects and picks those that are under the cursor.
          var mapObjectIndex = -1
          if (clickedMapObject) {
            var clickedFeature = { ...clickedMapObject.feature }
            clickedFeature._data_type = clickedFeature.dataType
            clickedFeature.object_id = clickedFeature.objectId
            clickedFeature.network_node_object_id = clickedFeature.networkObjectId
            clickedFeature.is_deleted = false
            results.push(clickedFeature)
            mapObjectIndex = results.length - 1
          }

          var menuItems = []
          var menuItemsById = {}
          var allMenuPromises = []
          var locationConnectors = []

          results.forEach((result, iResult) => {
            // populate context menu aray here
            // we may need different behavour for different controllers using this
            const featureType = this.utils.getFeatureMenuItemType(result)

            if (result.hasOwnProperty('object_id')) result.objectId = result.object_id
            var validFeature = false

            // have we already added this one?
            if ((featureType === MenuItemTypes.EQUIPMENT || featureType === MenuItemTypes.BOUNDARY) &&
              !menuItemsById.hasOwnProperty(result.objectId)) {
              validFeature = this.filterFeatureForSelection(result)
            }

            // If this feature is part of an open transaction AND we have clicked on vector tiles (not map objects), do not show the menu
            const checkInTransaction = (iResult !== mapObjectIndex)
            if (checkInTransaction) {
              const featureIsInTransaction = this.transactionFeatures[result.objectId]
              validFeature = validFeature && !featureIsInTransaction
            }

            if (validFeature) {
              var feature = result
              menuItemsById[feature.objectId] = true
              var name = this.utils.getFeatureDisplayName(feature, this.state)
              var thisFeatureMenuPromise = this.getEquipmentContextMenuOptions(feature, latLng)
                .then(options => menuItems.push(new MenuItem(featureType, name, options, feature)))

              allMenuPromises = allMenuPromises.concat(thisFeatureMenuPromise)
              if (feature._data_type === 'equipment.location_connector') {
                locationConnectors.push(feature)
              }
            }
          })
          if (locationConnectors.length > 1) {
            // If we have multiple location connectors, add a menu item that will allow us to merge them
            const mergeLocationConnectors = new MenuAction(MenuActionTypes.MERGE_LOCATION_CONNECTORS, () => {
              var mergeResult = Promise.resolve()
              locationConnectors.forEach((locationConnector, lcIndex) => {
                mergeResult = mergeResult.then(() => {
                  const editPromise = this.editExistingFeature(locationConnector, latLng, false)
                  return editPromise
                })
                  .then(() => {
                    return Promise.resolve()
                  })
              })
              mergeResult
                .then(() => {
                  this.onObjectKeyClicked && this.onObjectKeyClicked({ features: locationConnectors.slice(0, locationConnectors.length - 1), latLng: latLng })
                  this.mergeSelectedEquipment && this.mergeSelectedEquipment()
                })
                .catch(err => console.error(err))
            })
            menuItems.push(new MenuItem(MenuItemTypes.EQUIPMENT, `${locationConnectors.length} Location Connectors`, [mergeLocationConnectors], locationConnectors))
          }
          Promise.all(allMenuPromises)
            .then(() => {
              if (menuItems.length <= 0) {
                this.closeContextMenu()
              } else {
                this.openContextMenu(x, y, menuItems)
              }
            })
            .catch(err => console.error(err))
        })
    } else if (this.featureType == 'serviceArea') {
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

          if (results.length == 0) {
            var options = []
            options.push(new MenuAction(MenuActionTypes.ADD_BOUNDARY, () => this.startDrawingBoundaryForSA(latLng)))
            var name = 'Add Service Area'
            menuItems.push(new MenuItem(MenuItemTypes.SERVICE_AREA, name, options))
          } else {
            results.forEach((result) => {
            // populate context menu aray here
            // we may need different behavour for different controllers using this
              var options = []
              const featureType = this.utils.getFeatureMenuItemType(result)
              if (result.hasOwnProperty('object_id')) result.objectId = result.object_id
              var validFeature = false

              // have we already added this one?
              if (featureType === MenuItemTypes.SERVICE_AREA &&
                  !menuItemsById.hasOwnProperty(result.objectId)) {
                validFeature = true
              }

              if (validFeature) {
                var feature = result
                if (this.createdMapObjects.hasOwnProperty(result.objectId)) {
                  // it's on the edit layer / in the transaction
                  feature = this.createdMapObjects[result.objectId].feature
                  options.push(new MenuAction(MenuActionTypes.SELECT, () => this.selectProposedFeature(result.objectId)))
                  options.push(new MenuAction(MenuActionTypes.DELETE, () => {
                    this.deleteObjectWithId(result.objectId)
                    this.deleteCreatedMapObject(result.objectId)
                  }))
                } else {
                  options.push(new MenuAction(MenuActionTypes.EDIT, () => this.viewExistingFeature(result, latLng)))
                }

                var name = this.utils.getFeatureDisplayName(result, this.state)

                menuItemsById[result.objectId] = options
                menuItems.push(new MenuItem(MenuItemTypes.SERVICE_AREA, name, options, feature))
              }
            })
          }

          if (menuItems.length <= 0) {
            this.closeContextMenu()
          } else {
            this.openContextMenu(x, y, menuItems)
          }
        })
    } else if (this.featureType === 'location' && this.isFeatureEditable(this.selectedMapObject.feature)) {
      var name = 'Location'
      var options = [ new MenuAction(MenuActionTypes.DELETE, () => {
        var objectId = this.selectedMapObject.objectId
        this.deleteObjectWithId(objectId)
        this.deleteCreatedMapObject(objectId)
      }) ]
      var menuItems = []

      menuItems.push(new MenuItem(MenuItemTypes.LOCATION, name, options, this.selectedMapObject))
      this.openContextMenu(x, y, menuItems)
    }
  }

  getEquipmentContextMenuOptions (feature, latLng) {
    var options = []
    const featureType = this.utils.getFeatureMenuItemType(feature)
    if (this.createdMapObjects.hasOwnProperty(feature.objectId)) {
      // it's on the edit layer / in the transaction
      feature = this.createdMapObjects[feature.objectId].feature
      options.push(new MenuAction(MenuActionTypes.SELECT, () => this.selectProposedFeature(feature.objectId)))
      options.push(new MenuAction(MenuActionTypes.DELETE, () => this.deleteObjectWithId(feature.objectId)))
    } else {
      options.push(new MenuAction(MenuActionTypes.VIEW, () => this.displayViewObject({ feature: feature })))
      // Note that feature.is_locked comes in as a string from the vector tiles
      if (feature.workflow_state_id !== 2) {
        options.push(new MenuAction(MenuActionTypes.EDIT, () => this.editExistingFeature(feature, latLng, false)))
      }
    }

    var menuPromises = [Promise.resolve()]
    if (featureType === MenuItemTypes.EQUIPMENT && this.state.showSiteBoundary) {
      // Site boundaries must be visible for the user to add boundaries to a RT
      const planId = this.state.plan.id
      const selectedBoundaryTypeId = this.state.selectedBoundaryType.id
      menuPromises.push(
        this.$http.get(`/boundary/for_network_node/${planId}/${feature.objectId}/${selectedBoundaryTypeId}`)
          .then(boundaryResult => {
            var allowAddBoundary = this.isBoundaryCreationAllowed({ 'mapObject': feature }) &&
                                   (boundaryResult.data.length === 0) // No results for this combination of planid, object_id, selectedBoundaryTypeId. Allow users to add boundary
            if (allowAddBoundary) {
              options.push(new MenuAction(MenuActionTypes.ADD_BOUNDARY, () => {
                // Create a fake, ephemeral "map object" to fool the downstream functions to start adding or
                // editing the boundary without editing the equipment object itself
                const mockEquipmentMapObject = {
                  objectId: feature.objectId,
                  networkNodeType: feature.networkNodeType || feature._data_type.split('.')[1],  // Contract with aro-service
                  icon: 'HACK to make this.isMarker() think this is a marker and not a polygon :('
                }
                this.startDrawingBoundaryFor(mockEquipmentMapObject)
              }))
            }
            return Promise.resolve()
          })
          .catch(err => {
            console.error(err)
            // Still resolve, we don't want a failure here to prevent the menu from showing up
            return Promise.resolve()
          })
      )
    }
    return Promise.all(menuPromises)
      .then(() => Promise.resolve(options))
  }

  getFeaturesAtPoint (latLng) {
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

  makeIconAnchor (iconUrl, callback) {
    if (typeof callback === 'undefined') callback = {}
    var img = new Image()
    var loadCallBack = (w, h) => {
      this.iconAnchors[iconUrl] = new google.maps.Point(w * 0.5, h * 0.5)
      callback()
    }
    img.addEventListener('load', function () {
      loadCallBack(this.naturalWidth, this.naturalHeight)
    })
    img.src = iconUrl
  }

  setMapObjectIcon (mapObject, iconUrl) {
    if (!this.iconAnchors.hasOwnProperty(iconUrl)) {
      this.makeIconAnchor(iconUrl, () => {
        // mapObject.setIcon({path: google.maps.SymbolPath.CIRCLE, url: iconUrl, anchor: this.iconAnchors[iconUrl]})
        mapObject.setIcon({ url: iconUrl, anchor: this.iconAnchors[iconUrl] })
      })
    } else {
      // mapObject.setIcon({path: google.maps.SymbolPath.CIRCLE, url: iconUrl, anchor: this.iconAnchors[iconUrl]})
      mapObject.setIcon({ url: iconUrl, anchor: this.iconAnchors[iconUrl] })
    }
  }

  handleOnDropped (eventArgs) {
    this.onObjectDroppedOnMarker && this.onObjectDroppedOnMarker(eventArgs)
  }

  // Convert from pixel coordinates to latlngs. https://stackoverflow.com/a/30541162
  pixelToLatlng (xcoor, ycoor) {
    var ne = this.mapRef.getBounds().getNorthEast()
    var sw = this.mapRef.getBounds().getSouthWest()
    var projection = this.mapRef.getProjection()
    var topRight = projection.fromLatLngToPoint(ne)
    var bottomLeft = projection.fromLatLngToPoint(sw)
    var scale = 1 << this.mapRef.getZoom()
    var newLatlng = projection.fromPointToLatLng(new google.maps.Point(xcoor / scale + bottomLeft.x, ycoor / scale + topRight.y))
    return newLatlng
  }

  // Convert from latlng to pixel coordinates. https://stackoverflow.com/a/2692617
  latLngToPixel (latLng) {
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
  getDropTargetCSSForMapObject (mapObject) {
    if (!this.isMarker(mapObject) || !this.isBoundaryCreationAllowed({ 'mapObject': mapObject })) {
      return null
    }
    // Without the 'this.objectIdToDropCSS' cache we get into an infinite digest cycle
    var dropTargetCSS = this.objectIdToDropCSS[mapObject.objectId]
    if (dropTargetCSS) {
      return dropTargetCSS
    }
    const radius = 50 // Pixels
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
    return dropTargetCSS
  }

  createMapObjects (features) {
    // "features" is an array that comes directly from aro-service. Create map objects for these features
    features.forEach((feature) => {
      this.createMapObject(feature, feature.iconUrl, false) // Feature is not created using a map click
    })
  }

  isFeatureEditable (feature) {
    if (feature.workflow_state_id || feature.workflowState) {
      // The marker is editable if the state is not LOCKED or INVALIDATED
      // Vector tile features come in as "workflow_state_id", transaction features as "workflowState"
      var workflowStateId = feature.workflow_state_id || WorkflowState[feature.workflowState].id
      return !((workflowStateId & WorkflowState.LOCKED.id) ||
              (workflowStateId & WorkflowState.INVALIDATED.id))
    } else {
      return true // New objects are always editable
    }
  }

  createPointMapObject (feature, iconUrl) {
    // Create a "point" map object - a marker
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = this.isFeatureEditable(feature)
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
        color: '#000000',
        fontSize: '46px'
      },
      draggable: isEditable, // Allow dragging only if feature is not locked
      clickable: true, // if it's an icon we can select it then the panel will tell us it's locked
      map: this.mapRef,
      optimized: !ARO_GLOBALS.MABL_TESTING,
    })

    if (!isEditable) {
      // Vector tile features come in as "workflow_state_id", transaction features as "workflowState"
      var workflowStateId = feature.workflow_state_id || WorkflowState[feature.workflowState].id
      if (workflowStateId & WorkflowState.LOCKED.id) {
        var lockIconOverlay = new google.maps.Marker({
          icon: {
            url: this.state.configuration.locationCategories.entityLockIcon,
            anchor: new google.maps.Point(12, 24)
          },
          clickable: false,
          map: this.mapRef,
          optimized: !ARO_GLOBALS.MABL_TESTING,
        })
        lockIconOverlay.bindTo('position', mapMarker, 'position')
        this.createdMapObjects[`${feature.objectId}_lockIconOverlay`] = lockIconOverlay
      }
      if (workflowStateId & WorkflowState.INVALIDATED.id) {
        var lockIconOverlay = new google.maps.Marker({
          icon: {
            url: this.state.configuration.locationCategories.entityInvalidatedIcon,
            anchor: new google.maps.Point(12, 8)
          },
          clickable: false,
          map: this.mapRef,
          optimized: !ARO_GLOBALS.MABL_TESTING,
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
    if (!feature.hasOwnProperty('dataType')) feature.dataType = 'equipment.' + feature.networkNodeType

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

      return (markerLng + w >= lng && lng >= markerLng - w &&
          markerLat + h >= lat && lat >= markerLat - h)
    }

    return mapMarker
  }

  // ToDo: I think we should treat all polygons as multiPolygons
  createPolygonMapObject (feature) {
    // Create a "polygon" map object
    this.tileDataService.addFeatureToExclude(feature.objectId)
    var polygonPath = []
    feature.geometry.coordinates[0].forEach((polygonVertex) => {
      polygonPath.push({
        lat: polygonVertex[1], // Note array index
        lng: polygonVertex[0] // Note array index
      })
    })

    var lastI = polygonPath.length - 1
    if (polygonPath[0].lat === polygonPath[lastI].lat && polygonPath[0].lng === polygonPath[lastI].lng) {
      polygonPath.pop()
    }
    
    var polygon = new google.maps.Polygon({
      objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPath,
      clickable: true,
      draggable: false,
      map: this.mapRef
    })
    polygon.setOptions(this.polygonOptions)

    // ToDo: this needs to be fixed by having a standard object model for features
    if (!feature.hasOwnProperty('dataType')) feature.dataType = 'equipment_boundary'

    polygon.feature = feature

    polygon.hitTest = (latLng) => {
      if (!this.state.showSiteBoundary) return false
      return google.maps.geometry.poly.containsLocation(latLng, polygon)
    }
    return polygon
  }

  // ToDo: I think we should treat all polygons as multiPolygons
  createMultiPolygonMapObject (feature) {
    // Create a "polygon" map object
    this.tileDataService.addFeatureToExclude(feature.objectId)
    var polygonPaths = []
    feature.geometry.coordinates.forEach(path => {
      var dPath = []
      path[0].forEach(polygonVertex => {
        dPath.push({
          lat: polygonVertex[1], // Note array index
          lng: polygonVertex[0] // Note array index
        })
      })

      var lastI = dPath.length - 1
      if (dPath[0].lat === dPath[lastI].lat && dPath[0].lng === dPath[lastI].lng) {
        dPath.pop()
      }
      
      polygonPaths.push(dPath)
    })
    var polygon = new google.maps.Polygon({
      objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPaths,
      clickable: true,
      draggable: false,
      map: this.mapRef
    })
    polygon.setOptions(this.polygonOptions)

    polygon.feature = feature

    return polygon
  }

  // Return true if the given path is a closed path
  isClosedPath (path) {
    const firstPoint = path.getAt(0)
    const lastPoint = path.getAt(path.length - 1)
    const deltaLat = Math.abs(firstPoint.lat() - lastPoint.lat())
    const deltaLng = Math.abs(firstPoint.lng() - lastPoint.lng())
    const TOLERANCE = 0.0001
    return (deltaLat < TOLERANCE) && (deltaLng < TOLERANCE)
  }

  createEditableExistingMapObject (feature, iconUrl, isMult) {
    return this.createMapObject(feature, iconUrl, true, true, true, isMult)
  }

  createMapObject (feature, iconUrl, usingMapClick, existingObjectOverride, deleteExistingBoundary, isMult) {
    if (typeof existingObjectOverride === 'undefined') {
      existingObjectOverride = false
    }
    var mapObject = null
    if (feature.geometry.type === 'Point') {
      var canCreateObject = this.checkCreateObject && this.checkCreateObject({ feature: feature, usingMapClick: usingMapClick })
      if (canCreateObject) {
        // if an existing object just show don't edit
        if (feature.isExistingObject && !existingObjectOverride) {
          this.displayViewObject({ feature: feature })
          this.selectMapObject(null)
          return
        }
        mapObject = this.createPointMapObject(feature, iconUrl)
        // Set up listeners on the map object
        mapObject.addListener('dragend', (event) => this.onModifyObject && this.onModifyObject({ mapObject }))
        mapObject.addListener('click', (event) => {
          if (this.state.isShiftPressed) {
            var features = [feature]
            this.onObjectKeyClicked && this.onObjectKeyClicked({features: features, latLng: event.latLng})
            return
          }
          // Select this map object
          this.selectMapObject(mapObject)
        })
      } else {
        return
      }
    } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      // if closed path, prune
      if (feature.geometry.type === 'Polygon') {
        mapObject = this.createPolygonMapObject(feature)
        google.maps.event.addListener(mapObject, 'dragend', function () {
          self.modifyObject(mapObject)
        })
      } else if (feature.geometry.type === 'MultiPolygon') {
        mapObject = this.createMultiPolygonMapObject(feature)
      }

      // Set up listeners on the map object
      mapObject.addListener('click', (event) => {
        // Select this map object
        this.selectMapObject(mapObject)
      })
      var self = this
      mapObject.getPaths().forEach(function (path, index) {
        var isClosed = self.isClosedPath(path)
        
        google.maps.event.addListener(path, 'insert_at', function () {
          self.modifyObject(mapObject)
        })
        google.maps.event.addListener(path, 'remove_at', function () {
          self.modifyObject(mapObject)
        })
        google.maps.event.addListener(path, 'set_at', function () {
          // if (!self.isClosedPath(path)) {
          if (isClosed) {
            // IMPORTANT to check if it is already a closed path, otherwise we will get into an infinite loop when trying to keep it closed
            if (index === 0) {
              // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
              path.setAt(0, path.getAt(path.length - 1))
              self.modifyObject(mapObject)
            } else if (index === path.length - 1) {
              // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
              path.setAt(path.length - 1, path.getAt(0))
              self.modifyObject(mapObject)
            }
          } else {
            self.modifyObject(mapObject)
          }
        })
      })

      var mapObjectPaths = mapObject.getPath()
      google.maps.event.addListener(mapObject, 'rightclick', event => {
        if (event.vertex === undefined) {
          return
        }
        this.deleteMenu.open(
          this.mapRef,
          mapObjectPaths,
          mapObjectPaths.getAt(event.vertex),
          event.vertex
        )
      })
    } else {
      throw `createMapObject() not supported for geometry type ${feature.geometry.type}`
    }

    mapObject.addListener('rightclick', event => {
      if (typeof event === 'undefined' || typeof event.vertex !== 'undefined') {
        return
      }
      // 'event' contains a MouseEvent which we use to get X,Y coordinates. The key of the MouseEvent object
      // changes with google maps implementations. So iterate over the keys to find the right object.

      if (this.featureType == 'location') {
        this.selectMapObject(mapObject)
      }
      var eventXY = this.getXYFromEvent(event)
      if (!eventXY) {
        return
      }
      this.updateContextMenu(event.latLng, eventXY.x, eventXY.y, mapObject)
    })

    this.createdMapObjects[mapObject.objectId] = mapObject
    if (usingMapClick) this.selectMapObject(mapObject, isMult)
    return this.onCreateObject && this.onCreateObject({ mapObject: mapObject, usingMapClick: usingMapClick, feature: feature, deleteExistingBoundary: !deleteExistingBoundary })
  }

  handleMapEntitySelected (event, isMult) {
    if (!event || !event.latLng) {
      return
    }
    if (typeof isMult === 'undefined') isMult = false
    // filter out equipment and locations already in the list
    // ToDo: should we do this for all types of features?
    var filterArrayByObjectId = (featureList) => {
      let filteredList = []
      for (let i = 0; i < featureList.length; i++) {
        let feature = featureList[i]
        var objectId = feature.objectId || feature.object_id
        if (!objectId ||
            (!this.createdMapObjects.hasOwnProperty(objectId) &&
                !this.createdMapObjects.hasOwnProperty(objectId + '_lockIconOverlay') &&
                !this.createdMapObjects.hasOwnProperty(objectId + '_invalidatedIconOverlay') &&
                this.filterFeatureForSelection(feature)
            )
        ) {
          filteredList.push(feature)
        }
      }
      return filteredList
    }

    var equipmentFeatures = []
    if (event.equipmentFeatures) {
      equipmentFeatures = filterArrayByObjectId(event.equipmentFeatures)
    }

    var locations = []
    if (event.locations) {
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
          feature.locationCategory = serviceFeature.locationCategory
          feature.directlyEditExistingFeature = true
          return Promise.resolve(feature)
        })
    } else if (this.featureType === 'equipment' && equipmentFeatures.length > 0) {
      // The map was clicked on, and there was an equipmentFeature under the cursor
      const clickedObject = this.state.getValidEquipmentFeaturesList(equipmentFeatures)[0] // Filter Deleted equipments
      feature.objectId = feature.objectId || clickedObject.object_id
      feature.isExistingObject = true
      feature.type = clickedObject._data_type // BAD! And now this is being used in multiple places
      feature._data_type = clickedObject._data_type
      feature.deployment_type = clickedObject.deployment_type
      var newSelection = this.state.cloneSelection()
      if (clickedObject._data_type === 'equipment_boundary.select') {
        iconKey = Constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY
        if (clickedObject.workflow_state_id !== 2) {
          this.displayEditObject({ feature: feature })
        } else {
          this.displayViewObject({ feature: feature })
        }
        this.selectMapObject(null)
        newSelection.editable.equipment = {}
        this.state.selection = newSelection
        return
      } else {
        if (clickedObject.workflow_state_id !== 2) {
          this.displayEditObject({ feature: feature, isMult: isMult })
        } else {
          this.displayViewObject({ feature: feature, isMult: isMult })
        }
        return
      }
    } else if (this.featureType === 'serviceArea' && event.hasOwnProperty('serviceAreas') &&
      event.serviceAreas.length > 0 && event.serviceAreas[0].hasOwnProperty('code')) {
      iconKey = Constants.MAP_OBJECT_CREATE_SERVICE_AREA
      var serviceArea = event.serviceAreas[0]
      feature.isExistingObject = true
      // Get the Service area geometry from aro-service
      featurePromise = this.state.StateViewMode.loadEntityList(this.$http, this.state, this.dataItems, 'ServiceAreaView', serviceArea.id, 'id,code,name,sourceId,geom', 'id')
        .then((result) => {
          // check for empty object, reject on true
          if (!result[0] || !result[0].geom) {
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
        return // We do not want to create the map object on click
      }
      feature.objectId = uuidStore.getUUID()
      feature.isExistingObject = false
      featurePromise = Promise.resolve(feature)
    }

    var featureToUse = null
    featurePromise
      .then((result) => {
        featureToUse = result
        // When we are modifying existing objects, the iconUrl to use is provided by the parent control via a function.

        return this.getObjectIconUrl({ objectKey: iconKey, objectValue: featureToUse })
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

  isMarker (mapObject) {
    return mapObject && mapObject.icon
  }

  selectMapObject (mapObject, isMult) {
    if (typeof isMult === 'undefined') isMult = false
    // --- clear mult select?
    // First de-select the currently selected map object (if any)
    if (this.selectedMapObject && !isMult) {
      this.dehighlightMapObject(this.selectedMapObject)
    }

    // then select the map object
    // can be null if we are de-selecting everything
    if (mapObject) {
      this.highlightMapObject(mapObject)
      this.setPlanEditorFeatures(Object.keys(this.createdMapObjects))
    } else {
      this.setPlanEditorFeatures([])
    }

    if (!isMult) this.selectedMapObject = mapObject
    if (mapObject && !this.isMarker(mapObject)) { // If selected mapobject is boundary store the geom
      this.selectedMapObjectPreviousShape[mapObject.objectId] = mapObject.feature.geometry
    }

    this.onSelectObject && this.onSelectObject({ mapObject, isMult })
  }

  highlightMapObject (mapObject) {
    if (this.isMarker(mapObject)) {
      var label = mapObject.getLabel()
      label.color = '#009900'
      mapObject.setLabel(label)
    } else {
      mapObject.setOptions(this.selectedPolygonOptions)
      mapObject.setEditable(true)
    }
  }
  
  dehighlightMapObject (mapObject) {
    if (this.isMarker(mapObject)) {
      var label = mapObject.getLabel()
      label.color = '#000000'
      mapObject.setLabel(label)
    } else {
      mapObject.setOptions(this.polygonOptions)
      mapObject.setEditable(false)
    }
  }

  updateMapObjectPosition (objectId, lat, lng) {
    const mapObject = this.createdMapObjects[objectId]
    if (mapObject) {
      mapObject.setPosition(new google.maps.LatLng(lat, lng))
    }
  }

  removeCreatedMapObjects () {
    // Remove created objects from map
    this.selectMapObject(null)
    Object.keys(this.createdMapObjects).forEach((objectId) => {
      this.createdMapObjects[objectId].setMap(null)
    })
    this.createdMapObjects = {}
  }

  deleteSelectedObject () {
    if (this.selectedMapObject) {
      this.deleteObjectWithId(this.selectedMapObject.objectId)
      this.deleteCreatedMapObject(this.selectedMapObject.objectId)
    }
  }

  deleteObjectWithId (objectId) {
    if (this.selectedMapObject && (this.selectedMapObject.objectId === objectId)) {
      // Deselect the currently selected object, as it is about to be deleted.
      this.selectMapObject(null)
    }
    this.closeContextMenu()
    var mapObjectToDelete = this.createdMapObjects[objectId]
    if (mapObjectToDelete && this.onDeleteObject) {
      return this.onDeleteObject({ mapObject: mapObjectToDelete })
    }
  }

  deleteCreatedMapObject (objectId) {
    var mapObjectToDelete = this.createdMapObjects[objectId]
    if (mapObjectToDelete) {
      mapObjectToDelete.setMap(null)
      delete this.createdMapObjects[objectId]
    }
  }

  startDrawingBoundaryFor (mapObject) {
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
      polygonOptions: this.selectedPolygonOptions
    })
    this.drawing.drawingManager.setMap(this.mapRef)
    var self = this
    google.maps.event.addListener(this.drawing.drawingManager, 'overlaycomplete', function (event) {
      // Create a boundary object using the regular object-creation workflow. A little awkward as we are converting
      // the polygon object coordinates to aro-service format, and then back to google.maps.Polygon() paths later.
      // We keep it this way because the object creation workflow does other things like set up events, etc.
      var feature = {
        objectId: uuidStore.getUUID(),
        geometry: {
          type: 'Polygon',
          coordinates: []
        },
        networkNodeType: mapObject.networkNodeType,
        attributes: {
          network_node_object_id: self.drawing.markerIdForBoundary
        }
      }
      event.overlay.getPaths().forEach((path) => {
        var pathPoints = []
        path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
        pathPoints.push(pathPoints[0]) // Close the polygon
        feature.geometry.coordinates.push(pathPoints)
      })

      // Check if polygon is valid, if valid create a map object
      var isValidPolygon = MapUtilities.isPolygonValid({ type: 'Feature', geometry: feature.geometry })
      isValidPolygon ? self.createMapObject(feature, null, true) : Utilities.displayErrorMessage(self.polygonInvalidMsg)

      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
      // Kill the drawing manager
      self.drawing.drawingManager.setMap(null)
      self.drawing.drawingManager = null
      self.drawing.markerIdForBoundary = null
    })
  }

  startDrawingBoundaryForSA (latLng) {
    if (this.drawing.drawingManager) {
      // If we already have a drawing manager, discard it.
      console.warn('We already have a drawing manager active')
      this.drawing.drawingManager.setMap(null)
      this.drawing.drawingManager = null
    }

    this.drawing.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: this.selectedPolygonOptions
    })
    this.drawing.drawingManager.setMap(this.mapRef)
    var self = this
    google.maps.event.addListener(this.drawing.drawingManager, 'overlaycomplete', function (event) {
      // Create a boundary object using the regular object-creation workflow. A little awkward as we are converting
      // the polygon object coordinates to aro-service format, and then back to google.maps.Polygon() paths later.
      // We keep it this way because the object creation workflow does other things like set up events, etc.
      var feature = {
        objectId: uuidStore.getUUID(),
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[]]
        },
        isExistingObject: false
      }
      event.overlay.getPaths().forEach((path) => {
        var pathPoints = []
        path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
        pathPoints.push(pathPoints[0]) // Close the polygon
        feature.geometry.coordinates[0].push(pathPoints)
      })

      // Check if polygon is valid, if valid create a map object
      var isValidPolygon = MapUtilities.isPolygonValid({ type: 'Feature', geometry: { type: 'Polygon', coordinates: feature.geometry.coordinates[0] } })
      isValidPolygon ? self.createMapObject(feature, null, true) : Utilities.displayErrorMessage(self.polygonInvalidMsg)

      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
      // Kill the drawing manager
      self.drawing.drawingManager.setMap(null)
      self.drawing.drawingManager = null
      self.drawing.markerIdForBoundary = null
    })
  }

  generateHexagonPath (position, radius) {
    var pathPoints = []
    for (var angle = -90; angle < 270; angle += 60) {
      var point = google.maps.geometry.spherical.computeOffset(position, radius, angle)
      pathPoints.push([point.lng(), point.lat()])
    }
    pathPoints.push(pathPoints[0]) // Close the polygon

    return pathPoints
  }

  modifyObject (mapObject) {
    // Check if polygon is valid, if valid modify a map object
    var polygonGeoJsonPath = MapUtilities.polygonPathsToWKT(mapObject.getPaths())
    var isValidPolygon = MapUtilities.isPolygonValid({ type: 'Feature', geometry: polygonGeoJsonPath })

    if (isValidPolygon) {
      this.selectedMapObjectPreviousShape[mapObject.objectId] = polygonGeoJsonPath
      this.onModifyObject && this.onModifyObject({ mapObject })
    } else {
      // display error message & undo last invalid change
      Utilities.displayErrorMessage(this.polygonInvalidMsg)
      mapObject.setMap(null)

      mapObject.feature.geometry = this.selectedMapObjectPreviousShape[mapObject.objectId]

      this.createMapObject(mapObject.feature, null, true, null, true)
    }
  }

  editExistingFeature (clickedObject, latLng, isMultiSelect) {
    var feature = {
      objectId: clickedObject.object_id,
      geometry: {
        type: 'Point',
        coordinates: [latLng.lng(), latLng.lat()]
      },
      type: clickedObject._data_type, // BAD! And now this is being used in multiple places
      _data_type: clickedObject._data_type,
      deployment_type: clickedObject.deployment_type,
      isExistingObject: true
    }
    return this.displayEditObject({ feature: feature, isMult: isMultiSelect })
  }

  $onChanges (changesObj) {
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

  $onDestroy () {
    this.deleteMenu.close()

    if (this.overlayRightClickListener) {
      google.maps.event.removeListener(this.overlayRightClickListener)
      this.overlayRightClickListener = null
    }

    // Remove listener
    google.maps.event.removeListener(this.clickListener)
    this.removeCreatedMapObjects()

    // unsubscribe map click observer
    this.mapFeaturesSelectedEventObserver.unsubscribe()
    this.dragEndEventObserver.unsubscribe()
    this.dragStartEventObserver.unsubscribe()

    // Go back to the default map cursor
    this.mapRef.setOptions({ draggableCursor: null })
    this.unsubscribeRedux()

    // Remove any dragging DOM event listeners
    var mapCanvas = this.$document.find(`#${this.mapContainerId}`)[0]
    mapCanvas.ondragover = null
    mapCanvas.ondrop = null
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems,
      transactionFeatures: reduxState.planEditor.features,
      rIsRulerEnabled: reduxState.toolbar.isRulerEnabled
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setPlanEditorFeatures: objectIds => dispatch(SelectionActions.setPlanEditorFeatures(objectIds)),
    }
  }
}

MapObjectEditorController.$inject = ['$http', '$element', '$compile', '$document', '$timeout', '$ngRedux', 'state', 'tileDataService', 'contextMenuService', 'Utils']

let mapObjectEditor = {
  templateUrl: '/components/common/map-object-editor.html',
  bindings: {
    mapGlobalObjectName: '@',
    mapContainerId: '@', // The HTML element that contains the map
    getObjectIconUrl: '&',
    getObjectSelectedIconUrl: '&',
    modifyingLibraryId: '<', // Can be null, valid only if we are modifying locations
    deleteMode: '<',
    createObjectOnClick: '<',
    // allowBoundaryCreation: '<',
    isBoundaryCreationAllowed: '&',
    hideObjectIds: '<', // A set of IDs that we will suppress visibility for
    featureType: '@',
    onInit: '&',
    checkCreateObject: '&',
    onCreateObject: '&',
    onSelectObject: '&',
    onModifyObject: '&',
    onDeleteObject: '&',
    displayViewObject: '&',
    displayEditObject: '&',
    onObjectDroppedOnMarker: '&',
    onObjectKeyClicked: '&',
    mergeSelectedEquipment: '&',
    registerObjectDeleteCallback: '&', // To be called to register a callback, which will delete the selected object
    registerCreateMapObjectsCallback: '&', // To be called to register a callback, which will create map objects for existing objectIds
    registerRemoveMapObjectsCallback: '&', // To be called to register a callback, which will remove all created map objects
    registerCreateEditableExistingMapObject: '&', // To be called to register a callback, which will create a map object from and existing object
    registerDeleteCreatedMapObject: '&',
    registerSelectProposedFeature: '&',
    registerMapObjectFromEvent: '&',
    registerHighlightMapObject: '&',
    registerDehighlightMapObject: '&',
    registerUpdateMapObjectPosition: '&'
  },
  controller: MapObjectEditorController
}

export default mapObjectEditor
