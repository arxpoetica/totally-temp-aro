import Actions from '../../common/actions'

const defaultState = {
  pages: [],
  activePageUuid: null,
  editingPageUuid: null,
  isCommunicating: false,
  isDownloading: false
}

function clearMapReports () {
  return JSON.parse(JSON.stringify(defaultState))
}

function setPages (state, pages) {
  return { ...state,
    pages: [].concat(pages)
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
function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {

    case Actions.MAP_REPORTS_SET_PAGES:
      return setPages(state, action.payload)

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

    default:
      return state
  }
}

export default mapReportsReducer
