import Actions from '../../common/actions'

const defaultStatus = {
  details: null,
  auditLog: null
}

function setLocationInfoDetails (state, details) {
  return { ...state, details: details }
}

function setLocationAuditLog (state, auditLog) {
  return { ...state, auditLog: auditLog }
}

function locationInfoReducer (state = defaultStatus, action) {
  switch (action.type) {
    case Actions.LOCATION_INFO_SET_DETAILS:
      return setLocationInfoDetails(state, action.payload)

    case Actions.LOCATION_INFO_SET_AUDIT_LOG:
      return setLocationAuditLog(state, action.payload)

    default:
      return state
  }
}
export default locationInfoReducer
