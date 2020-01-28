import Actions from '../../common/actions'

const defaultState = {
  pages: [
    {
      title: 'Page 1',
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
  activePageIndex: 0,
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

function addPage (state, pageDefinition) {
  return { ...state,
    pages: state.pages.concat(pageDefinition)
  }
}

function removePage (state, index) {
  var newPages = [].concat(state.pages)
  newPages.splice(index, 1)
  const newActivePageIndex = (index <= state.activePageIndex) ? Math.max(0, state.activePageIndex - 1) : state.activePageIndex
  return { ...state,
    pages: newPages,
    activePageIndex: newActivePageIndex
  }
}

function setActivePageIndex (state, index) {
  return { ...state,
    activePageIndex: index
  }
}

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_SET_PAGE_DEFINITION:
      return setPageDefinition(state, action.payload.index, action.payload.pageDefinition)

    case Actions.MAP_REPORTS_CLEAR:
      return clearMapReports()

    case Actions.MAP_REPORTS_ADD_PAGE:
      return addPage(state, action.payload)

    case Actions.MAP_REPORTS_REMOVE_PAGE:
      return removePage(state, action.payload)

    case Actions.MAP_REPORTS_SET_ACTIVE_PAGE_INDEX:
      return setActivePageIndex(state, action.payload)

    default:
      return state
  }
}

export default mapReportsReducer
