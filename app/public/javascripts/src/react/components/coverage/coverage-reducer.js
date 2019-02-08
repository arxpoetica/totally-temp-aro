import Actions from '../../common/actions'
import CoverageStatusTypes from './constants'

const defaultStatus = {
  report: null,
  status: CoverageStatusTypes.UNINITIALIZED,
  progress: 0,
  initializationParams: null
}

function setCoverageStatus(state, report, status, initializationParams) {
  return { ...state, report: report, status: status, initializationParams: initializationParams }
}

function setDefaultCoverageDetails() {
  return Object.assign({}, defaultStatus)
}

function coverageReducer(state = defaultStatus, action) {
  switch(action.type) {

    case Actions.SET_DEFAULT_COVERAGE_DETAILS:
      return setDefaultCoverageDetails()

    case Actions.UPDATE_COVERAGE_STATUS:
      return setCoverageStatus(state, action.payload.report, action.payload.status, action.payload.initializationParams)

    case Actions.INITIALIZE_COVERAGE:
      return state

    case Actions.MODIFY_COVERAGE:
      return state

    case Actions.SET_COVERAGE_PROGRESS:
      return state

    default:
      return state
  }
}

export default coverageReducer