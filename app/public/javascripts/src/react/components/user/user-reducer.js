import Actions from '../../common/actions'

// Set the superuser flag for the currently logged in user
function setSuperUserFlag (state, isSuperUser) {
  return { ...state, isSuperUser: isSuperUser }
}

// Set the currently logged in user
function setLoggedInUser (state, loggedInUser) {
  return { ...state, loggedInUser: loggedInUser }
}

function userReducer (state = { isSuperUser: false }, action) {
  switch (action.type) {
    case Actions.USER_GET_SUPERUSER_FLAG:
      return state

    case Actions.USER_SET_SUPERUSER_FLAG:
      return setSuperUserFlag(state, action.payload.isSuperUser)

    case Actions.USER_SET_LOGGED_IN_USER:
      return setLoggedInUser(state, action.loggedInUser)

    default:
      return state
  }
}

export default userReducer
