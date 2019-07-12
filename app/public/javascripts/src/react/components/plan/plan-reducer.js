import Actions from '../../common/actions'

const defaultState = {
  activePlan: null,
  dataItems: {},
  uploadDataSources: []
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
    uploadDataSources: uploadDataSources
  }
}

function setSelectedDataItems (state, dataItemKey, selectedLibraryItems) {
  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[dataItemKey],
        selectedLibraryItems: [].concat(selectedLibraryItems)
      }
    }
  }
}

function setAllLibraryItems (state, dataItemKey, allLibraryItems) {
  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[dataItemKey],
        allLibraryItems: [].concat(allLibraryItems)
      }
    }
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

    default:
      return state
  }
}

export default planReducer
