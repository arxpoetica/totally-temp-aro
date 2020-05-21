import Actions from '../../common/actions'

const defaultState = {
  releaseNotes: null,
  multiFactor:null,
  secretDetails:null,
  showSecretText: null,
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

function updateLoggedInUser (state, user) {
  return { ...state,
    user: { 
      ...loggedInUser.first_name=user.first_name,
      ...loggedInUser.last_name=user.last_name,
      ...loggedInUser.email=user.email,
    }
  }
}

function setOtpStatus (state, multiFactor) {
  return { ...state,
    multiFactor: multiFactor,
    secretDetails: null
  }
}

function setSecretDetails (state, secret) {
  return { ...state,
    secretDetails: secret,
    showSecretText: false,
    multiFactor:null
  }
}


function showSecret (state, secret) {
  return { ...state,
    showSecretText: true
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
    errorFlag: true
  }
}

function setEmailFlag (state, secret) {
  return { ...state,
    totpEmailSent: true
  }
}

function globalSettingsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.GLOBAL_SETTINGS_GET_RELEASE_NOTES:
      return setReleaseNotes(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_UPDATE_USER:
      return updateLoggedInUser(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_GET_OTP_STATUS:
      return setOtpStatus(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_OVERWRITE_SECRET:
      return setSecretDetails(state, action.payload)
  
    case Actions.GLOBAL_SETTINGS_UPDATE_SECRET:
      return showSecret(state, action.payload)
    
    case Actions.GLOBAL_SETTINGS_VERIFY_SECRET:
      return verifySecret(state, action.payload)

    case Actions.GLOBAL_SETTINGS_ERROR_SECRET:
      return errorSecret(state, action.payload)

    case Actions.GLOBAL_SETTINGS_SEND_EMAIL_OTP:
      return setEmailFlag(state, action.payload)
    default:
      return state
  }
}

export default globalSettingsReducer
