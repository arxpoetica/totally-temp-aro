import Actions from '../../common/actions'

// Set the superuser flag for the currently logged in user
function setSuperUserFlag(state, isSuperUser) {
  return { ...state, isSuperUser: isSuperUser }
}

function userReducer(state = { isSuperUser: false }, action) {
  switch(action.type) {
    case Actions.GET_SUPERUSER_FLAG:
      return state
    
    case Actions.SET_SUPERUSER_FLAG:
      return setSuperUserFlag(state, action.payload.isSuperUser)

    default:
      return state
  }
}

export default userReducer