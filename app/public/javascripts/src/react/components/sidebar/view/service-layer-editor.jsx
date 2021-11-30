import React, { useState, useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import SelectionActions from '../../selection/selection-actions'
import AroHttp from '../../../common/aro-http'
import ToolBarActions from '../../header/tool-bar-actions'
import { viewModePanels, displayModes } from '../constants'
import TileDataService from '../../../../components/tiles/tile-data-service'
import MapUtilities from '../../../../components/common/plan/map-utilities'
import ServiceLayerMapObjects from './service-layer-map-objects.jsx'
import { constants } from '../../plan-editor/shared'
import DraggableNode from '../../plan-editor/draggable-node.jsx'
import ViewSettingsActions from '../../view-settings/view-settings-actions'

const tileDataService = new TileDataService()

export const ServiceLayerEditor = (props) => {

  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [removeMapObjects, setRemoveMapObjects] = useState(false)

  const {
    dataItems,
    loggedInUser,
    selectedMapObject,
    objectIdToMapObject,
    setSelectedMapObject,
    setObjectIdToMapObject,
    selectedDisplayMode,
    activeViewModePanel,
    setDeletedMapObjects,
    cloneSelection,
    setMapSelection,
    recreateTilesAndCache,
  } = props

  useEffect(() => { resumeOrCreateTransaction() }, [])

  const formatServiceLayerForService = (mapObject) => {
    // ToDo: this should use AroFeatureFactory
    const serviceFeature = {
      objectId: mapObject.feature.objectId,
      dataType: 'service_layer',
      geometry: MapUtilities.multiPolygonPathsToWKT(mapObject.getPaths()),
      attributes: {
        name: mapObject.feature.name,
        code: mapObject.feature.code
      }
    }
    return serviceFeature
  }


  const resumeOrCreateTransaction = () => {
    setCurrentTransaction(null)
    // See if we have an existing transaction for the currently selected location library
    const selectedLibraryItemId = dataItems.service_layer.selectedLibraryItems[0].identifier
    AroHttp.get(`/service/library/transaction`)
      .then((result) => {
        const existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItemId)
        if (existingTransactions.length > 0) {
          // We have an existing transaction for this library item. Use it.
          return Promise.resolve({ data: existingTransactions[0] })
        } else {
          // Create a new transaction and return it
          return AroHttp.post('/service/library/transaction', {
            libraryId: selectedLibraryItemId,
            userId: loggedInUser.id
          })
        }
      })
      .then((result) => { setCurrentTransaction(result.data) })
      .catch((err) => {
        selectedDisplayMode(displayModes.VIEW)
        console.warn(err)
      })
  }

  const commitTransaction = () => {
    AroHttp.put(`/service/library/transaction/${currentTransaction.id}`)
      .then(() => {
        // Transaction has been committed, start a new one
        setCurrentTransaction(null)
        setDeletedMapObjects([])
        setRemoveMapObjects(true)
        // Do not recreate tiles and/or data cache. That will be handled by the tile invalidation messages from aro-service
        Object.keys(objectIdToMapObject).forEach(objectId => tileDataService.removeFeatureToExclude(objectId))
        // return this.state.loadModifiedFeatures(this.state.plan.id)
        return []
      })
      .then(() => resumeOrCreateTransaction())
      .then(() => recreateTilesAndCache(true))
      .catch((err) => {
        setCurrentTransaction(null)
        setDeletedMapObjects([])
        recreateTilesAndCache(true)
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
        // The user has confirmed that the transaction should be deleted
        AroHttp.delete(`/service/library/transaction/${currentTransaction.id}`)
          .then(() => {
            // Transaction has been discarded, start a new one
            setCurrentTransaction(null)
            setDeletedMapObjects([])
            setRemoveMapObjects(true)
            recreateTilesAndCache(true)
            return resumeOrCreateTransaction()
          })
          .catch((err) => {
            setCurrentTransaction(null)
            setDeletedMapObjects([])
            activeViewModePanel(viewModePanels.LOCATION_INFO) // Close out this panel
            console.error(err)
          })
      }
    })
  }

  const onChangeSAProp = (event) => {
    const { target: { value, name } } = event
    const selectedMapObjectObj = selectedMapObject
    selectedMapObjectObj.feature[name] = value
    setSelectedMapObject(selectedMapObjectObj)
  }

  const markSelectedServiceAreaPropertiesDirty = () => {
    if (selectedMapObject) {
      const newValues = { ...objectIdToMapObject }
      newValues[selectedMapObject.objectId].isDirty = true
      setObjectIdToMapObject(newValues)
    }
  }

   // Saves the properties of the selected service area
   const saveSelectedServiceAreaProperties = () => {
    if (selectedMapObject) {
      const serviceLayerFeature = formatServiceLayerForService(selectedMapObject)
      AroHttp.put(`/service/library/transaction/${currentTransaction.id}/features`, serviceLayerFeature)
        .then((result) => {
          const newValues = { ...objectIdToMapObject }
          newValues[selectedMapObject.objectId].isDirty = false
          setObjectIdToMapObject(newValues)
        })
        .catch((err) => console.error(err))
    }
  }

  // Returns a promise that resolves to the iconUrl for a given object id
  const getObjectIconUrl = (eventArgs) => {
    if (eventArgs.objectKey === constants.MAP_OBJECT_CREATE_SERVICE_AREA) {
      // Icon doesn't matter for Service area, just return an empty string
      return Promise.resolve('')
    }
    return Promise.reject(`Unknown object key ${eventArgs.objectKey}`)
  }

  const handleObjectCreated = (mapObject) => {
    objectIdToMapObject[mapObject.objectId] = mapObject
    objectIdToMapObject[mapObject.objectId].isDirty = false
    setObjectIdToMapObject(objectIdToMapObject)

    // Create New SA
    if (!mapObject.feature.isExistingObject) {
      mapObject.feature.name = null
      mapObject.feature.code = null
      const serviceLayerFeature = formatServiceLayerForService(mapObject)
      // send serviceLayer feature to service
      AroHttp.post(`/service/library/transaction/${currentTransaction.id}/features`, serviceLayerFeature)
    }
  }

  const handleSelectedObjectChanged = (mapObject) => {
    if (currentTransaction == null) return
    if (mapObject != null) { updateSelectedState(mapObject) }
    setSelectedMapObject(mapObject)
  }

  const handleObjectModified = (mapObject) => {
    const serviceLayerFeature = formatServiceLayerForService(mapObject)
    AroHttp.put(`/service/library/transaction/${currentTransaction.id}/features`, serviceLayerFeature)
      .catch((err) => console.error(err))
  }

  const updateSelectedState = (selectedFeature) => {
    const newSelection = cloneSelection()
    newSelection.editable.serviceArea = []
    if (typeof selectedFeature !== 'undefined') {
      newSelection.editable.serviceArea[selectedFeature.object_id || selectedFeature.objectId] = selectedFeature
    }
    setMapSelection(newSelection)
  }

  const handleObjectDeleted = (mapObject) => {
    setDeletedMapObjects(mapObject)
    AroHttp.delete(`/service/library/transaction/${currentTransaction.id}/features/${mapObject.objectId}`)
  }

  const checkIsDirty = () => {
    if (selectedMapObject && Object.keys(objectIdToMapObject).length) {
      return !objectIdToMapObject[selectedMapObject.objectId].isDirty ? 'btn-light' : 'btn-primary'
    } return 'btn-light'
  }

  return (
    <div style={{ margin: '10px' }}>
      {/* Buttons to commit or discard a transaction */}
      <div className="text-center">
        <div className="btn-group ">
          <button className="btn btn-light" onClick={() => commitTransaction()}><i className="fa fa-check-circle" />&nbsp;&nbsp;Commit</button>
          <button className="btn btn-light" onClick={() => discardTransaction()}><i className="fa fa-times-circle" />&nbsp;&nbsp;Discard</button>
        </div>
      </div>
      <br />

      <table className="table table-sm table-striped" style={{ marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td>Name</td>
            <td>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Name"
                value={selectedMapObject ? selectedMapObject.feature.name : ''}
                disabled={!selectedMapObject}
                onChange={(event) => {
                  onChangeSAProp(event),
                  markSelectedServiceAreaPropertiesDirty()
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Code</td>
            <td>
              <input
                type="text"
                name="code"
                className="form-control"
                placeholder="Code"
                value={selectedMapObject ? selectedMapObject.feature.code : ''}
                disabled={!selectedMapObject}
                onChange={(event) => {
                  onChangeSAProp(event),
                  markSelectedServiceAreaPropertiesDirty()
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <div className="btn btn-light draggable-item-button" style={{ flex: '0 0 auto' }}>
          <DraggableNode
            icon="/images/map_icons/aro/hexagon.png"
            entityType={constants.DRAG_IS_BOUNDARY}
            entityDetails={constants.MAP_OBJECT_CREATE_SERVICE_AREA}
            label="Drag and Drop"
          />
        </div>
      </div>

      <button
        className={`btn btn-block ${checkIsDirty()}`}
        style={{ marginTop: '10px' }}
        onClick={() => { saveSelectedServiceAreaProperties() }}
      >
        <i className="fa fa-save" />&nbsp;&nbsp;Save service area properties
      </button>

      { currentTransaction
        && <ServiceLayerMapObjects
          featureType="serviceArea"
          getObjectIconUrl={getObjectIconUrl}
          onCreateObject={handleObjectCreated}
          onSelectObject={handleSelectedObjectChanged}
          onModifyObject={handleObjectModified}
          onDeleteObject={handleObjectDeleted}
          removeMapObjects={removeMapObjects}
          createObjectOnClick={false}
        />
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
  selectedMapObject: state.selection.selectedMapObject,
  objectIdToMapObject: state.selection.objectIdToMapObject,
  dataItems: state.plan.dataItems,
  loggedInUser: state.user.loggedInUser,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedMapObject: mapObject => dispatch(SelectionActions.setSelectedMapObject(mapObject)),
  setObjectIdToMapObject: objectIdToMapObject => dispatch(SelectionActions.setObjectIdToMapObject(objectIdToMapObject)),
  setDeletedMapObjects: (mapObject) => dispatch(ToolBarActions.setDeletedMapObjects(mapObject)),
  selectedDisplayMode: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
  activeViewModePanel: displayPanel => dispatch(ToolBarActions.activeViewModePanel(displayPanel)),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
  recreateTilesAndCache: (mapSelection) => dispatch(ViewSettingsActions.recreateTilesAndCache(mapSelection)),
})

export default wrapComponentWithProvider(reduxStore, ServiceLayerEditor, mapStateToProps, mapDispatchToProps)
