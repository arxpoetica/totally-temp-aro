import Actions from '../../common/actions'

const defaultState = {
  aclByType: {}
}

function setAcl (state, resourceType, resourceId, acl) {
  // multilevel clone or init
  /*
  var newState = { ...state }
  if (!state.aclByType.hasOwnProperty(resourceType)) {
    newState.aclByType[resourceType] = {}
  } else {
    newState.aclByType[resourceType] = { ...state.aclByType[resourceType] }
  }

  if (!state.aclByType.hasOwnProperty(resourceType)) {
    newState.aclByType[resourceType] = {}
  } else {
    newState.aclByType[resourceType] = { ...state.aclByType[resourceType] }
  }

  newState.aclByType[resourceType] = { ...state.aclByType[resourceType] }
  newState[resourceType][resourceId] = { ...state[resourceType] }
  */
  return { ...state,
    aclByType: { ...state.aclByType,
      [resourceType]: { ...state.aclByType[resourceType],
        [resourceId]: acl
      }
    }
  }
}

function aclReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.ACL_SET_ACL:
      return setAcl(state, action.payload.resourceType, action.payload.resourceId, action.payload.acl)

    default:
      return state
  }
}

export default aclReducer
