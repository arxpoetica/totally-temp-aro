import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'
import RfpActions from '../optimization/rfp/rfp-actions'
import SocketManager from '../../../react/common/socket-manager'
import RingEditActions from '../ring-edit/ring-edit-actions'
import AroHttp from '../../common/aro-http'

function setActivePlanState (planState) {
  return {
    type: Actions.PLAN_SET_ACTIVE_PLAN_STATE,
    payload: planState
  }
}

// Loads a plan with the specified plan id from the server, then sets it as the active plan
function loadPlan (planId) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${planId}`)
      .then(result => dispatch(setActivePlan(result.data)))
      .catch(err => console.error(err))
  }
}

function manageLibrarySubscriptions (currentSelectedLibraryItems, newSelectedLibraryItems) {
  // Subscribe to events from any new library items, unsubscribe from any removed library items
  const currentSelectedLibraryIds = new Set(currentSelectedLibraryItems.map(libraryItem => libraryItem.identifier))
  const newSelectedLibraryIds = new Set(newSelectedLibraryItems.map(libraryItem => libraryItem.identifier))
  const subscriptionsToAdd = [...newSelectedLibraryIds].filter(item => !currentSelectedLibraryIds.has(item))
  const subscriptionsToDelete = [...currentSelectedLibraryIds].filter(item => !newSelectedLibraryIds.has(item))
  subscriptionsToDelete.forEach(libraryId => SocketManager.leaveRoom('library', libraryId))
  subscriptionsToAdd.forEach(libraryId => SocketManager.joinRoom('library', libraryId))
}

function loadPlanDataSelectionFromServer (planId) {
  return dispatch => {
    const promises = [
      AroHttp.get('/service/odata/datatypeentity'),
      AroHttp.get(`/service/v1/library-entry`),
      AroHttp.get(`/service/v1/plan/${planId}/configuration`)
    ]

    Promise.all(promises)
      .then((results) => {
        // Results will be returned in the same order as the promises array
        var dataTypeEntityResult = results[0].data
        var libraryResult = results[1].data
        var configurationResult = results[2].data

        var uploadDataSources = []
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          if (dataTypeEntity.uploadSupported) {
            dataTypeEntity.label = dataTypeEntity.description
            uploadDataSources.push(dataTypeEntity)
          }
        })

        var newDataItems = {}
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          if (dataTypeEntity.maxValue > 0) {
            newDataItems[dataTypeEntity.name] = {
              id: dataTypeEntity.id,
              description: dataTypeEntity.description,
              minValue: dataTypeEntity.minValue,
              maxValue: dataTypeEntity.maxValue,
              uploadSupported: dataTypeEntity.uploadSupported,
              isMinValueSelectionValid: true,
              isMaxValueSelectionValid: true,
              selectedLibraryItems: [],
              allLibraryItems: [],
              proxyFor: dataTypeEntity.proxyFor || null
            }
          }
        })

        // For each data item, construct the list of all available library items
        Object.keys(newDataItems).forEach((dataItemKey) => {
          // Add the list of all library items for this data type
          libraryResult.forEach((libraryItem) => {
            if (libraryItem.dataType === dataItemKey) {
              newDataItems[dataItemKey].allLibraryItems.push(libraryItem)
            }
          })
          newDataItems[dataItemKey].allLibraryItems.sort((a, b) => (a.name.toLowerCase > b.name.toLowerCase) ? -1 : 1)
        })

        // For each data item, construct the list of selected library items
        configurationResult.configurationItems.forEach((configurationItem) => {
          // For this configuration item, find the data item based on the dataType
          var dataItem = newDataItems[configurationItem.dataType]
          // Find the item from the allLibraryItems based on the library id
          var selectedLibraryItems = configurationItem.libraryItems
          selectedLibraryItems.forEach((selectedLibraryItem) => {
            var matchedLibraryItem = dataItem.allLibraryItems.filter((libraryItem) => libraryItem.identifier === selectedLibraryItem.identifier)
            dataItem.selectedLibraryItems = dataItem.selectedLibraryItems.concat(matchedLibraryItem) // Technically there will be only one matched item
          })
        })

        Object.keys(newDataItems).forEach(dataItemKey => {
          const dataItem = newDataItems[dataItemKey]
          manageLibrarySubscriptions([], dataItem.selectedLibraryItems)
        })

        dispatch({
          type: Actions.PLAN_SET_DATA_ITEMS,
          payload: {
            dataItems: newDataItems,
            uploadDataSources: uploadDataSources
          }
        })
      })
      .catch(err => console.error(err))
  }
}

// Set the currently active plan
function setActivePlan (plan) {
  return (dispatch, getState) => {
    getState().plan.activePlan && getState().plan.activePlan.id &&
      SocketManager.leaveRoom('plan', getState().plan.activePlan.id) // leave previous plan

    dispatch({
      type: Actions.PLAN_SET_ACTIVE_PLAN,
      payload: {
        plan: plan
      }
    })

    // Join room for this plan
    SocketManager.joinRoom('plan', plan.id)
    // Get current plan data items
    dispatch(loadPlanDataSelectionFromServer(plan.id))
    // Update details on the coverage report
    dispatch(CoverageActions.updateCoverageStatus(plan.id))
    // Clear plan target selection
    dispatch(SelectionActions.loadPlanTargetSelectionsFromServer(plan.id))
    // Clear RFP state
    dispatch(RfpActions.clearRfpState())
    // load rings
    dispatch(RingEditActions.loadRings(plan.id))
  }
}

function selectDataItems (dataItemKey, selectedLibraryItems) {
  return (dispatch, getState) => {
    manageLibrarySubscriptions(getState().plan.dataItems[dataItemKey].selectedLibraryItems, selectedLibraryItems)
    // Subscriptions taken care of, now set the state
    dispatch({
      type: Actions.PLAN_SET_SELECTED_DATA_ITEMS,
      payload: {
        dataItemKey,
        selectedLibraryItems
      }
    })
  }
}

function setAllLibraryItems (dataItemKey, allLibraryItems) {
  return {
    type: Actions.PLAN_SET_ALL_LIBRARY_ITEMS,
    payload: {
      dataItemKey,
      allLibraryItems
    }
  }
}

function deleteLibraryEntry (dataSource) {
  return (dispatch, getState) => {
    const state = getState()
    const dataType = dataSource.dataType
    const updatedLib = state.plan.dataItems[dataType].allLibraryItems.filter(item => item.identifier !== dataSource.identifier)
    AroHttp.delete(`/service/v1/library-entry/${dataSource.identifier}`)
      .then(() => {
        // wait for success before updating local state, keep in sync
        dispatch(setAllLibraryItems(dataType, updatedLib))
      })
      .catch((err) => console.error(err))
  }
}

export default {
  setActivePlan,
  setActivePlanState,
  loadPlan,
  selectDataItems,
  setAllLibraryItems,
  deleteLibraryEntry
}
