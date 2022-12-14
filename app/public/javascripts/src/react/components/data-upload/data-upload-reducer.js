import Actions from '../../common/actions'

const defaultState = {
  conduitSizes: [
    { id: 1, name: 'small', description: 'Small' },
    { id: 2, name: 'medium', description: 'Medium' },
    { id: 3, name: 'large', description: 'Large' }
  ],
  saCreationTypes: [
    { id: 'upload_file', label: 'Upload From File' },
    { id: 'polygon_equipment', label: 'Create Polygon From Equipment' },
    { id: 'draw_polygon', label: 'Draw service areas on map' }
  ],
  spatialEdgeTypes: [],
  cableTypes: [],
  isDataManagement:false,
  isFileUpload:true,
  isUploading:false
}

function setEdgeTypes (state, spatialEdgeTypes) {
  return { ...state,
    spatialEdgeTypes: spatialEdgeTypes
  }
}

function setCableTypes (state, cableTypes) {
  return { ...state,
    cableTypes: cableTypes
  }
}

function setToggleView (state, viewName) {

  if(viewName === 'DataManagement'){
    return { ...state,
      isDataManagement: true,
      isFileUpload: false
    }
  }if(viewName === 'FileUpload'){
    return { ...state,
      isDataManagement: false,
      isFileUpload: true
    }
  }else{
    return { ...state,
      isDataManagement: false,
      isFileUpload: true
    }
  }
}

function setDataSources (state, data) { 
  let allLibraryItems = state.plan.dataItems[data.dataType];
  console.log(allLibraryItems)
  allLibraryItems.push(data.identifier, data.dataType,data.name)
  console.log(allLibraryItems)

  return { ...state,
    dataItems: { ...state.dataItems,
      [dataItemKey]: { ...state.dataItems[data.dataType],
        allLibraryItems: [].concat(allLibraryItems)
      }
    }
  }
}

function setIsUpdating (state, isUploading) {
  return { ...state,
    isUploading: isUploading
  }
}

function dataUploadReducer (state = defaultState, action) {
  switch (action.type) {
    
    case Actions.DATA_UPLOAD_SET_EDGE_TYPE:
      return setEdgeTypes(state, action.payload)

    case Actions.DATA_UPLOAD_SET_CABLE_TYPE:
      return setCableTypes(state, action.payload)
      
    case Actions.DATA_UPLOAD_TOGGLE_VIEW:
      return setToggleView(state, action.payload)

    case Actions.DATA_UPLOAD_UPDATE_DATASOURCES:
      return setDataSources(state, action.payload)

    case Actions.DATA_UPLOAD_SET_IS_UP_LOADING:
      return setIsUpdating(state, action.payload)    
    default:
      return state
  }
}

export default dataUploadReducer
