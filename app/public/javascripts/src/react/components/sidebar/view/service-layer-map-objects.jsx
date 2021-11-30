import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { usePrevious } from '../../../common/view-utils.js'
import { dequal } from 'dequal'
import { constants } from '../../plan-editor/shared'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import TileDataService from '../../../../components/tiles/tile-data-service'
import SelectionActions from '../../selection/selection-actions'
import MapUtilities from '../../../../components/common/plan/map-utilities'
import Utilities from '../../../../components/common/utilities'
import MenuItemFeature from '../../context-menu/menu-item-feature'
import MenuItemAction from '../../context-menu/menu-item-action'
import FeatureSelector from '../../../../components/tiles/feature-selector'
import ContextMenuActions from '../../context-menu/actions'
import uuidStore from '../../../../shared-utils/uuid-store'

const tileDataService = new TileDataService()
const utils = new Utilities()

const polygonOptions = {
  strokeColor: '#FF1493',
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: '#FF1493',
  fillOpacity: 0.4,
}

const selectedPolygonOptions = {
  strokeColor: '#000000',
  strokeOpacity: 0.8,
  strokeWeight: 3,
  fillColor: '#FF1493',
  fillOpacity: 0.4,
}

const isMarker = (mapObject) => { mapObject && mapObject.icon }

const polygonInvalidMsg = {
  title: 'Invalid Polygon',
  text: 'Polygon shape is invalid, please try again. Ensure that the polygon is not self-intersecting.',
}

// ----- rightclick menu ----- //
const getXYFromEvent = (event) => {
  let mouseEvent = null
  Object.keys(event).forEach((eventKey) => {
    if (event.hasOwnProperty(eventKey) && (event[eventKey] instanceof MouseEvent)) { mouseEvent = event[eventKey] }
  })
  if (!mouseEvent) { return }
  const x = mouseEvent.clientX
  const y = mouseEvent.clientY
  return { x, y }
}

// Return true if the given path is a closed path
const isClosedPath = (path) => {
  const firstPoint = path.getAt(0)
  const lastPoint = path.getAt(path.length - 1)
  const deltaLat = Math.abs(firstPoint.lat() - lastPoint.lat())
  const deltaLng = Math.abs(firstPoint.lng() - lastPoint.lng())
  const TOLERANCE = 0.0001
  return (deltaLat < TOLERANCE) && (deltaLng < TOLERANCE)
}

const drawing = {
  drawingManager: null,
  markerIdForBoundary: null // The objectId of the marker for which we are drawing the boundary
}

