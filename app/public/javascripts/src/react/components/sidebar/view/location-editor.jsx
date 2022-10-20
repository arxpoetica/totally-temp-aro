import React, { useState, useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import AroHttp from '../../../common/aro-http'
import WorkflowState from '../../../../shared-utils/workflow-state'
import { createSelector } from 'reselect'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import CreatableSelect from 'react-select/creatable'
import SelectionActions from '../../selection/selection-actions'
import LocationMapObjects from './location-map-objects.jsx'
import ViewSettingsActions from '../../view-settings/view-settings-actions'
import TileDataService from '../../../../components/tiles/tile-data-service'
import ToolBarActions from '../../header/tool-bar-actions'
import MapLayerActions from '../../map-layers/map-layer-actions'
import Permissions from '../../../../shared-utils/permissions'
import { viewModePanels, displayModes } from '../constants'
import RxState from '../../../common/rxState'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())
const getLocationTypeToIconUrl = createSelector([getAllLocationLayers], locationLayers => {
  const locationTypeToIcon = {}
  locationLayers.forEach(locationLayer => {
    locationTypeToIcon[locationLayer.categoryKey] = locationLayer.iconUrl
  })
  return locationTypeToIcon
})

class LocationProperties {
  constructor(workflowStateId, locationCategory, numberOfHouseholds, numberOfEmployees) {
    this.locationCategory = locationCategory || 'household'
    this.numberOfHouseholds = numberOfHouseholds || 1
    this.numberOfEmployees = numberOfEmployees || 1
    this.workflowStateId = workflowStateId
    this.isDirty = false
  }
}

const locationTypes = {
  household: 'Households',
  business: 'Businesses',
  celltower: 'Celltowers',
}

const availableAttributesKeyList = ['loop_extended']
const availableAttributesValueList = ['true', 'false']

const tileDataService = new TileDataService()

const formatAttributes = (key) => {
  return [{ value: key, label: key }]
}

const getAttributes = (attribute) => {
  return attribute.map(item => ({ label: item, value: item }))
}

