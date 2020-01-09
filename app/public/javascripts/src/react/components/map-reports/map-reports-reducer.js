import Actions from '../../common/actions'

const defaultState = {
  isDownloading: false
}

function clearMapReports () {
  return JSON.parse(JSON.stringify(defaultState))
}

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_CLEAR:
      return clearMapReports()

    default:
      return state
  }
}

export default mapReportsReducer
