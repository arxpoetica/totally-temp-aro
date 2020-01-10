import Actions from '../../common/actions'

const defaultState = {
  pages: [
    {
      paperSize: 'A4',
      worldLengthPerMeterOfPaper: 100000,
      dpi: 72,
      orientation: 'portrait',
      mapCenter: {
        latitude: 47.6062,
        longitude: -122.3321
      }
    }
  ],
  isDownloading: false
}

function clearMapReports () {
  return JSON.parse(JSON.stringify(defaultState))
}

function setPageDefinition (state, index, pageDefinition) {
  var newPages = [].concat(state.pages)
  newPages[index] = pageDefinition
  return { ...state,
    pages: newPages
  }
}

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_SET_PAGE_DEFINITION:
      return setPageDefinition(state, action.payload.index, action.payload.pageDefinition)

    case Actions.MAP_REPORTS_CLEAR:
      return clearMapReports()

    default:
      return state
  }
}

export default mapReportsReducer