const askUserToConfirmBeforeDelete = (key) => {
  return new Promise((resolve) => {
    swal({
      title: `Delete Attribute?`,
      text: `Are you sure you want to delete "${key}"?`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }, (result) => {
      if (result) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

const rxState = new RxState()

export const LocationEditor = (props) => {

  const [state, setState] = useState({
    currentTransaction: null,
    isCommiting: false,
    locationTypeToAdd: 'household',
    objectIdToProperties: {},
    lastUsedNumberOfHouseholds: 1,
    lastUsedNumberOfEmployees: 1,
    userCanChangeWorkflowState: false,
    deletedFeatures: [],
    isExpandLocAttributes: false,
    attributeOptionsKey: [],
    createMapObjects: [],
    removeMapObjects: false,
  })

  const {
    currentTransaction,
    isCommiting,
    locationTypeToAdd,
    objectIdToProperties,
    lastUsedNumberOfHouseholds,
    lastUsedNumberOfEmployees,
    userCanChangeWorkflowState,
    deletedFeatures,
    isExpandLocAttributes,
    createMapObjects,
    removeMapObjects,
  } = state

  const {
    selectedLibraryItem,
    selectedMapObject,
    locationTypeToIconUrl,
    objectIdToMapObject,
    setObjectIdToMapObject,
    locationLayers,
    ARO_CLIENT,
    setSelectedMapObject,
    deleteLocationWithId,
    loggedInUser,
    activeViewModePanel,
    selectAllLocationLayers,
    clearSelectedLocations,
    cloneSelection,
    setMapSelection,
    setPlanEditorFeatures,
    selectedDisplayMode,
    setDeletedMapObjects,
    mapRef
  } = props

  useEffect(() => {
    resumeOrCreateTransaction()
    ARO_CLIENT === 'frontier' && selectAllLocationLayers(locationLayers)

    return () => {
      Object.keys(objectIdToMapObject).forEach(objectId => tileDataService.removeFeatureToExclude(objectId))
      clearSelectedLocations() // Clear redux selection
      // Clear old state selection
      const newSelection = cloneSelection()
      newSelection.editable.location = {}
      setMapSelection(newSelection)
      mapRef.setOptions({ draggableCursor: null })
    }
  }, [])

  const resumeOrCreateTransaction = () => {
    setState((state) => ({ ...state,
      currentTransaction: null,
      lastUsedNumberOfHouseholds: 1,
      lastUsedNumberOfEmployees: 1,
    }))
    AroHttp.get(`/service/library/transaction`)
    .then((result) => {
      const existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
      if (existingTransactions.length > 0) {
        // We have an existing transaction for this library item. Use it.
        return Promise.resolve({ data: existingTransactions[0] })
      } else {
        // Create a new transaction and return it
        return AroHttp.post('/service/library/transaction', {
          libraryId: selectedLibraryItem.identifier,
          userId: loggedInUser.id
        })
      }
    })
    .then((result) => {
      setState((state) => ({ ...state, currentTransaction: result.data }))
      reloadWorkflowStatePermissions(result.data) // Can continue in parallel, no need to wait for promise
      return AroHttp.get(`/service/library/transaction/${result.data.id}/transaction_features`)
    })
    .then((result) => {
      // We have a list of features. Replace them in the objectIdToProperties map.
      setState((state) => ({ ...state, objectIdToProperties: {} }))
      const objectIdToPropertiesObj = {}
      // Filter out all non-deleted features - we do not want to create map objects for deleted features.
      const features = result.data
      .filter((item) => item.crudAction !== 'delete')
      .map((item) => item.feature)
      setState((state) => ({
        ...state,
        deletedFeatures: result.data.filter((item) => item.crudAction === 'delete'),
        createMapObjects: features
      }))

      // Put the iconUrl in the features list
      features.forEach((item) => item.iconUrl = '/images/map_icons/aro/households_modified.png')

      features.forEach((feature) => {
        const locationProperties = new LocationProperties(WorkflowState[feature.workflowState].id)
        if (feature.attributes.number_of_households) {
          locationProperties.numberOfHouseholds = feature.attributes.number_of_households
        }
        objectIdToPropertiesObj[feature.objectId] = locationProperties
        setState((state) => ({ ...state, objectIdToProperties: objectIdToPropertiesObj }))
        setPlanEditorFeatures(Object.keys(objectIdToPropertiesObj))
      })
    })
    .catch((err) => {
      selectedDisplayMode(displayModes.VIEW)
      console.warn(err)
    })
  }

  const commitTransaction = () => {
    if (!currentTransaction) {
      console.error('No current transaction. We should never be in this state. Aborting commit...')
    }

    setState((state) => ({ ...state, isCommiting: true, removeMapObjects: true }))
    // All modifications will already have been saved to the server. Commit the transaction.
    AroHttp.put(`/service/library/transaction/${currentTransaction.id}`)
      .then((result) => {
        // Transaction has been committed, start a new one
        setState((state) => ({ ...state, isCommiting: false }))
        setDeletedMapObjects([])
        // Do not recreate tiles and/or data cache. That will be handled by the tile invalidation messages from aro-service
        Object.keys(objectIdToMapObject).forEach(objectId => tileDataService.removeFeatureToExclude(objectId))
        resumeOrCreateTransaction()
      })
      .catch((err) => {
        setState((state) => ({ ...state,
          currentTransaction: null,
          isCommiting: false,
        }))
        setDeletedMapObjects([])
        activeViewModePanel(viewModePanels.LOCATION_INFO) // Close out this panel
        console.error(err)
      })
  }

  const discardTransaction = () => {
    swal({
      title: 'Delete transaction?',
      text: `Are you sure you want to delete transaction with ID ${currentTransaction.id} for library ${currentTransaction.libraryName}`,
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, discard',
      cancelButtonText: 'No',
      showCancelButton: true,
      closeOnConfirm: true
    }, (deleteTransaction) => {
      if (deleteTransaction) {
        setState((state) => ({ ...state, removeMapObjects: true }))
        // The user has confirmed that the transaction should be deleted
        AroHttp.delete(`/service/library/transaction/${currentTransaction.id}`)
          .then((result) => {
            // Transaction has been discarded, start a new one
            Object.keys(objectIdToMapObject).forEach(objectId => tileDataService.removeFeatureToExclude(objectId))
            rxState.requestMapLayerRefresh.sendMessage(null)
            setDeletedMapObjects([])
            return resumeOrCreateTransaction()
          })
          .catch((err) => {
            setState((state) => ({ ...state, currentTransaction: null }))
            setDeletedMapObjects([])
            activeViewModePanel('LOCATION_INFO') // Close out this panel
            console.error(err)
          })
      }
    })

  }

  const onChangeLocProp = (event) => {
    const objectIdToPropertiesObj = objectIdToProperties
    let { target: { value, name } } = event
    if (name === 'workflowStateId') {
      value = Number(value)
    }
    objectIdToPropertiesObj[selectedMapObject.objectId][name] = value
    setState((state) => ({ ...state, objectIdToProperties: objectIdToPropertiesObj }))
  }

  const reloadWorkflowStatePermissions = (transaction) => {
    // Make sure that the currently logged in user is allowed to change the workflow state of objects for the current library/transaction.
    setState((state) => ({ ...state, userCanChangeWorkflowState: false }))
    const odataQuery = `/service/odata/UserLibraryViewEntity?$filter=metaDataId eq ${transaction.libraryId} and userId eq ${loggedInUser.id}&$top=1`
    return AroHttp.get(odataQuery)
      .then(result => {
        const libraryViewEntity = result.data[0]
        const workflowStatePermissions = Boolean(libraryViewEntity.permissions & Permissions.RESOURCE_WORKFLOW)
        setState((state) => ({ ...state, userCanChangeWorkflowState: workflowStatePermissions }))
      })
      .catch(err => console.error(err))
  }

  const getWorkflowStateIcon = () => {
    let locationCategory = locationTypeToAdd
    if (selectedMapObject) { locationCategory = objectIdToProperties[selectedMapObject.objectId].locationCategory }
    return locationTypeToIconUrl[locationCategory]
  }

  // Sets the last-used number-of-households property so we can use it for new locations
  const setLastUsedNumberOfHouseholds = (newValue) => {
    setState((state) => ({ ...state, lastUsedNumberOfHouseholds: +newValue < 1 ? 1 : +newValue }))
  }

  // Sets the last-used number-of-employees property so we can use it for new locations
  const setLastUsedNumberOfEmployees = (newValue) => {
    setState((state) => ({ ...state, lastUsedNumberOfEmployees: +newValue < 1 ? 1 : +newValue }))
  }

  // Marks the properties of the selected location as dirty (changed).
  const markSelectedLocationPropertiesDirty = () => {
    if (selectedMapObject) {
      objectIdToProperties[selectedMapObject.objectId].isDirty = true
      setState((state) => ({ ...state, objectIdToProperties }))
    }
  }

  // Saves the properties of the selected location to aro-service
  const saveSelectedLocationAndProperties = () => {
    if (selectedMapObject) {
      const locationObject = formatLocationForService(selectedMapObject.objectId)
      AroHttp.put(`/service/library/transaction/${currentTransaction.id}/features`, locationObject)
        .then((result) => {
          if (result.status === 200) {
            swal({
              title: 'Success',
              text: 'Properties Saved Successfully',
              type: 'success'
            })
          }
          objectIdToProperties[selectedMapObject.objectId].isDirty = false
          setState((state) => ({ ...state, objectIdToProperties }))
        })
        .catch((err) => console.error(err))
    }
  }

  // Formats a location (based on the objectId) so that it can be sent in calls to aro-service
  const formatLocationForService = (objectId) => {
    const mapObject = objectIdToMapObject[objectId]
    const objectProperties = objectIdToProperties[objectId]
    const workflowStateKey = Object.keys(WorkflowState).find(
      key => WorkflowState[key].id === objectProperties.workflowStateId
    )
    const workflowStateName = WorkflowState[workflowStateKey].name

    const featureObj = {
      objectId,
      geometry: {
        type: 'Point',
        coordinates: [mapObject.position.lng(), mapObject.position.lat()] // Note - longitude, then latitude
      },
      attributes: {
        industry_id: '8071'
      },
      dataType: 'location',
      locationCategory: objectProperties.locationCategory,
      workflowState: workflowStateName
    }

    if (objectProperties.locationCategory === 'household') {
      featureObj.attributes.number_of_households = objectProperties.numberOfHouseholds
    } else if (objectProperties.locationCategory === 'business') {
      featureObj.attributes.number_of_employees = objectProperties.numberOfEmployees
    }

    if (!mapObject.feature.hasOwnProperty('attributes')) { mapObject.feature.attributes = {} }

    // featureObj.attributes = mapObject.feature.attributes
    Object.keys(mapObject.feature.attributes).forEach((key) => {
      if (mapObject.feature.attributes[key] !== null && mapObject.feature.attributes[key] !== 'null' &&
        key !== 'number_of_households' && key !== 'number_of_employees') {
        featureObj.attributes[key] = mapObject.feature.attributes[key]
      }
    })

    return featureObj
  }

  const deleteSelectedObject = () => {
    deleteLocationWithId(selectedMapObject.objectId)
  }

  const getFeaturesCount = () => {
    // For this count we should show the deleted features too
    return (Object.keys(objectIdToProperties).length + deletedFeatures.length)
  }

  const expandLocAttributes = () => {
    setState((state) => ({ ...state, isExpandLocAttributes: !isExpandLocAttributes }))
  }

  const changeLocationType = (event) => {
    const { target: { value } } = event
    objectIdToProperties[selectedMapObject.objectId].locationCategory = value
    setState((state) => ({ ...state, objectIdToProperties }))
  }

  const addLocationAttributes = () => {
    const newValues = { ...objectIdToMapObject }
    newValues[selectedMapObject.objectId].feature.attributes['att'] = 'value'
    setObjectIdToMapObject(newValues)
  }

  const editLocationAttributes = (index, updatedKey, updatedVal) => {
     const newValues = { ...objectIdToMapObject }
     const { attributes } = newValues[selectedMapObject.objectId].feature
     if (updatedKey !== Object.keys(attributes)[index]) {
      // delete key and insert updated key,value
      const key = Object.keys(attributes)[index]
      attributes[updatedKey] = attributes[key]
      delete attributes[key]
      setObjectIdToMapObject(newValues)
    } else {
      attributes[updatedKey] = updatedVal
      setObjectIdToMapObject(newValues)
    }
    markSelectedLocationPropertiesDirty()
  }

  const customStyles = {
    singleValue: (provided, state) => ({
      ...provided,
      color: availableAttributesKeyList.indexOf(state.data.value) > -1 ? '#0000FF' : '',
    }),
    placeholder: (styles) => ({
      ...styles,
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    })
  }

  const deleteLocationAttributes = (index, key) => {
    askUserToConfirmBeforeDelete(key)
      .then((okToDelete) => {
        if (okToDelete) {
          markSelectedLocationPropertiesDirty()
          const newValues = { ...objectIdToMapObject }
          const { attributes } = newValues[selectedMapObject.objectId].feature
          const keypairToDelete = Object.keys(attributes)[index]
          delete newValues[selectedMapObject.objectId].feature.attributes[keypairToDelete]
          setObjectIdToMapObject(newValues)
        }
      })
  }

  const loadAttributesFromServer = () => {
    if (selectedMapObject) {
      AroHttp.get(`/service/library/transaction/${currentTransaction.id}/features/${selectedMapObject.objectId}`)
        .then((result) => {
          objectIdToMapObject[selectedMapObject.objectId].feature = result.data
          setObjectIdToMapObject(objectIdToMapObject)
          objectIdToProperties[selectedMapObject.objectId].isDirty = false
          objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds = result.data.attributes.number_of_households || 1
          setState((state) => ({ ...state, objectIdToProperties }))
        })
        .catch((err) => console.error(err))
    }
  }

  const getObjectIconUrl = (locationDetails) => {
    const locationType = locationDetails.objectValue.isExistingObject
      ? locationDetails.objectValue.locationCategory
      : locationTypeToAdd
    let iconUrl = null
    switch (locationType) {
      case 'business':
        iconUrl = '/images/map_icons/aro/businesses_small_selected.png'
        break

      case 'celltower':
        iconUrl = '/images/map_icons/aro/tower.png'
        break

      case 'household':
      default:
        iconUrl = '/images/map_icons/aro/households_modified.png'
        break
    }
    return Promise.resolve(iconUrl)
  }

  const checkCanCreateObject = (feature) => {
    // For frontier client check If households layer is enabled or not, If not enabled don't allow to create a object
    if (ARO_CLIENT === 'frontier' && !feature.isExistingObject) {
      const hhLocationLayer = locationLayers.filter((locationType) => locationType.label === 'Residential')[0]

      if (!hhLocationLayer.checked) {
        swal({
          title: 'Layer is turned off',
          text: 'You are trying to add a location but the layer is currently turned off. Please turn on the location layer and try again.',
          type: 'error'
        })
        return false
      } else {
        return true
      }
    } else {
      return true
    }
  }

  const handleObjectCreated = (mapObject, usingMapClick, feature) => {
    let numberOfHouseholds = lastUsedNumberOfHouseholds // use last used number of locations until commit
    if (feature.locationCategory === 'household' && feature.attributes && feature.attributes.number_of_households) {
      numberOfHouseholds = +feature.attributes.number_of_households
    }
    let numberOfEmployees = lastUsedNumberOfEmployees
    if (feature.locationCategory === 'business' && feature.attributes && feature.attributes.number_of_employees) {
      numberOfEmployees = +feature.attributes.number_of_employees
    }
    let workflowStateId = null
    if (!(feature.workflow_state_id || feature.workflowState)) {
      workflowStateId = WorkflowState.CREATED.id
    } else {
      // workflow_state_id is encoded in vector tile features
      // workflowState is encoded in aro-service features (that do not come in from vector tiles)
      workflowStateId = feature.workflow_state_id || WorkflowState[feature.workflowState].id
    }
    const locationCategory = feature.locationCategory || locationTypeToAdd
    objectIdToProperties[mapObject.objectId] = new LocationProperties(
      workflowStateId, locationCategory, numberOfHouseholds, numberOfEmployees
    )
    setState((state) => ({ ...state, objectIdToProperties }))
    objectIdToMapObject[mapObject.objectId] = mapObject
    setObjectIdToMapObject(objectIdToMapObject)
    const locationObject = formatLocationForService(mapObject.objectId)
    // The marker is editable if the state is not LOCKED or INVALIDATED
    const isEditable = !((workflowStateId & WorkflowState.LOCKED.id) ||
                          (workflowStateId & WorkflowState.INVALIDATED.id))

    if (isEditable) { AroHttp.post(`/service/library/transaction/${currentTransaction.id}/features`, locationObject) }
  }

  const handleSelectedObjectChanged = (mapObject) => {
    if (!isExpandLocAttributes) setSelectedMapObject(mapObject)
  }

  const handleObjectModified = (mapObject) => {
    const locationObject = formatLocationForService(mapObject.objectId)
      AroHttp.post(`/service/library/transaction/${currentTransaction.id}/features`, locationObject)
      .then((result) => {
        objectIdToProperties[mapObject.objectId].isDirty = false
        setState((state) => ({ ...state, objectIdToProperties }))
      })
      .catch((err) => console.error(err))
  }

  const handleObjectDeleted = (mapObject) => {
    setDeletedMapObjects(mapObject)
    AroHttp.delete(`/service/library/transaction/${currentTransaction.id}/features/${mapObject.objectId}`)
  }

  const getDisabled = (value) => {
    if (!userCanChangeWorkflowState) return true 

    const workflowStateId = objectIdToProperties[selectedMapObject.objectId].workflowStateId
    // if state is created don't allow switching to locked or invalidated
    if (workflowStateId ===  WorkflowState.CREATED.id
        && value !== WorkflowState.CREATED.id) return true

    // if state is invalid or locked only allow switching between those options
    if (workflowStateId === WorkflowState.INVALIDATED.id 
        || workflowStateId === WorkflowState.LOCKED.id) {
        if (value === WorkflowState.CREATED.id) return true
    }
    return false
  }

  return (
    <div className="edit-locations">
      <div className="container">
        {
          currentTransaction &&
          <LocationMapObjects
            featureType="location"
            getObjectIconUrl={getObjectIconUrl}
            checkCreateObject={checkCanCreateObject}
            modifyingLibraryId={currentTransaction.libraryId}
            onCreateObject={handleObjectCreated}
            onSelectObject={handleSelectedObjectChanged}
            onModifyObject={handleObjectModified}
            onDeleteObject={handleObjectDeleted}
            createMapObjects={createMapObjects}
            removeMapObjects={removeMapObjects}
          />
        }

        {/* BEGIN section transaction details */}
        {
          currentTransaction &&
          <>
            <div className="row">
              <div className="col-md-12 transaction-details">
                Library <span className="label label-default">{currentTransaction.libraryName}</span>
                <div className="float-right">
                  transaction ID <span className="label label-default">{currentTransaction.id}</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="btn-group ">
                <button
                  className="btn btn-light"
                  onClick={() => commitTransaction()}
                  disabled={isCommiting ? 'disabled' : null}
                >
                  <i className="fa fa-check-circle" />Commit
                </button>
                <button className="btn btn-light" onClick={() => discardTransaction()}>
                  <i className="fa fa-times-circle" />Discard
                </button>
              </div>
            </div>
            <br />
            <div className='btn btn-group'>
              {
                Object.entries(locationTypes).map(([locationType, locationTypeDescription], index) => (
                  <button
                    key={index}
                    type="button"
                    className={`btn ${locationType === locationTypeToAdd ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setState((state) => ({ ...state, locationTypeToAdd: locationType }))}
                  >
                    {locationTypeDescription}
                  </button>
                ))
              }
            </div>
            {
              (selectedMapObject && Object.keys(objectIdToProperties).length)
                && objectIdToProperties.hasOwnProperty(selectedMapObject.objectId) &&
                <div className="location-prop-tbl">
                  <table id="tblLocationProperties" className="table table-sm table-striped">
                    <tbody>
                      <tr>
                        <td>Location type</td>
                        <td>{locationTypes[objectIdToProperties[selectedMapObject.objectId].locationCategory]}</td>
                      </tr>
                      {
                        objectIdToProperties[selectedMapObject.objectId].locationCategory === 'household' &&
                          <tr>
                            <td>Number of locations</td>
                            <td>
                              <input
                                className="form-control"
                                type="text"
                                name="numberOfHouseholds"
                                value={objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds}
                                onChange={(event) => {
                                  onChangeLocProp(event),
                                  markSelectedLocationPropertiesDirty(),
                                  setLastUsedNumberOfHouseholds(
                                    objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds
                                  )
                                }}
                                disabled={
                                  (
                                    (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.LOCKED.id)
                                      || (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.INVALIDATED.id)
                                  ) ? 'disabled' : null
                                }
                              />
                            </td>
                          </tr>
                      }
                      {
                        objectIdToProperties[selectedMapObject.objectId].locationCategory === 'business' &&
                          <tr>
                            <td>Number of employees</td>
                            <td>
                              <input
                                className="form-control"
                                type="text"
                                name="numberOfEmployees"
                                value={objectIdToProperties[selectedMapObject.objectId].numberOfEmployees}
                                onChange={(event) => {
                                  onChangeLocProp(event),
                                  markSelectedLocationPropertiesDirty(),
                                  setLastUsedNumberOfEmployees(
                                    objectIdToProperties[selectedMapObject.objectId].numberOfEmployees
                                  )
                                }}
                                disabled={
                                  (
                                    (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.LOCKED.id)
                                      || (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.INVALIDATED.id)
                                  ) ? 'disabled' : null
                                }
                              />
                            </td>
                          </tr>
                      }
                      <tr>
                        <td className="workflow-state">Workflow state</td>
                        <td>
                          {/* Created */}
                          <input
                            type="radio"
                            className="radiofill"
                            value={1}
                            name='workflowStateId'
                            disabled={getDisabled(WorkflowState.CREATED.id)}
                            checked={objectIdToProperties[selectedMapObject.objectId].workflowStateId === 1}
                            onChange={(event) => {
                              onChangeLocProp(event)
                              markSelectedLocationPropertiesDirty()
                            }}
                          />
                          <span><img src={getWorkflowStateIcon()} className="created" /></span>
                          Created
                          <br />
                          {/* Locked */}
                          <input
                            type="radio"
                            className="radiofill"
                            value={2}
                            name='workflowStateId'
                            disabled={getDisabled(WorkflowState.LOCKED.id)}
                            checked={objectIdToProperties[selectedMapObject.objectId].workflowStateId === 2}
                            onChange={(event) => {
                              onChangeLocProp(event)
                              markSelectedLocationPropertiesDirty()
                            }}
                          />
                          <span>
                            <img
                              className="overlay-lock"
                              src="/images/map_icons/aro/lock_overlay.png"
                            />
                            <img src={getWorkflowStateIcon()} className="overlay-img" />
                          </span>
                          Locked
                          <br />
                          {/* Invalidated */}
                          <input
                            type="radio"
                            className="radiofill"
                            value={4}
                            name='workflowStateId'
                            disabled={getDisabled(WorkflowState.INVALIDATED.id)}
                            checked={objectIdToProperties[selectedMapObject.objectId].workflowStateId === 4}
                            onChange={(event) => {
                              onChangeLocProp(event)
                              markSelectedLocationPropertiesDirty()
                            }}
                          />
                          <span>
                            <img
                              className="overlay-close"
                              src="/images/map_icons/aro/invalidated_overlay.png"
                            />
                            <img src={getWorkflowStateIcon()} className="overlay-img" />
                          </span>
                          Invalidated
                          <br />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <button
                    type="button"
                    className={`
                      save-location-prop
                      btn btn-block
                      ${!objectIdToProperties[selectedMapObject.objectId].isDirty
                        || objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds < 1
                        ? 'btn-light' : ''
                      }
                      ${objectIdToProperties[selectedMapObject.objectId].isDirty
                        && objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds >= 1
                        ? 'btn-primary' : ''
                      }
                    `}
                    disabled={
                      (
                        !objectIdToProperties[selectedMapObject.objectId].isDirty
                        || objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds < 1
                      ) ? 'disabled' : null
                    }
                    onClick={() => saveSelectedLocationAndProperties()}
                  >
                    <i className="fa fa-save" />Save properties
                  </button>
                  {/* Show a delete button if a map object is selected */}
                  <button
                    className="btn btn-block btn-danger delete-location-prop"
                    disabled={
                      (
                        (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.LOCKED.id)
                          || (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.INVALIDATED.id)
                      ) ? 'disabled' : null
                    }
                    onClick={() => deleteSelectedObject()}
                  >
                    <i className="far fa-trash-alt" />Delete selected location
                  </button>
                  <button
                    className="btn btn-block btn-primary"
                    disabled={
                      (
                        (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.LOCKED.id)
                          || (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.INVALIDATED.id)
                      ) ? 'disabled' : null
                    }
                    onClick={() => { setState((state) => ({ ...state, isExpandLocAttributes: true })), loadAttributesFromServer() }}
                  >
                    <i className="fa fa-pencil-alt" />Expand
                  </button>
                </div>
            }
            <br />
            Number of changes in transaction: {getFeaturesCount()}
          </>
        }
      {/* END section transaction details */}
      </div>

      {
        currentTransaction && selectedMapObject && Object.keys(objectIdToProperties).length
          && objectIdToProperties.hasOwnProperty(selectedMapObject.objectId) &&
          <Modal className="edit-loc-modal" isOpen={isExpandLocAttributes} size="md" toggle={expandLocAttributes} backdrop={false}>
            <ModalHeader toggle={expandLocAttributes}>
              Edit Location Attributes - {selectedMapObject.objectId}
            </ModalHeader>
            <ModalBody>
            <table id="tblLocationProperties" className="table table-sm table-striped">
              <tbody>
                  <tr>
                    <td>Location type</td>
                    <td colSpan="2">
                      <select
                        className='form-control'
                        value={objectIdToProperties[selectedMapObject.objectId].locationCategory}
                        onChange={event => changeLocationType(event)}
                      >
                        {
                           Object.entries(locationTypes).map(([locationType, locationTypeDescription], index) => (
                            <option value={locationType} key={locationType}>{locationTypeDescription}</option>
                           ))
                        }
                      </select>
                    </td>
                  </tr>
                  {
                    objectIdToProperties[selectedMapObject.objectId].locationCategory === 'household' &&
                      <tr>
                        <td>Number of locations</td>
                        <td>
                          <input
                            className="form-control"
                            type="text"
                            name="numberOfHouseholds"
                            value={objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds}
                            onChange={(event) => {
                              onChangeLocProp(event),
                              markSelectedLocationPropertiesDirty(),
                              setLastUsedNumberOfHouseholds(
                                objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds
                              )
                            }}
                            disabled={
                              (
                                (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.LOCKED.id)
                                  || (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.INVALIDATED.id)
                              ) ? 'disabled' : null
                            }
                          />
                        </td>
                      </tr>
                  }
                  {
                    objectIdToProperties[selectedMapObject.objectId].locationCategory === 'business' &&
                      <tr>
                        <td>Number of employees</td>
                        <td>
                          <input
                            className="form-control"
                            type="text"
                            name="numberOfEmployees"
                            value={objectIdToProperties[selectedMapObject.objectId].numberOfEmployees}
                            onChange={(event) => {
                              onChangeLocProp(event),
                              markSelectedLocationPropertiesDirty(),
                              setLastUsedNumberOfEmployees(
                                objectIdToProperties[selectedMapObject.objectId].numberOfEmployees
                              )
                            }}
                            disabled={
                              (
                                (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.LOCKED.id)
                                  || (objectIdToProperties[selectedMapObject.objectId].workflowStateId === WorkflowState.INVALIDATED.id)
                              ) ? 'disabled' : null
                            }
                          />
                        </td>
                      </tr>
                  }
                </tbody>
                <tbody>
                  <tr>
                    <td colSpan="3"> Other Attributes: </td>
                  </tr>
                  {
                    objectIdToMapObject[selectedMapObject.objectId].feature.hasOwnProperty('attributes') &&
                    Object.entries(objectIdToMapObject[selectedMapObject.objectId].feature.attributes).map(([key, val], index) => {
                      return val && key !== 'number_of_households' && key !== 'location_category' &&
                        <tr key={index}>
                          <td className="other-attributes">
                            <CreatableSelect
                              placeholder="Create or search a attribute Key"
                              isClearable={false}
                              closeMenuOnSelect={true}
                              components={{ DropdownIndicator: null }}
                              styles={customStyles}
                              value={formatAttributes(key)}
                              options={getAttributes(availableAttributesKeyList)}
                              onChange={(event) => editLocationAttributes(index, event.value, val)}
                            />
                          </td>
                          <td>
                            <CreatableSelect
                              placeholder="Create or search a attribute Value"
                              isClearable={false}
                              closeMenuOnSelect={true}
                              components={{ DropdownIndicator: null }}
                              value={formatAttributes(
                                objectIdToMapObject[selectedMapObject.objectId].feature.attributes[key]
                              )}
                              options={getAttributes(availableAttributesValueList)}
                              onChange={(event) => editLocationAttributes(index, key, event.value)}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteLocationAttributes(index, key)}
                            >
                              <i className="fa fa-trash-alt" />
                            </button>
                          </td>
                        </tr>
                    })
                  }
                </tbody>
              </table>
              <div>
                <button className="btn" onClick={() => addLocationAttributes()}>
                  <i className="fa fa-plus" />
                </button>
              </div>
            </ModalBody>
            <ModalFooter>
            <button
              className={`
                btn ${!objectIdToProperties[selectedMapObject.objectId].isDirty ? 'btn-light' : 'btn-danger'}
              `}
              disabled={!objectIdToProperties[selectedMapObject.objectId].isDirty ? 'disabled' : null}
              onClick={() => expandLocAttributes()}
            >
              <i className="fa fa-undo action-button" />Discard changes
            </button>
            <button
              type="button"
              className={`
                btn
                ${!objectIdToProperties[selectedMapObject.objectId].isDirty
                  || objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds < 1
                  ? 'btn-light' : ''
                }
                ${objectIdToProperties[selectedMapObject.objectId].isDirty
                  && objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds >= 1
                  ? 'btn-primary' : ''
                }
              `}
              disabled={
                (
                  !objectIdToProperties[selectedMapObject.objectId].isDirty
                  || objectIdToProperties[selectedMapObject.objectId].numberOfHouseholds < 1
                ) ? 'disabled' : null
              }
              onClick={() => { expandLocAttributes(), saveSelectedLocationAndProperties() }}
            >
              <i className="fa fa-save action-button" />Save properties
            </button>
            </ModalFooter>
          </Modal>
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
  selectedLibraryItem: state.plan.dataItems.location.selectedLibraryItems[0],
  selectedMapObject: state.selection.selectedMapObject,
  locationTypeToIconUrl: getLocationTypeToIconUrl(state),
  objectIdToMapObject: state.selection.objectIdToMapObject,
  locationLayers: getLocationLayersList(state),
  ARO_CLIENT: state.toolbar.appConfiguration.ARO_CLIENT,
  loggedInUser: state.user.loggedInUser,
  mapRef: state.map.googleMaps,
})

const mapDispatchToProps = (dispatch) => ({
  selectAllLocationLayers: (locationLayers) => {
    locationLayers.forEach((layer) => {
      // First set the visibility of the current layer
      dispatch(MapLayerActions.setLayerVisibility(layer, true))
    })
  },
  clearSelectedLocations: () => dispatch(SelectionActions.setLocations([])),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
  setPlanEditorFeatures: objectIds => dispatch(SelectionActions.setPlanEditorFeatures(objectIds)),
  selectedDisplayMode: displayMode => dispatch(ToolBarActions.selectedDisplayMode(displayMode)),
  setObjectIdToMapObject: objectIdToMapObject => dispatch(SelectionActions.setObjectIdToMapObject(objectIdToMapObject)),
  setSelectedMapObject: mapObject => dispatch(SelectionActions.setSelectedMapObject(mapObject)),
  deleteLocationWithId: objectId => dispatch(ViewSettingsActions.deleteLocationWithId(objectId)),
  activeViewModePanel: displayPanel => dispatch(ToolBarActions.activeViewModePanel(displayPanel)),
  setDeletedMapObjects: (mapObject) => dispatch(ToolBarActions.setDeletedMapObjects(mapObject)),
})

export default wrapComponentWithProvider(reduxStore, LocationEditor, mapStateToProps, mapDispatchToProps)
