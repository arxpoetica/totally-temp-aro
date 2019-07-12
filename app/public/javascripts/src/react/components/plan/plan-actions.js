import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'
import RfpActions from '../optimization/rfp/rfp-actions'
import socketManager from '../../../react/common/socket-manager'
import RingEditActions from '../ring-edit/ring-edit-actions'
import AroHttp from '../../common/aro-http'

function setActivePlanState (planState) {
  return {
    type: Actions.PLAN_SET_ACTIVE_PLAN_STATE,
    payload: planState
  }
}

// Loads a plan with the specified plan id from the server, then sets it as the active plan
function loadPlan (planId, userId) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${planId}`)
      .then(result => dispatch(setActivePlan(result.data)))
      .catch(err => console.error(err))
  }
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
              allLibraryItems: []
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
      socketManager.leavePlanRoom(getState().plan.activePlan.id) // leave previous plan

    dispatch({
      type: Actions.PLAN_SET_ACTIVE_PLAN,
      payload: {
        plan: plan
      }
    })

    socketManager.joinPlanRoom(plan.id) // Join new plan

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
  return {
    type: Actions.PLAN_SET_SELECTED_DATA_ITEMS,
    payload: {
      dataItemKey,
      selectedLibraryItems
    }
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

export default {
  setActivePlan,
  setActivePlanState,
  loadPlan,
  selectDataItems,
  setAllLibraryItems
}
