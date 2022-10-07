/* globals google */
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanEditorActions from './plan-editor-actions'
import WktUtils from '../../../shared-utils/wkt-utils'
import { MultiSelectVertices } from '../common/maps/multiselect-vertices'
import { InvalidBoundaryHandling } from '../common/maps/invalid-boundary-handling'

const invalidBoundaryHandling = new InvalidBoundaryHandling()
let clickOutListener
let deleteKeyListener
let mapObject
let multiSelectVertices
let clearMapObjectOverlay
let finishDeletion

const EquipmentBoundaryMapObjects = props => {

  // any changes to state props should cause a rerender
  const {
    subnets,
    subnetFeatures,
    selectedSubnetId,
    planType,
    googleMaps,
    showContextMenuForBoundary,
    boundaryChange,
    deleteBoundaryVertices,
  } = props

  useEffect(() => {
    if (!selectedSubnetId) {
      clearAll()
      return
    }
    deleteMapObject()
    createMapObject(selectedSubnetId)
    return () => clearAll()
  }, [selectedSubnetId])


  function createMapObject(subnetId, geometry) {
    if (!subnets[subnetId]) return
    const newGeom = geometry || subnets[subnetId].subnetBoundary.polygon
    let isEditable = !subnets[subnetId].subnetBoundary.locked
    isEditable = isEditable && subnetId === selectedSubnetId
    
    if (mapObject) deleteMapObject()

    mapObject = new google.maps.Polygon({
      subnetId, // Not used by Google Maps
      dataType: subnets[subnetId].dataType,
      paths: WktUtils.getGoogleMapPathsFromWKTMultiPolygon(newGeom),
      clickable: false,
      draggable: false,
      editable: isEditable,
      map: googleMaps,
      strokeColor: '#1f7de6',
      strokeWeight: 3,
      fillColor: '#1f7de6',
      fillOpacity: 0.05,
    })
    setupListenersForMapObject(mapObject)
    if (multiSelectVertices) multiSelectVertices.clearMapObjectOverlay()
    multiSelectVertices = new MultiSelectVertices(
      mapObject,
      googleMaps,
      google,
      contextMenuClick,
    )

    if (!invalidBoundaryHandling.stashedMapObjects[mapObject.subnetId]) {
      invalidBoundaryHandling.stashMapObject(mapObject.subnetId, mapObject)
    }
    clearMapObjectOverlay = multiSelectVertices.clearMapObjectOverlay.bind(multiSelectVertices)
    finishDeletion = multiSelectVertices.finishDeletion.bind(multiSelectVertices)
  }

  function deleteMapObject() {
    if (mapObject) {
      mapObject.setMap(null)
      mapObject = null
    }
  }

  function modifyBoundaryShape(mapObject) {
    const [isValidPolygon, validMapObject] = invalidBoundaryHandling.isValidPolygon(
      mapObject.subnetId,
      mapObject,
    )
    const geometry = WktUtils.getWKTMultiPolygonFromGoogleMapPaths(validMapObject.getPaths())
    if (isValidPolygon) {
      boundaryChange(validMapObject.subnetId, geometry)
    } else {
      createMapObject(validMapObject.subnetId, geometry)
    }
  }

  function setupListenersForMapObject(mapObject) {
    mapObject.getPaths().forEach((path, index) => {
      google.maps.event.addListener(path, 'insert_at', () => modifyBoundaryShape(mapObject))
      google.maps.event.addListener(path, 'remove_at', () => modifyBoundaryShape(mapObject))
      google.maps.event.addListener(path, 'set_at', () => modifyBoundaryShape(mapObject))
    })

    mapObject.addListener('contextmenu', event => contextMenuClick(event))
    
    mapObject.addListener('click', event => {
      if (event.vertex) {
        event.domEvent.stopPropagation()
        if (event.domEvent.shiftKey) {
          multiSelectVertices.addOrRemoveMarker(event)
        }
      }
    })

    if (clickOutListener) {
      google.maps.event.removeListener(clickOutListener)
    }
    clickOutListener = googleMaps.addListener('click', event => {
      // Any click that is outside of the polygon will deselect all vertices
      if (multiSelectVertices.mapObjectOverlay.length > 0) clearMapObjectOverlay()
    })
    if (deleteKeyListener) google.maps.event.removeListener(deleteKeyListener)
    deleteKeyListener = google.maps.event.addDomListener(document, 'keydown', (e) => {
      const code = (e.keyCode ? e.keyCode : e.which)
      // 8 = Backspace
      // 46 = Delete
      // Supporting both of these because not all keyboards have a 'delete' key
      if ((code === 8 || code === 46) && multiSelectVertices.mapObjectOverlay.length > 0) {
        // Sort is necessary to ensure that indexes will not be reassigned while deleting more than one vertex.
        const mapObjectOverlayClone = [...multiSelectVertices.mapObjectOverlay]
        // Using mapObject as the argument being passed instead of the one in the parent function is the only way this consistently works.
        deleteBoundaryVertices(mapObject, mapObjectOverlayClone, finishDeletion)
      }
    })
  }
  
  function clearAll() {
    // Clear all markers from map when clearing poly
    if (multiSelectVertices) {
      clearMapObjectOverlay()
    }
    deleteMapObject()
    // Remove global listeners on tear down
    google.maps.event.removeListener(clickOutListener)
    clickOutListener = null
    google.maps.event.removeListener(deleteKeyListener)
    deleteKeyListener = null
  }

  function contextMenuClick(event) {
    let vertexPayload
    const overlay = multiSelectVertices.mapObjectOverlay
    if(overlay.length > 0) {
      const indexOfMarker = multiSelectVertices.markerIndex(event.vertex)
      
      if (event.vertex && indexOfMarker === -1) {
        // Add vertex to array if it doesn't already exist there.
        multiSelectVertices.addMarker(event)
      }
    } else {
      multiSelectVertices.addMarker(event)
    }

    vertexPayload = multiSelectVertices.mapObjectOverlay
    const eventXY = WktUtils.getXYFromEvent(event)
    showContextMenuForBoundary(
      mapObject,
      eventXY.x,
      eventXY.y,
      vertexPayload,
      finishDeletion,
    )
  }

  // no ui for this component. it deals with map objects only.
  return null
}

const mapStateToProps = state => ({
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  transactionFeatures: state.planEditor.features,
  googleMaps: state.map.googleMaps,
  subnets: state.planEditor.subnets,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnetFeatures: state.planEditor.subnetFeatures,
  planType: state.plan.activePlan.planType
})

const mapDispatchToProps = dispatch => ({
  showContextMenuForBoundary: (mapObject, x, y, vertex, callBack) => {
    dispatch(PlanEditorActions.showContextMenuForBoundary(mapObject, x, y, vertex, callBack))
  },
  boundaryChange: (subnetId, geometry) => dispatch(PlanEditorActions.boundaryChange(subnetId, geometry)),
  deleteBoundaryVertices: (mapObjects, vertices, callBack) => {
    dispatch(PlanEditorActions.deleteBoundaryVertices(mapObjects, vertices, callBack))
  },
})

const EquipmentBoundaryMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(EquipmentBoundaryMapObjects)
export default EquipmentBoundaryMapObjectsComponent
