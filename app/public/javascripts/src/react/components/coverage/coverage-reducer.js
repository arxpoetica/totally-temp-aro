import Actions from '../../common/actions'
import CoverageStatusTypes from './constants'

const defaultStatus = {
  report: null,
  status: CoverageStatusTypes.UNINITIALIZED,
  progress: 0,
  initializationParams: {
    coverageType: 'location',
    saveSiteCoverage: false,
    useMarketableTechnologies: true,
    useMaxSpeed: true
  }
}

function setCoverageStatus(state, status) {
  return { ...state, status: status }
}

function setCoverageReport(state, report) {
  return { ...state, report: report }
}

function setCoverageInitParams(state, initializationParams) {
  return { ...state, initializationParams: initializationParams }
}

function setCoverageProgress(state, progress) {
  return { ...state, progress: progress }
}

function setDefaultCoverageDetails() {
  return Object.assign({}, defaultStatus)
}

function coverageReducer(state = defaultStatus, action) {
  switch(action.type) {

    case Actions.COVERAGE_SET_DETAILS:
      return setDefaultCoverageDetails()

    case Actions.COVERAGE_SET_STATUS:
      return setCoverageStatus(state, action.payload.status)

    case Actions.COVERAGE_SET_REPORT:
      return setCoverageReport(state, action.payload.report)

    case Actions.COVERAGE_SET_INIT_PARAMS:
      return setCoverageInitParams(state, action.payload.initializationParams)

    case Actions.COVERAGE_INITIALIZE:
      return state

    case Actions.COVERAGE_MODIFY:
      return state

    case Actions.COVERAGE_SET_PROGRESS:
      return setCoverageProgress(state, action.payload.progress)

    default:
      return state
  }
}

export default coverageReducer