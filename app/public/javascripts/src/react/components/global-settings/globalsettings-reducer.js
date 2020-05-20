import Actions from '../../common/actions'

const defaultState = {
  releaseNotes: null,
  multiFactor:null
}

function setReleaseNotes (state, releaseNotes) {
  return { ...state,
    releaseNotes: releaseNotes
  }
}

function setMultiFactor (state, multiFactor) {
  console.log(multiFactor)
  return { ...state,
    otpStamultiFactortus: multiFactor
  }
}

function globalSettingsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.GLOBAL_SETTINGS_GET_RELEASE_NOTES:
      return setReleaseNotes(state, action.payload)
    case Actions.GLOBAL_SETTINGS_GET_OTP_STATUS:
      return setMultiFactor(state, action.payload)
    default:
      return state
  }
}

export default globalSettingsReducer
