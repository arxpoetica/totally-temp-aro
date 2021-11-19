import React, { useState, useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import SelectionActions from '../../selection/selection-actions'
import AroHttp from '../../../common/aro-http'
import ToolBarActions from '../../header/tool-bar-actions'
import { viewModePanels, displayModes } from '../constants'
import TileDataService from '../../../../components/tiles/tile-data-service'
import MapUtilities from '../../../../components/common/plan/map-utilities'

const tileDataService = new TileDataService()

export const ServiceLayerEditor = (props) => {

  const [discardChanges, setDiscardChanges] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)

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
  } = props

  useEffect(() => { resumeOrCreateTransaction() }, [])

  const formatServiceLayerForService = (mapObject) => {
    // ToDo: this should use AroFeatureFactory
    var serviceFeature = {
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
    var selectedLibraryItemId = dataItems.service_layer.selectedLibraryItems[0].identifier
    AroHttp.get(`/service/library/transaction`)
      .then((result) => {
        var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItemId)
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
      .then((result) => {
        setDiscardChanges(false)
        setCurrentTransaction(result.data)
      })
      .catch((err) => {
        setDiscardChanges(false)
        selectedDisplayMode(displayModes.VIEW)
        console.warn(err)
      })
  }

  const commitTransaction = () => {
    AroHttp.put(`/service/library/transaction/${currentTransaction.id}`)
      .then((result) => {
        // Transaction has been committed, start a new one
        setDiscardChanges(true)
        setCurrentTransaction(null)
        setDeletedMapObjects([])
        // Do not recreate tiles and/or data cache. That will be handled by the tile invalidation messages from aro-service
        Object.keys(objectIdToMapObject).forEach(objectId => tileDataService.removeFeatureToExclude(objectId))
        // return this.state.loadModifiedFeatures(this.state.plan.id)
        return []
      })
      .then(() => resumeOrCreateTransaction())
      // .then(() => this.state.recreateTilesAndCache())
      .catch((err) => {
        setDiscardChanges(true)
        setCurrentTransaction(null)
        setDeletedMapObjects([])
        // this.state.recreateTilesAndCache()
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
          .then((result) => {
            // Transaction has been discarded, start a new one
            setDiscardChanges(true)
            setCurrentTransaction(null)
            setDeletedMapObjects([])
            // this.state.recreateTilesAndCache()
            return resumeOrCreateTransaction()
          })
          .catch((err) => {
            setDiscardChanges(true)
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
      var serviceLayerFeature = formatServiceLayerForService(selectedMapObject)
      AroHttp.put(`/service/library/transaction/${currentTransaction.id}/features`, serviceLayerFeature)
        .then((result) => {
          const newValues = { ...objectIdToMapObject }
          newValues[selectedMapObject.objectId].isDirty = false
          setObjectIdToMapObject(newValues)
        })
        .catch((err) => console.error(err))
    }
  }

  console.log(selectedMapObject, objectIdToMapObject)

  return (
    <div style={{ margin: '10px' }}>
      {/* Buttons to commit or discard a transaction */}
      <div className="text-center">
        <div className="btn-group ">
          <button className="btn btn-light" onClick={() => commitTransaction()}><i className="fa fa-check-circle"></i>&nbsp;&nbsp;Commit</button>
          <button className="btn btn-light" onClick={() => discardTransaction()}><i className="fa fa-times-circle"></i>&nbsp;&nbsp;Discard</button>
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
                value={selectedMapObject && selectedMapObject.feature.name}
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
                value={selectedMapObject && selectedMapObject.feature.code}
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
        <div style={{ flex: '0 0 auto' }}>
          <button className="btn btn-light draggable-item-button">
          <img src="/images/map_icons/aro/hexagon.png" />
        </button>
        </div>
      </div>

      <button
        className={`btn btn-block 
        ${(selectedMapObject && Object.keys(objectIdToMapObject).length) && !objectIdToMapObject[selectedMapObject.objectId].isDirty ? 'btn-light' : 'btn-primary' }`}
        style={{ marginTop: '10px' }}
        onClick={() => { saveSelectedServiceAreaProperties() }}
      >
        <i className="fa fa-save"></i>&nbsp;&nbsp;Save service area properties
      </button>

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
})

export default wrapComponentWithProvider(reduxStore, ServiceLayerEditor, mapStateToProps, mapDispatchToProps)