export const ServiceLayerMapObjects = (props) => {

  const [createdMapObjects, setCreatedMapObjects] = useState({})
  const [selectedMapObjectPreviousShape, setSelectedMapObjectPreviousShape] = useState({})

  const {
    mapRef,
    mapFeatures,
    mapLayers,
    isRulerEnabled,
    featureType,
    loadEntityList,
    getObjectIconUrl,
    selectedMapObject,
    onCreateObject,
    onModifyObject,
    onSelectObject,
    onDeleteObject,
    selectSAWithId,
    editSAWithId,
    deleteSAWithId,
    showContextMenu,
    setMapFeatures,
    multiPolygonFeature,
    removeMapObjects,
    objectIdToMapObject,
    showSiteBoundary,
    setSelectedMapObject,
    selectedBoundaryType,
    setContextMenuItems,
    setObjectIdToMapObject,
    setPlanEditorFeatures,
    addServiceArea,
    createObjectOnClick,
  } = props

  const prevMapFeatures = usePrevious(mapFeatures)
  useEffect(() => {
    // Use the cross hair cursor while this control is initialized
    mapRef.setOptions({ draggableCursor: 'crosshair' })
    if (isRulerEnabled) { return } // disable any click action when ruler is enabled
    if (prevMapFeatures && !dequal(prevMapFeatures, mapFeatures)) { handleMapEntitySelected(mapFeatures) }
  }, [mapFeatures])

  useEffect(() => { updateSelectedMapObject(selectedMapObject) }, [selectedMapObject])

  // Select Service Area
  const prevSelectSAWithId = usePrevious(selectSAWithId)
  useEffect(() => {
    if (!dequal(prevSelectSAWithId, selectSAWithId)) { selectProposedFeature(selectSAWithId) }
  }, [selectSAWithId])

  // Edit Service Area
  const prevEditSAWithId = usePrevious(editSAWithId)
  useEffect(() => {
    if (editSAWithId && !dequal(prevEditSAWithId, editSAWithId)) {
      viewExistingFeature(editSAWithId.result, editSAWithId.latLng)
    }
  }, [editSAWithId])

  // Add Service Area
  const prevAddServiceArea = usePrevious(addServiceArea)
  useEffect(() => {
    if (prevAddServiceArea && !dequal(prevAddServiceArea, addServiceArea)) {
      startDrawingBoundaryForSA(addServiceArea)
    }
  }, [addServiceArea])

  useEffect(() => {
    return () => {
      if (overlayRightClickListener) {
        google.maps.event.removeListener(overlayRightClickListener)
        overlayRightClickListener = null
      }
      removeCreatedMapObjects(objectIdToMapObject)
      // Go back to the default map cursor
      mapRef.setOptions({ draggableCursor: null })
    }
  }, [])

  // Delete Service Area
  const prevDeleteSAWithId = usePrevious(deleteSAWithId)
  useEffect(() => {
    if (!dequal(prevDeleteSAWithId, deleteSAWithId)) {
      deleteObjectWithId(deleteSAWithId)
      deleteCreatedMapObject(deleteSAWithId)
    }
  }, [deleteSAWithId])

  // To draw Multi Polygon Feature
  const prevMultiPolygonFeature = usePrevious(multiPolygonFeature)
  useEffect(() => {
    if (prevMultiPolygonFeature && !dequal(prevMultiPolygonFeature, multiPolygonFeature)) {
      createMapObject(multiPolygonFeature, null, true)
    }
  }, [multiPolygonFeature])

  // To Remove Map Objects
  useEffect(() => { removeMapObjects && removeCreatedMapObjects(objectIdToMapObject) }, [removeMapObjects])

  const handleMapEntitySelected = (event) => {
    if (!event || !event.latLng) { return }

    const feature = {
      geometry: {
        type: 'Point',
        coordinates: [event.latLng.lng(), event.latLng.lat()]
      },
      isExistingObject: false,
    }

    let iconKey = constants.MAP_OBJECT_CREATE_KEY_OBJECT_ID
    let featurePromise = null
    if (featureType === 'serviceArea' && event.hasOwnProperty('serviceAreas') &&
      event.serviceAreas.length > 0 && event.serviceAreas[0].hasOwnProperty('code')) {
      iconKey = constants.MAP_OBJECT_CREATE_SERVICE_AREA
      const serviceArea = event.serviceAreas[0]
      feature.isExistingObject = true
      // Get the Service area geometry from aro-service
      featurePromise = loadEntityList('ServiceAreaView', serviceArea.id, 'id,code,name,sourceId,geom', 'id')
        .then((result) => {
          // check for empty object, reject on true
          if (!result[0] || !result[0].geom) {
            return Promise.reject(`object: ${serviceArea.object_id} may have been deleted`)
          }

          const serviceFeature = result[0]
          serviceFeature.objectId = serviceArea.object_id
          serviceFeature.geometry = serviceFeature.geom
          serviceFeature.isExistingObject = true
          return Promise.resolve(serviceFeature)
        })
    } else {
      // The map was clicked on, but there was no location under the cursor.
      // If there is a selected polygon, set it to non-editable
      if (selectedMapObject && !isMarker(selectedMapObject)) {
        selectedMapObject.setEditable(false)
      }
      selectMapObject(null)
      if (!createObjectOnClick) { 
        return // We do not want to create the map object on click
      }
      feature.objectId = uuidStore.getUUID()
      feature.isExistingObject = false
      featurePromise = Promise.resolve(feature)
    }

    let featureToUse = null
    featurePromise
      .then((result) => {
        featureToUse = result
        // When we are modifying existing objects, the iconUrl to use is provided by the parent control via a function.
        return getObjectIconUrl({ objectKey: iconKey, objectValue: featureToUse })
      })
      .then((iconUrl) => createMapObject(featureToUse, iconUrl, true, featureToUse.directlyEditExistingFeature))
      .then(() => {
        // If we are editing an existing polygon object, make it editable
        if (feature.isExistingObject && (iconKey === constants.MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY ||
          iconKey === constants.MAP_OBJECT_CREATE_SERVICE_AREA)) {
            selectedMapObject && selectedMapObject.setEditable(false)
        }
      })
      .catch((err) => console.error(err))
  }

  const createMapObject = (feature, iconUrl, usingMapClick, existingObjectOverride, deleteExistingBoundary, isMult) => {
    if (typeof existingObjectOverride === undefined) { existingObjectOverride = false }

    let mapObject = null
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      // if closed path, prune
      if (feature.geometry.type === 'Polygon') {
        mapObject = createPolygonMapObject(feature)
        google.maps.event.addListener(mapObject, 'dragend', function () {
         modifyObject(mapObject)
        })
      } else if (feature.geometry.type === 'MultiPolygon') {
        mapObject = createMultiPolygonMapObject(feature)
      }

      // Set up listeners on the map object
      mapObject.addListener('click', () => {
        // Select this map object
        selectMapObject(mapObject)
      })
      mapObject.getPaths().forEach(function (path, index) {
        const isClosed = isClosedPath(path)

        google.maps.event.addListener(path, 'insert_at', function () { modifyObject(mapObject) })
        google.maps.event.addListener(path, 'remove_at', function () { modifyObject(mapObject) })
        google.maps.event.addListener(path, 'set_at', function () {
          if (isClosed) {
            // IMPORTANT to check if it is already a closed path,
            // otherwise we will get into an infinite loop when trying to keep it closed
            if (index === 0) {
              // The first point has been moved, move the last point of the polygon (to keep it a valid, closed polygon)
              path.setAt(0, path.getAt(path.length - 1))
              modifyObject(mapObject)
            } else if (index === path.length - 1) {
              // The last point has been moved, move the first point of the polygon (to keep it a valid, closed polygon)
              path.setAt(path.length - 1, path.getAt(0))
              modifyObject(mapObject)
            }
          } else {
            modifyObject(mapObject)
          }
        })
      })

      google.maps.event.addListener(mapObject, 'rightclick', event => {
        if (event.vertex === undefined) { return }
      })
    } else {
      throw `createMapObject() not supported for geometry type ${feature.geometry.type}`
    }

    mapObject.addListener('rightclick', event => {
      if (!event || event.vertex) { return }
      // 'event' contains a MouseEvent which we use to get X,Y coordinates. The key of the MouseEvent object
      // changes with google maps implementations. So iterate over the keys to find the right object.
      const eventXY = getXYFromEvent(event)
      if (!eventXY) { return }
      updateContextMenu(event.latLng, eventXY.x, eventXY.y, mapObject)
    })

    createdMapObjects[mapObject.objectId] = mapObject
    setCreatedMapObjects(createdMapObjects)
    setObjectIdToMapObject(createdMapObjects)
    if (usingMapClick) { selectMapObject(mapObject, isMult) }
    return onCreateObject(mapObject, usingMapClick, feature, !deleteExistingBoundary)
  }

  // ToDo: I think we should treat all polygons as multiPolygons
  const createPolygonMapObject = (feature) => {
    // Create a "polygon" map object
    tileDataService.addFeatureToExclude(feature.objectId)
    const polygonPath = []
    feature.geometry.coordinates[0].forEach((polygonVertex) => {
      polygonPath.push({
        lat: polygonVertex[1], // Note array index
        lng: polygonVertex[0] // Note array index
      })
    })

    const lastI = polygonPath.length - 1
    if (polygonPath[0].lat === polygonPath[lastI].lat && polygonPath[0].lng === polygonPath[lastI].lng) {
      polygonPath.pop()
    }

    const polygon = new google.maps.Polygon({
      objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPath,
      clickable: true,
      draggable: false,
      map: mapRef,
    })
    polygon.setOptions(polygonOptions)

    // ToDo: this needs to be fixed by having a standard object model for features
    if (!feature.hasOwnProperty('dataType')) feature.dataType = 'equipment_boundary'

    polygon.feature = feature

    polygon.hitTest = (latLng) => {
      if (!showSiteBoundary) { return false }
      return google.maps.geometry.poly.containsLocation(latLng, polygon)
    }
    return polygon
  }

  // ToDo: I think we should treat all polygons as multiPolygons
  const createMultiPolygonMapObject = (feature) => {
    // Create a "polygon" map object
    tileDataService.addFeatureToExclude(feature.objectId)
    const polygonPaths = []
    feature.geometry.coordinates.forEach(path => {
      const dPath = []
      path[0].forEach(polygonVertex => {
        dPath.push({
          lat: polygonVertex[1], // Note array index
          lng: polygonVertex[0] // Note array index
        })
      })

      const lastI = dPath.length - 1
      if (dPath[0].lat === dPath[lastI].lat && dPath[0].lng === dPath[lastI].lng) { dPath.pop() }
      polygonPaths.push(dPath)
    })
    const polygon = new google.maps.Polygon({
      objectId: feature.objectId, // Not used by Google Maps
      paths: polygonPaths,
      clickable: true,
      draggable: false,
      map: mapRef,
    })
    polygon.setOptions(polygonOptions)
    polygon.feature = feature
    return polygon
  }

  const selectedMapObjectRef = React.useRef(selectedMapObject)
  const updateSelectedMapObject = (selectedMapObject) => { selectedMapObjectRef.current = selectedMapObject }

  const selectMapObject = (mapObject, isMult) => {
    if (typeof isMult === undefined) { isMult = false }
    const selectedMapObjectCurr = selectedMapObjectRef.current
    // --- clear mult select?
    // First de-select the currently selected map object (if any)
    if (selectedMapObjectCurr && !isMult) { dehighlightMapObject(selectedMapObjectCurr) }
    // then select the map object
    // can be null if we are de-selecting everything
    if (mapObject) {
      highlightMapObject(mapObject)
      setPlanEditorFeatures(Object.keys(createdMapObjects))
    } else {
      setPlanEditorFeatures([])
    }

    if (!isMult) { setSelectedMapObject(mapObject) }
    if (mapObject && !isMarker(mapObject)) { // If selected mapobject is boundary store the geom
      selectedMapObjectPreviousShape[mapObject.objectId] = mapObject.feature.geometry
      setSelectedMapObjectPreviousShape(selectedMapObjectPreviousShape)
    }
    onSelectObject(mapObject, isMult)
  }

  const highlightMapObject = (mapObject) => {
    mapObject.setOptions(selectedPolygonOptions)
    mapObject.setEditable(true)
  }

  const dehighlightMapObject = (mapObject) => {
    mapObject.setOptions(polygonOptions)
    mapObject.setEditable(false)
  }

  const modifyObject = (mapObject) => {
    // Check if polygon is valid, if valid modify a map object
    const polygonGeoJsonPath = MapUtilities.polygonPathsToWKT(mapObject.getPaths())
    const isValidPolygon = MapUtilities.isPolygonValid({ type: 'Feature', geometry: polygonGeoJsonPath })

    if (isValidPolygon) {
      selectedMapObjectPreviousShape[mapObject.objectId] = polygonGeoJsonPath
      onModifyObject(mapObject)
    } else {
      // display error message & undo last invalid change
      Utilities.displayErrorMessage(polygonInvalidMsg)
      mapObject.setMap(null)
      mapObject.feature.geometry = selectedMapObjectPreviousShape[mapObject.objectId]
      createMapObject(mapObject.feature, null, true, null, true)
    }
  }

  const updateContextMenu = (latLng, x, y, clickedMapObject) => {
    if (featureType === 'serviceArea') {
      getFeaturesAtPoint(latLng)
      .then((results) => {
        // We may have come here when the user clicked an existing map object. For now, just add it to the list.
        // This should be replaced by something that loops over all created
        // map objects and picks those that are under the cursor.
        if (clickedMapObject) {
          const clickedFeature = {
            _data_type: 'service_layer',
            object_id: clickedMapObject.objectId,
            is_deleted: false,
          }
          results.push(clickedFeature)
        }

        const menuItems = []
        const menuItemsById = {}

        if (results.length === 0) {
          const options = []
          options.push(new MenuItemAction('ADD_BOUNDARY', 'Add Boundary', 'ViewSettingsActions', 'addServiceArea', latLng))
          menuItems.push(new MenuItemFeature('SERVICE_AREA', 'Add Service Area', options))
        } else {
          results.forEach((result) => {
            // populate context menu aray here
            // we may need different behavour for different controllers using this
            const options = []
            const featureType = utils.getFeatureMenuItemType(result)
            if (result.hasOwnProperty('object_id')) result.objectId = result.object_id
            let validFeature = false

            // have we already added this one?
            if (featureType === 'SERVICE_AREA' && !menuItemsById.hasOwnProperty(result.objectId)) {
              validFeature = true
            }

            if (validFeature) {
              let feature = result
              if (createdMapObjects.hasOwnProperty(result.objectId)) {
                // it's on the edit layer / in the transaction
                feature = createdMapObjects[result.objectId].feature
                options.push(new MenuItemAction('SELECT', 'Select', 'ViewSettingsActions', 'selectServiceArea', result.objectId))
                options.push(new MenuItemAction('DELETE', 'Delete', 'ViewSettingsActions', 'deleteServiceArea', result.objectId))
              } else {
                const editSA = { result, latLng }
                options.push(new MenuItemAction('EDIT', 'Edit', 'ViewSettingsActions', 'editServiceArea', editSA))
              }
              const name = feature.code || feature.siteClli || 'Unnamed service area'
              menuItemsById[result.objectId] = options
              menuItems.push(new MenuItemFeature('SERVICE_AREA', name, options))
            }
          })
        }
        openContextMenu(x, y, menuItems)
      })
    }
  }

  const getFeaturesAtPoint = (latLng) => {
    const lat = latLng.lat()
    const lng = latLng.lng()

    // Get zoom
    const zoom = mapRef.getZoom()

    // Get tile coordinates from lat/lng/zoom. Using Mercator projection.
    const tileCoords = MapUtilities.getTileCoordinates(zoom, lat, lng)

    // Get the pixel coordinates of the clicked point WITHIN the tile (relative to the top left corner of the tile)
    const clickedPointPixels = MapUtilities.getPixelCoordinatesWithinTile(zoom, tileCoords, lat, lng)

    return FeatureSelector.performHitDetection(tileDataService, { width: 256, height: 256 }, mapLayers.activeMapLayers,
      zoom, tileCoords.x, tileCoords.y, clickedPointPixels.x, clickedPointPixels.y, selectedBoundaryType.id)
  }

  const openContextMenu = (x, y, menuItems) => {
    const bounds = []
    const boundsByNetworkNodeObjectId = {}
    menuItems.forEach((menuItem) => {
      const { feature } = menuItem
      if (feature && feature.network_node_object_id) {
        bounds.push(feature)
        boundsByNetworkNodeObjectId[feature.network_node_object_id] = menuItem
      }
    })
    setContextMenuItems(menuItems)
    showContextMenu(x, y)
  }

  const selectProposedFeature = (objectId) => {
    if (!createdMapObjects.hasOwnProperty(objectId)) { return false }
    selectMapObject(createdMapObjects[objectId])
    return true
  }

  const deleteObjectWithId = (objectId) => {
    if (selectedMapObject && (selectedMapObject.objectId === objectId)) {
      // Deselect the currently selected object, as it is about to be deleted.
      selectMapObject(null)
    }
    const mapObjectToDelete = createdMapObjects[objectId]
    if (mapObjectToDelete) { onDeleteObject(mapObjectToDelete) }
  }

  const deleteCreatedMapObject = (objectId) => {
    const mapObjectToDelete = createdMapObjects[objectId]
    if (mapObjectToDelete) {
      mapObjectToDelete.setMap(null)
      delete createdMapObjects[objectId]
      setCreatedMapObjects(createdMapObjects)
    }
  }

  const viewExistingFeature = (feature, latLng) => {
    const hitFeatures = {}
    hitFeatures.latLng = latLng
    if (featureType === 'serviceArea') { hitFeatures.serviceAreas = [feature] }
    setMapFeatures(hitFeatures)
  }

  const removeCreatedMapObjects = (createdMapObjectsObj) => {
    // Remove created objects from map
    selectMapObject(null)
    Object.keys(createdMapObjectsObj).forEach((objectId) => {
      createdMapObjectsObj[objectId].setMap(null)
    })
    setCreatedMapObjects({})
  }

  let overlayRightClickListener = mapRef.addListener('rightclick', (event) => {
    if (featureType === 'serviceArea') {
      const eventXY = getXYFromEvent(event)
      if (!eventXY) return
      updateContextMenu(event.latLng, eventXY.x, eventXY.y, null)
    }
  })

  const startDrawingBoundaryForSA = (latLng) => {
    if (drawing.drawingManager) {
      // If we already have a drawing manager, discard it.
      console.warn('We already have a drawing manager active')
      drawing.drawingManager.setMap(null)
      drawing.drawingManager = null
    }

    drawing.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: selectedPolygonOptions
    })
    drawing.drawingManager.setMap(mapRef)
    google.maps.event.addListener(drawing.drawingManager, 'overlaycomplete', function (event) {
      // Create a boundary object using the regular object-creation workflow. A little awkward as we are converting
      // the polygon object coordinates to aro-service format, and then back to google.maps.Polygon() paths later.
      // We keep it this way because the object creation workflow does other things like set up events, etc.
      const feature = {
        objectId: uuidStore.getUUID(),
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[]]
        },
        isExistingObject: false
      }
      event.overlay.getPaths().forEach((path) => {
        const pathPoints = []
        path.forEach((latLng) => pathPoints.push([latLng.lng(), latLng.lat()]))
        pathPoints.push(pathPoints[0]) // Close the polygon
        feature.geometry.coordinates[0].push(pathPoints)
      })

      // Check if polygon is valid, if valid create a map object
      const isValidPolygon = MapUtilities.isPolygonValid({ type: 'Feature', geometry: { type: 'Polygon', coordinates: feature.geometry.coordinates[0] } })
      isValidPolygon ? createMapObject(feature, null, true) : Utilities.displayErrorMessage(polygonInvalidMsg)

      // Remove the overlay. It will be replaced with the created map object
      event.overlay.setMap(null)
      // Kill the drawing manager
      drawing.drawingManager.setMap(null)
      drawing.drawingManager = null
      drawing.markerIdForBoundary = null
    })
  }

  // No UI for this component. It deals with map objects only.
  return null
}

