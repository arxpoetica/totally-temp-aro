import Actions from '../../common/actions'

const defaultStatus = {
  locationInfo: null
}

function getLocationInfo (state, locationInfo) {
  return { ...state, locationInfo }
}

function getLocationAuditLog (state, auditLog) {
  return { ...state, auditLog }
}

function locationInfoReducer (state = defaultStatus, action) {
  switch (action.type) {
    case Actions.LOCATIONINFO_SHOW:
      return getLocationInfo(state, action.payload)

    case Actions.LOCATIONAUDIT_LOG_SHOW:
      return getLocationAuditLog(state, action.payload)

    default:
      return state
  }
}
export default locationInfoReducer
