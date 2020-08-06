import Actions from '../../common/actions'

const defaultState = {
  ARO_CLIENT: 'aro'
}

function setClientId (state, clientId) {
  return { ...state,
    ARO_CLIENT: clientId
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.CONFIGURATION_SET_CLIENT_ID:
      return setClientId(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
