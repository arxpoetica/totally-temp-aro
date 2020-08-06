import Actions from '../../common/actions'
import CoverageStatusTypes from './constants'

const defaultStatus = {
  report: null,
  status: CoverageStatusTypes.UNINITIALIZED,
  progress: 0,
  initializationParams: {
    coverageType: 'location',
    groupKeyType: 'networkNode',
    useMarketableTechnologies: false,
    useMaxSpeed: false,
    useExistingFiber: true,
    usePlannedFiber: true
  },
  isBoundaryCoverageVisible: false,
  boundaries: {}
}

function setCoverageStatus (state, status) {
  return { ...state, status: status }
}

function setCoverageReport (state, report) {
  return { ...state, report: report }
}

function setCoverageInitParams (state, initializationParams) {
  return { ...state, initializationParams: initializationParams }
}

function setCoverageProgress (state, progress) {
  return { ...state, progress: progress }
}

function setDefaultCoverageDetails () {
  return Object.assign({}, defaultStatus)
}

function setCoverageType (state, coverageType) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      coverageType: coverageType
    } }
}

function setGroupKeyType (state, groupKeyType) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      groupKeyType: groupKeyType
    }
  }
}

function setLimitMarketableTechnologies (state, limitMarketableTechnologies) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      useMarketableTechnologies: limitMarketableTechnologies
    } }
}

function setLimitMaxSpeed (state, limitMaxSpeed) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      useMaxSpeed: limitMaxSpeed
    } }
}

function setExistingFiber (state, existingFiber) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      useExistingFiber: existingFiber
    } }
}

function setPlannedFiber (state, plannedFiber) {
  return { ...state,
    initializationParams: {
      ...state.initializationParams,
      usePlannedFiber: plannedFiber
    } }
}

function addBoundaryCoverage (state, objectId, coverage) {
  return { ...state,
    boundaries: { ...state.boundaries,
      [objectId]: coverage
    }
  }
}

function clearBoundaryCoverage (state) {
  return { ...state,
    isBoundaryCoverageVisible: false,
    boundaries: {}
  }
}

function setBoundaryCoverageVisibility (state, isVisible) {
  return { ...state,
    isBoundaryCoverageVisible: isVisible
  }
}

function coverageReducer (state = defaultStatus, action) {
  switch (action.type) {
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

    case Actions.COVERAGE_SET_GROUP_KEY_TYPE:
      return setGroupKeyType(state, action.payload)

    case Actions.COVERAGE_SET_LIMIT_MARKETABLE_TECHNOLOGIES:
      return setLimitMarketableTechnologies(state, action.payload)

    case Actions.COVERAGE_SET_LIMIT_MAX_SPEED:
      return setLimitMaxSpeed(state, action.payload)

    case Actions.COVERAGE_SET_EXISTING_FIBER:
      return setExistingFiber(state, action.payload)

    case Actions.COVERAGE_SET_PLANNED_FIBER:
      return setPlannedFiber(state, action.payload)

    case Actions.COVERAGE_ADD_BOUNDARY_COVERAGE:
      return addBoundaryCoverage(state, action.payload.objectId, action.payload.coverage)

    case Actions.COVERAGE_CLEAR_BOUNDARY_COVERAGE:
      return clearBoundaryCoverage(state)

    case Actions.COVERAGE_SET_BOUNDARY_COVERAGE_VISIBILITY:
      return setBoundaryCoverageVisibility(state, action.payload)

    default:
      return state
  }
}

export default coverageReducer
