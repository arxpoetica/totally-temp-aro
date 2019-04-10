import Actions from '../../common/actions'

function setConfiguration (configuration) {
  return { ...configuration }
}

function configurationReducer (state = {}, action) {
  switch (action.type) {
    case Actions.CONFIGURATION_SET_CONFIGURATION:
      return setConfiguration(action.payload)

    default:
      return state
  }
}

export default configurationReducer
