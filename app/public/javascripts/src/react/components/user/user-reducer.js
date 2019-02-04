import Actions from '../../common/actions'

// Set the superuser flag for the currently logged in user
function setSuperUserFlag(state, isSuperUser) {
  return { ...state, isSuperUser: isSuperUser }
}

// Set the currently logged in user
function setLoggedInUser(state, loggedInUser) {
  return { ...state, loggedInUser: loggedInUser }
}

function userReducer(state = { isSuperUser: false }, action) {
  switch(action.type) {
    case Actions.GET_SUPERUSER_FLAG:
      return state
    
    case Actions.SET_SUPERUSER_FLAG:
      return setSuperUserFlag(state, action.payload.isSuperUser)

    case Actions.SET_LOGGED_IN_USER:
      return setLoggedInUser(state, action.loggedInUser)

    default:
      return state
  }
}

export default userReducer