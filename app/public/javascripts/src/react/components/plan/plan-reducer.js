import Actions from '../../common/actions'

const defaultState = {
  activePlan: null,
  dataItems: {},
  haveDataItemsChanged: false,
  uploadDataSources: [],
  defaultPlanCoordinates: {
    zoom: 14,
    latitude: 47.6062, // Seattle, WA by default. For no particular reason.
    longitude: -122.3321, // Seattle, WA by default. For no particular reason.
    areaName: 'Seattle, WA' // Seattle, WA by default. For no particular reason.
  },
  selectedMode: 'HOME',
  isDataSourceEditable: {},
  isResourceSelection: false,
  parentProjectForNewProject: null,
  selectedProjectId: ''
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

function setAllLibraryItemsAdd (state, dataItemKey, newLibraryItem) {
  let allLibraryItems = state.dataItems[dataItemKey].allLibraryItems
  allLibraryItems = allLibraryItems.concat(newLibraryItem)

  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[dataItemKey],
        allLibraryItems: allLibraryItems
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

function setResourceItems (state, resourceItems, pristineResourceItems) {
  return { ...state,
    resourceItems: resourceItems,
    pristineResourceItems: pristineResourceItems
  }
}

function setIsResourceSelection (state, status) {
  return { ...state,
    isResourceSelection: status
  }
}

function setIsDataSelection (state, status) {
  return { ...state,
    isDataSelection: status
  }
}

function setAllProject (state, allProjects, parentProjectForNewProject) {
  return { ...state,
    allProjects: allProjects,
    parentProjectForNewProject: parentProjectForNewProject
  }
}

function setselectedProjectId (state, selectedProjectId) {
  return { ...state,
    selectedProjectId: selectedProjectId
  }
}

function setIsDeleting (state, status) {
  return { ...state,
    isDeleting: status
  }
}

function setProjectMode (state, selectedMode) {
  return { ...state,
    selectedMode: selectedMode
  }
}

function setIsDataSourceEditable (state, isDataSourceEditable) {
  return { ...state,
    isDataSourceEditable: isDataSourceEditable
  }
}

function setParentProjectForNewProject (state, parentProjectForNewProject) {
  return { ...state,
    parentProjectForNewProject: parentProjectForNewProject,
  }
}

// ToDo: I think this the coords of current map view not defaultPlanCoordinates
function updateDefaultPlanCoordinates (state, coordinates) {  
  let defaultPlanCoordinates = {}
  if(coordinates.center_changed){
    defaultPlanCoordinates['latitude'] = coordinates.center_changed.lat()
    defaultPlanCoordinates['longitude'] = coordinates.center_changed.lng()
    defaultPlanCoordinates['zoom'] = state.defaultPlanCoordinates.zoom
  } else if(coordinates.zoom_changed) {
    defaultPlanCoordinates['latitude'] = state.defaultPlanCoordinates.latitude
    defaultPlanCoordinates['longitude'] = state.defaultPlanCoordinates.longitude
    defaultPlanCoordinates['zoom'] = coordinates.zoom_changed
  }

  return { ...state,
    defaultPlanCoordinates: defaultPlanCoordinates,
  }
}

function editActivePlan (state, plan) {
  return { ...state,
    activePlan: plan
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

    case Actions.PLAN_SET_ALL_LIBRARY_ITEMS_ADD:
      return setAllLibraryItemsAdd(state, action.payload.dataItemKey, action.payload.allLibraryItems)  

    case Actions.PLAN_APPEND_ALL_LIBRARY_ITEMS:
      return appendAllLibraryItems(state, action.payload.dataItemKey, action.payload.allLibraryItems)

    case Actions.PLAN_SET_HAVE_DATA_ITEMS_CHANGED:
      return setHaveDataItemsChanged(state, action.payload)

    case Actions.PLAN_SET_RESOURCE_ITEMS:
      return setResourceItems(state, action.payload.resourceItems, action.payload.pristineResourceItems) 

    case Actions.PLAN_SET_IS_RESOURCE_SELECTION:
      return setIsResourceSelection(state, action.payload)

    case Actions.PLAN_SET_IS_DATA_SELECTION:
      return setIsDataSelection(state, action.payload)

    case Actions.PLAN_SET_ALL_PROJECT:
      return setAllProject(state, action.payload.allProjects, action.payload.parentProjectForNewProject)

    case Actions.PLAN_SET_SELECTED_PROJECT_ID:
      return setselectedProjectId(state, action.payload)

    case Actions.PLAN_SET_IS_DELETING:
      return setIsDeleting(state, action.payload)

    case Actions.PLAN_SET_PROJECT_MODE:
      return setProjectMode(state, action.payload)

    case Actions.PLAN_SET_IS_DATASOURCE_EDITABLE:
      return setIsDataSourceEditable(state, action.payload)      

    case Actions.PLAN_SET_PARENT_PROJECT_FOR_NEW_PROJECT:
      return setParentProjectForNewProject(state, action.payload) 

    case Actions.PLAN_UPDATE_DEFAULT_PLAN_COORDINATES:
      return updateDefaultPlanCoordinates(state, action.payload)
      
    case Actions.PLAN_EDIT_ACTIVE_PLAN:
      return editActivePlan(state, action.payload)

    default:
      return state
  }
}

export default planReducer
