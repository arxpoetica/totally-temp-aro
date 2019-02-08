import Actions from '../../common/actions'

const defaultStatus = {
  report: null,
  coverageStatus: 'READY',
  isCalculatingCoverage: false,
  isCoverageFinished: false,
  coverageProgress: 0
}

function setCoverageStatus(state, coverageStatus) {
  return { ...state, coverageStatus: coverageStatus }
}

function coverageReducer(state = defaultStatus, action) {
  switch(action.type) {
    case Actions.SET_COVERAGE_STATUS:
      return setCoverageStatus(state, coverageStatus)

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