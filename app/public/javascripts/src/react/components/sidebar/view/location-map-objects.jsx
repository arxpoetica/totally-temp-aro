import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import AroHttp from '../../../common/aro-http'
import uuidStore from '../../../../shared-utils/uuid-store'
import SelectionActions from '../..//selection/selection-actions'
import WorkflowState from '../../../../shared-utils/workflow-state'

export const LocationEditor = (props) => {

  const [state, setState] = useState({
    createdMapObjects: {},
  })

  const { createdMapObjects } = state

  const { mapFeatures, modifyingLibraryId, getObjectIconUrl, featureType,
    checkCreateObject, mapRef, onCreateObject, setSelectedMapObject, setObjectIdToMapObject,
    setPlanEditorFeatures, selectedMapObject, onSelectObject, mapObjectsList } = props

  useEffect(() => {
    // Use the cross hair cursor while this control is initialized
    mapRef.setOptions({ draggableCursor: 'crosshair' })
    handleMapEntitySelected(mapFeatures)

  }, [mapFeatures])

  useEffect(() => {
    mapObjectsList && createMapObjectsFN(mapObjectsList)
  }, [mapObjectsList])

  const createMapObject = (feature, iconUrl, usingMapClick, existingObjectOverride, deleteExistingBoundary, isMult)  => {
    if (typeof existingObjectOverride === 'undefined') {
      existingObjectOverride = false
    }
    var mapObject = null
    if (feature.geometry.type === 'Point') {
      var canCreateObject = checkCreateObject(feature)
      if (canCreateObject) {
        // if an existing object just show don't edit
        if (feature.isExistingObject && !existingObjectOverride) {
          this.displayViewObject({ feature: feature })
          selectMapObject(null)
          return
        }
        mapObject = createPointMapObject(feature, iconUrl)
        mapObject.addListener('click', (event) => {
          selectMapObject(mapObject)
        })
      } else {
        return
      }
    } else {
      throw `createMapObject() not supported for geometry type ${feature.geometry.type}`
    }
    createdMapObjects[mapObject.objectId] = mapObject
    setState((state) => ({ ...state, createdMapObjects }))
    setObjectIdToMapObject(createdMapObjects)
    if (usingMapClick) selectMapObject(mapObject, isMult)
    return onCreateObject(mapObject, usingMapClick, feature, !deleteExistingBoundary)
  }

  const createPointMapObject = (feature, iconUrl) => {
    // Create a "point" map object - a marker
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = isFeatureEditable(feature)
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
      map: mapRef
    })

    mapMarker.feature = feature

    return mapMarker
  }

  const handleMapEntitySelected = (event) => {
    if (!event || !event.latLng) {
      return
    }

    // filter out equipment and locations already in the list
    // ToDo: should we do this for all types of features?
    var filterArrayByObjectId = (featureList) => {
      let filteredList = []
      for (let i = 0; i < featureList.length; i++) {
        let feature = featureList[i]
        var objectId = feature.objectId || feature.object_id
        if (!objectId ||
            (!createdMapObjects.hasOwnProperty(objectId) &&
                !createdMapObjects.hasOwnProperty(objectId + '_lockIconOverlay') &&
                !createdMapObjects.hasOwnProperty(objectId + '_invalidatedIconOverlay') &&
                filterFeatureForSelection(feature)
            )
        ) {
          filteredList.push(feature)
        }
      }
      return filteredList
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

    var iconKey = 'MAP_OBJECT_CREATE_KEY_OBJECT_ID'
    var featurePromise = null
    if (featureType === 'location' && locations.length > 0) {
      // The map was clicked on, and there was a location under the cursor
      feature.objectId = locations[0].object_id
      feature.isExistingObject = true
      // A feature is "locked" if the workflow state is LOCKED or INVALIDATED.
      feature.workflow_state_id = locations[0].workflow_state_id
      featurePromise = AroHttp.get(`/service/library/features/${modifyingLibraryId}/${feature.objectId}`)
        .then((result) => {
          var serviceFeature = result.data
          // use feature's coord NOT the event's coords
          feature.geometry.coordinates = serviceFeature.geometry.coordinates
          feature.attributes = serviceFeature.attributes
          feature.locationCategory = serviceFeature.locationCategory
          feature.directlyEditExistingFeature = true
          return Promise.resolve(feature)
        })
    } else {
      feature.objectId = uuidStore.getUUID()
      feature.isExistingObject = false
      featurePromise = Promise.resolve(feature)
    }

    var featureToUse = null
    featurePromise
      .then((result) => {
        featureToUse = result
        // When we are modifying existing objects, the iconUrl to use is provided by the parent control via a function.

        return getObjectIconUrl({ objectKey: iconKey, objectValue: featureToUse })
      })
      .then((iconUrl) => createMapObject(featureToUse, iconUrl, true, featureToUse.directlyEditExistingFeature))
      .catch((err) => console.error(err))
  }

  const isFeatureEditable = (feature) => {
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

  const selectMapObject = (mapObject, isMult) => {
    if (typeof isMult === 'undefined') isMult = false
    // --- clear mult select?
    // First de-select the currently selected map object (if any)
    if (selectedMapObject && !isMult) {
      dehighlightMapObject(selectedMapObject)
    }
    // then select the map object
    // can be null if we are de-selecting everything
    if (mapObject) {
      highlightMapObject(mapObject)
      setPlanEditorFeatures(Object.keys(createdMapObjects))
    } else {
      setPlanEditorFeatures([])
    }

    onSelectObject(mapObject, isMult)
  }

  const highlightMapObject = (mapObject) => {
    if (isMarker(mapObject)) {
      var label = mapObject.getLabel()
      label.color = '#009900'
      mapObject.setLabel(label)
    }
  }

  const dehighlightMapObject = (mapObject) => {
    if (isMarker(mapObject)) {
      var label = mapObject.getLabel()
      label.color = '#000000'
      mapObject.setLabel(label)
    }
  }

  const isMarker = (mapObject) => {
    return mapObject && mapObject.icon
  }

  const createMapObjectsFN = (features) => {
    // "features" is an array that comes directly from aro-service. Create map objects for these features
    features.forEach((feature) => {
      createMapObject(feature, feature.iconUrl, false) // Feature is not created using a map click
    })
  }

  // No UI for this component. It deals with map objects only.
  return null
}

const mapStateToProps = (state) => ({
  mapFeatures: state.selection.mapFeatures,
  mapObjectsList: state.selection.createdMapObjects,
  mapRef: state.map.googleMaps,
  selectedMapObject: state.selection.selectedMapObject,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedMapObject: mapObject => dispatch(SelectionActions.setSelectedMapObject(mapObject)),
  setObjectIdToMapObject: objectIdToMapObject => dispatch(SelectionActions.setObjectIdToMapObject(objectIdToMapObject)),
  setPlanEditorFeatures: objectIds => dispatch(SelectionActions.setPlanEditorFeatures(objectIds)),
})

export default connect(mapStateToProps, mapDispatchToProps)(LocationEditor)
