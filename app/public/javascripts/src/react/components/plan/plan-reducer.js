import Actions from '../../common/actions'

const defaultState = {
  activePlan: null,
  dataItems: {},
  haveDataItemsChanged: false,
  uploadDataSources: [],
  defaultPlanCoordinates:{
    zoom: 14,
    latitude: 47.6062, // Seattle, WA by default. For no particular reason.
    longitude: -122.3321, // Seattle, WA by default. For no particular reason.
    areaName: 'Seattle, WA' // Seattle, WA by default. For no particular reason.
  }
}

// Set the superuser flag for the currently logged in user
function setActivePlan (state, plan) {
  return { ...state, activePlan: plan }
}

function setActivePlanState (state, planState) {
  return { ...state,
    activePlan: { ...state.activePlan,
      planState: planState
    }
  }
}

function setDataItems (state, dataItems, uploadDataSources) {
  return { ...state,
    dataItems: dataItems,
    haveDataItemsChanged: false,
    uploadDataSources: uploadDataSources
  }
}

function setSelectedDataItems (state, dataItemKey, selectedLibraryItems) {
  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[dataItemKey],
        selectedLibraryItems: [].concat(selectedLibraryItems)
      }
    },
    haveDataItemsChanged: true
  }
}

function setAllLibraryItems (state, dataItemKey, allLibraryItems) {
  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[dataItemKey],
        allLibraryItems: [].concat(allLibraryItems)
      }
    },
    haveDataItemsChanged: true
  }
}

function appendAllLibraryItems (state, dataItemKey, allLibraryItems) {
  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[dataItemKey],
        allLibraryItems: [ ...state.dataItems[dataItemKey].allLibraryItems, ...allLibraryItems ]
      }
    },
    haveDataItemsChanged: true
  }
}

function setHaveDataItemsChanged (state, haveDataItemsChanged) {
  return { ...state,
    haveDataItemsChanged
  }
}

function planReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.PLAN_SET_ACTIVE_PLAN:
      return setActivePlan(state, action.payload.plan)

    case Actions.PLAN_SET_ACTIVE_PLAN_STATE:
      return setActivePlanState(state, action.payload)

    case Actions.PLAN_SET_DATA_ITEMS:
      return setDataItems(state, action.payload.dataItems, action.payload.uploadDataSources)

    case Actions.PLAN_SET_SELECTED_DATA_ITEMS:
      return setSelectedDataItems(state, action.payload.dataItemKey, action.payload.selectedLibraryItems)

    case Actions.PLAN_SET_ALL_LIBRARY_ITEMS:
      return setAllLibraryItems(state, action.payload.dataItemKey, action.payload.allLibraryItems)

    case Actions.PLAN_APPEND_ALL_LIBRARY_ITEMS:
      return appendAllLibraryItems(state, action.payload.dataItemKey, action.payload.allLibraryItems)

    case Actions.PLAN_SET_HAVE_DATA_ITEMS_CHANGED:
      return setHaveDataItemsChanged(state, action.payload)

    default:
      return state
  }
}

export default planReducer
