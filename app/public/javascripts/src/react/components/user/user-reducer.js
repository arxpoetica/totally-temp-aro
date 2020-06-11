import Actions from '../../common/actions'

const defaultState = {
  systemActors: [],
  authRoles: {},
  authPermissions: {},
  userConfiguration: null,
  projectTemplates: null,
  userList: null,
  allGroups: null,
  isOpenSendMail: false,
  isOpenNewUser:false
}

// Set the currently logged in user
function setLoggedInUser (state, loggedInUser) {
  return { ...state,
    loggedInUser: loggedInUser
  }
}

// Set all the system actors (i.e. users and groups)
function setSystemActors (state, systemActors) {
  return { ...state,
    systemActors: systemActors
  }
}

function setAuthRoles (state, authRoles) {
  return { ...state,
    authRoles: { ...state.authRoles, ...authRoles }
  }
}

function setAuthPermissions (state, authPermissions) {
  return { ...state,
    authPermissions: { ...state.authPermissions, ...authPermissions }
  }
}

function updateLoggedInUser (state, user) {
  return { ...state,
    loggedInUser: { ...state.loggedInUser,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    }
  }
}

function setUserConfiguration (state, userConfiguration) {
  return { ...state,
    userConfiguration: userConfiguration
  }
}

function setProjectTemplates (state, projectTemplates) {
  return { ...state,
    projectTemplates: projectTemplates
  }
}

function setUserList (state, users) {

  let mapIdToGroup = {}
  state.allGroups.forEach((group) => mapIdToGroup[group.id] = group)

  let allUsers = users
  // For a user we will get the IDs of the groups that the user belongs to. Our control uses objects to bind to the model.
  // Remove the group ids property and replace it with group objects
  allUsers.forEach((user, index) => {
    var selectedGroupObjects = []
    user.groupIds.forEach((userGroupId) => selectedGroupObjects.push(mapIdToGroup[userGroupId]))
    allUsers[index].userGroups = selectedGroupObjects // Make sure you modify the object and not a copy
    delete allUsers[index].groupIds
  })
  
  return { ...state,
    userList: allUsers,
    isOpenSendMail: false,
    isOpenNewUser: false
  }
}

function setAllGroups (state, groups) {
  return { ...state,
    allGroups: groups
  }
}

function setMailFlag (state, groups) {
  return { ...state,
    isOpenSendMail: true,
    isOpenNewUser: false
  }
}

function setNewUserFlag (state, groups) {
  return { ...state,
    isOpenSendMail: false,
    isOpenNewUser: true
  }
}

function userReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.USER_GET_SUPERUSER_FLAG:
      return state

    case Actions.USER_SET_LOGGED_IN_USER:
      return setLoggedInUser(state, action.payload)

    case Actions.USER_UPDATE_USER:
      return updateLoggedInUser(state, action.payload)

    case Actions.USER_SET_SYSTEM_ACTORS:
      return setSystemActors(state, action.payload)

    case Actions.USER_SET_AUTH_ROLES:
      return setAuthRoles(state, action.payload)

    case Actions.USER_SET_AUTH_PERMISSIONS:
      return setAuthPermissions(state, action.payload)
    
    case Actions.USER_SET_CONFIGURATION:
       return setUserConfiguration(state, action.payload)

    case Actions.USER_PROJECT_TEMPLATES:
      return setProjectTemplates(state, action.payload)

    case Actions.USER_SET_USERLIST:
      return setUserList(state, action.payload)
    
    case Actions.USER_SET_GROUP:
      return setAllGroups(state, action.payload)

    case Actions.USER_SET_SEND_MAIL_FLAG:
      return setMailFlag(state, action.payload)
    
    case Actions.USER_SET_NEW_USER_FLAG:
      return setNewUserFlag(state, action.payload)

      default:
      return state
  }
}

export default userReducer
