import Actions from '../../common/actions'

const defaultState = {
  releaseNotes: null,
  multiFactor:null,
  secretDetails:null,
  totpEmailSent: false,
  verifyDetails:null,
  verifyFlag:false,
  errorFlag: false,
  permission:null,
  tags:null,
  isCreateOrUpdate: false,
  acl:null,
  groups:null,
  userMessage: {
    show: false,
    type: '',
    text: ''
  },
  showGlobalSettings: false,
  currentView: '',
  notifyBroadcast: {},
  isGlobalSettingsView: false,
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
    verifyDetails: null,
    totpEmailSent: false,
    errorFlag: false
  }
}

function setSecretDetails (state, secret) {
  return { ...state,
    secretDetails: secret,
    totpEmailSent: false,
    multiFactor: null
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
    verifyDetails: null,
  }
}

function setPermission (state, permission) {
  return { ...state,
    permission: permission
  }
}

function setAcl (state, acl) {
  return { ...state,
    acl: acl
  }
}

function loadGroups (state, groups) {
  return { ...state,
    groups: groups,
    userMessage: { ...state.userMessage,
      show: false,
      type: '',
      text: ''
    }
  }
}

function reLoadGroups (state, groups) {
  return { ...state,
    groups: groups
  }
}

function addGroup (state, group) {
  var groups = state.groups
  groups.map((exGroup) => exGroup.isEditing = false);

  var group = group
  group.isEditing = true
  groups.push(group)
  
  return { ...state,
    groups: groups,
    userMessage: { ...state.userMessage,
      show: true,
      type: 'success',
      text: 'Group added successfully'
    }
  }
}

function saveGroup (state,group) {

  return { ...state,
    userMessage: { ...state.userMessage,
      show: true,
      type: 'success',
      text: 'Group saved successfully'
    }
  }
}

function editGroup (state, id) {
  var groupsList = state.groups
  groupsList.map((exGroup) => exGroup.isEditing = false);

  const groups = groupsList.map(group => {
    if (group.id === id) {
      return { ...group,
        isEditing: true
      }
    } else {
      return group
    }
  })
  return { ...state,
    groups,
    userMessage: { ...state.userMessage,
      show: false,
      type: '',
      text: ''
    }
  }
}

function deleteGroup(state,data){
  return { ...state,
    userMessage: { ...state.userMessage,
      show:true,
      type: 'success',
      text: 'Group deleted successfully'
    }
  }
}

function setTags (state, tags) {
  return { ...state,
    tags: tags,
    isCreateOrUpdate: false
  }
}

function setCreateOrUpdate (state, isCreateOrUpdate) {
  return { ...state,
    isCreateOrUpdate: true
  }
}

function setShowGlobalSettings (state, showGlobalSettings) {
  return { ...state,
    showGlobalSettings: showGlobalSettings
  }
}

function setNotifyBroadcast (state, notifyBroadcast) {
  notifyBroadcast.isEnableBroadcastModal = true
  return { ...state,
    notifyBroadcast: notifyBroadcast
  }
}

function setGlobalSettingsView (state, isGlobalSettingsView) {
  return { ...state,
    isGlobalSettingsView: isGlobalSettingsView
  }
}

function setCurrentView(state, currentViewOption) {
  return {...state,
    currentView: currentViewOption
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

    case Actions.GLOBAL_SETTINGS_LOAD_PERMISSIONS:
      return setPermission(state, action.payload) 

    case Actions.GLOBAL_SETTINGS_LOAD_ACL:
      return setAcl(state, action.payload) 

    case Actions.GLOBAL_SETTINGS_LOAD_GROUPS:
      return loadGroups(state, action.payload) 
      
    case Actions.GLOBAL_SETTINGS_RELOAD_GROUPS:
      return reLoadGroups(state, action.payload) 

    case Actions.GLOBAL_SETTINGS_ADD_GROUP:
      return addGroup(state, action.payload) 

    case Actions.GLOBAL_SETTINGS_EDIT_GROUP:
      return editGroup(state, action.payload)

    case Actions.GLOBAL_SETTINGS_SAVE_GROUP:
      return saveGroup(state, action.payload)

    case Actions.GLOBAL_SETTINGS_DELETE_GROUP:
      return deleteGroup(state, action.payload) 
    
    case Actions.GLOBAL_SETTINGS_LOAD_TAGS:
      return setTags(state, action.payload)

    case Actions.GLOBAL_SETTINGS_TAG_FLAG:
      return setCreateOrUpdate(state, action.payload)

    case Actions.GLOBAL_SETTINGS_SHOW_GLOBAL_SETTINGS:
      return setShowGlobalSettings(state, action.payload)      
  
    case Actions.GLOBAL_SETTINGS_NOTIFY_BROADCAST:
      return setNotifyBroadcast(state, action.payload)

    case Actions.GLOBAL_SETTINGS_SET_CURRENT_VIEW:
      return setGlobalSettingsView(state, action.payload)

    case Actions.GLOBAL_SETTINGS_SET_NEW_USER_CURRENT_VIEW:
      return setCurrentView(state, action.payload)
  
    default:
      return state

  }
}

export default globalSettingsReducer