const mapStateToProps = (state) => ({
  mapFeatures: state.selection.mapFeatures,
  mapRef: state.map.googleMaps,
  isRulerEnabled: state.toolbar.isRulerEnabled,
  dataItems: state.plan.dataItems,
  selectedMapObject: state.selection.selectedMapObject,
  selectedBoundaryType: state.mapLayers.selectedBoundaryType,
  mapLayers: state.mapLayers,
  selectSAWithId: state.viewSettings.selectSAWithId,
  editSAWithId: state.viewSettings.editSAWithId,
  deleteSAWithId: state.viewSettings.deleteSAWithId,
  multiPolygonFeature: state.viewSettings.multiPolygonFeature,
  objectIdToMapObject: state.selection.objectIdToMapObject,
  showSiteBoundary: state.mapLayers.showSiteBoundary,
  addServiceArea: state.viewSettings.addServiceArea,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedMapObject: mapObject => dispatch(SelectionActions.setSelectedMapObject(mapObject)),
  loadEntityList: (entityType, filterObj, select, searchColumn, configuration) => dispatch(
    StateViewModeActions.loadEntityList(entityType, filterObj, select, searchColumn, configuration)
  ),
  setPlanEditorFeatures: objectIds => dispatch(SelectionActions.setPlanEditorFeatures(objectIds)),
  setContextMenuItems: menuItemFeature => dispatch(ContextMenuActions.setContextMenuItems(menuItemFeature)),
  showContextMenu: (x, y) => dispatch(ContextMenuActions.showContextMenu(x, y)),
  setObjectIdToMapObject: objectIdToMapObject => dispatch(SelectionActions.setObjectIdToMapObject(objectIdToMapObject)),
  setMapFeatures: mapFeatures => dispatch(SelectionActions.setMapFeatures(mapFeatures)),
})

export default connect(mapStateToProps, mapDispatchToProps)(ServiceLayerMapObjects)
