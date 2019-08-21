import Actions from '../../common/actions'

const defaultStatus = {
  data: null,
  
}

function getLocationInfo (state, planId) {
  return { ...state,
    planId: planId
     }
}

function locationInfoReducer (state = defaultStatus, action) {
  switch (action.type) {

    case Actions.LOCATIONINFO_SHOW:
      return getLocationInfo(state, action.payload)

    default:
      return state
  }
}
export default locationInfoReducer
