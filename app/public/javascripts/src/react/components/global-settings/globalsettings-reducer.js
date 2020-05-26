import Actions from '../../common/actions'

const defaultState = {
  releaseNotes: null,
  multiFactor:null,
  secretDetails:null,
  totpEmailSent: false,
  verifyDetails:null,
  verifyFlag:false,
  errorFlag: false
}

function setReleaseNotes (state, releaseNotes) {
  return { ...state,
    releaseNotes: releaseNotes
  }
}

function setOtpStatus (state, multiFactor) {
  return { ...state,
    multiFactor: multiFactor,
    secretDetails: null,
    verifyDetails:null,
    secretDetails:null,
    totpEmailSent: false,
    errorFlag: false
  }
}

function setSecretDetails (state, secret) {
  return { ...state,
    secretDetails: secret,
    totpEmailSent: false,
    multiFactor:null
  }
}

function verifySecret (state, result) {
  return { ...state,
    verifyDetails: result,
    errorFlag: false,
    verifyFlag: true,
    secretDetails: null
  }
}

function errorSecret (state, result) {
  return { ...state,
    verifyDetails: result,
    verifyFlag: false,
    errorFlag: true,
    totpEmailSent: false
  }
}

function setEmailFlag (state, secret) {
  return { ...state,
    totpEmailSent: true,
    errorFlag: false
  }
}

function clearDetails(state, secret){
  return { ...state,
    multiFactor: null,
    secretDetails: null,
    verifyDetails:null,
    secretDetails:null
  }
}

function globalSettingsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.GLOBAL_SETTINGS_GET_RELEASE_NOTES:
      return setReleaseNotes(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_GET_OTP_STATUS:
      return setOtpStatus(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_OVERWRITE_SECRET:
      return setSecretDetails(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_VERIFY_SECRET:
      return verifySecret(state, action.payload)

    case Actions.GLOBAL_SETTINGS_ERROR_SECRET:
      return errorSecret(state, action.payload)

    case Actions.GLOBAL_SETTINGS_SEND_EMAIL_OTP:
      return setEmailFlag(state, action.payload)
    
      case Actions.GLOBAL_SETTINGS_DISABLE_AUTH:
        return clearDetails(state, action.payload) 

      default:
      return state
  }
}

export default globalSettingsReducer
