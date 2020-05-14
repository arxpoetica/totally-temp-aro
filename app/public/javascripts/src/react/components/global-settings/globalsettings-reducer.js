import Actions from '../../common/actions'

const defaultState = {
  releaseNotes: null
}

function setReleaseNotes (state, releaseNotes) {
  return { ...state,
    releaseNotes: releaseNotes
  }
}

function globalSettingsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.GLOBAL_SETTINGS_GET_RELEASE_NOTES:
      return setReleaseNotes(state, action.payload)
    default:
      return state
  }
}

export default globalSettingsReducer
