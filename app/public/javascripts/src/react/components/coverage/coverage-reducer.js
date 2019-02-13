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

function setCoverageType(state, coverageType) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      coverageType: coverageType
    }}
}

function setSaveSiteCoverage(state, saveSiteCoverage) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      saveSiteCoverage: saveSiteCoverage
    }}
}

function setLimitMarketableTechnologies(state, limitMarketableTechnologies) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      useMarketableTechnologies: limitMarketableTechnologies
    }}
}

function setLimitMaxSpeed(state, limitMaxSpeed) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      useMaxSpeed: limitMaxSpeed
    }}
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

    case Actions.COVERAGE_SET_PROGRESS:
      return setCoverageProgress(state, action.payload.progress)

    case Actions.COVERAGE_SET_COVERAGE_TYPE:
      return setCoverageType(state, action.payload)

    case Actions.COVERAGE_SET_SAVE_SITE_COVERAGE:
      return setSaveSiteCoverage(state, action.payload)

    case Actions.COVERAGE_SET_LIMIT_MARKETABLE_TECHNOLOGIES:
      return setLimitMarketableTechnologies(state, action.payload)

    case Actions.COVERAGE_SET_LIMIT_MAX_SPEED:
      return setLimitMaxSpeed(state, action.payload)

    default:
      return state
  }
}

export default coverageReducer