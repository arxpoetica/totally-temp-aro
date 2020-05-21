import Actions from '../../common/actions'

const defaultState = {
  pages: [],
  showMapObjects: false,
  showPageNumbers: false,
  activePageUuid: null,
  editingPageUuid: null,
  isCommunicating: false,
  isDownloading: false,
  waitSecondsPerPage: 20
}

function clearMapReports () {
  return JSON.parse(JSON.stringify(defaultState))
}

function setPages (state, pages) {
  return { ...state,
    pages: [].concat(pages)
  }
}

function setShowMapObjects (state, showMapObjects) {
  return { ...state,
    showMapObjects
  }
}

function setShowPageNumbers (state, showPageNumbers) {
  return { ...state,
    showPageNumbers
  }
}

function setActivePageUuid (state, uuid) {
  return { ...state,
    activePageUuid: uuid
  }
}

function setEditingPageUuid (state, uuid) {
  return { ...state,
    editingPageUuid: uuid
  }
}

function setIsCommunicating (state, isCommunicating) {
  return { ...state,
    isCommunicating
  }
}

function setIsDownloading (state, isDownloading) {
  return { ...state,
    isDownloading
  }
}

function setWaitTimePerPage (state, waitSecondsPerPage) {
  return { ...state,
    waitSecondsPerPage
  }
}

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_SET_PAGES:
      return setPages(state, action.payload)

    case Actions.MAP_REPORTS_SET_SHOW_MAP_OBJECTS:
      return setShowMapObjects(state, action.payload)

    case Actions.MAP_REPORTS_SET_SHOW_PAGE_NUMBERS:
      return setShowPageNumbers(state, action.payload)

    case Actions.MAP_REPORTS_CLEAR:
      return clearMapReports()

    case Actions.MAP_REPORTS_SET_ACTIVE_PAGE_UUID:
      return setActivePageUuid(state, action.payload)

    case Actions.MAP_REPORTS_SET_EDITING_PAGE_INDEX:
      return setEditingPageUuid(state, action.payload)

    case Actions.MAP_REPORTS_SET_IS_COMMUNICATING:
      return setIsCommunicating(state, action.payload)

    case Actions.MAP_REPORTS_SET_IS_DOWNLOADING:
      return setIsDownloading(state, action.payload)

    case Actions.MAP_REPORTS_SET_WAIT_TIME_PER_PAGE:
      return setWaitTimePerPage(state, action.payload)

    default:
      return state
  }
}

export default mapReportsReducer
