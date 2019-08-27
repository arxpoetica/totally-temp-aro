import Actions from '../../common/actions'

const defaultStatus = {
  locationInfo: null
}

function setLocationInfo (state, locationInfo) {
  return { ...state, locationInfo }
}

function getLocationAuditLog (state, auditLog) {
  return { ...state, auditLog }
}

function locationInfoReducer (state = defaultStatus, action) {
  switch (action.type) {
    case Actions.LOCATIONINFO_SET:
      return setLocationInfo(state, action.payload)

    case Actions.LOCATIONINFO_SHOW_AUDIT_LOG:
      return getLocationAuditLog(state, action.payload)

    default:
      return state
  }
}
export default locationInfoReducer
