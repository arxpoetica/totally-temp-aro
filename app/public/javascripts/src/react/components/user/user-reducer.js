import Actions from '../../common/actions'

const defaultState = {
  systemActors: [],
  authRoles: {},
  authPermissions: {}
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

    default:
      return state
  }
}

export default userReducer
