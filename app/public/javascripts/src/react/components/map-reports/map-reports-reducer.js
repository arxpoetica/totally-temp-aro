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

function setPageDefinition (state, uuid, pageDefinition) {
  var newPages = [].concat(state.pages)
  const index = state.pages.findIndex(page => page.uuid === uuid)
  newPages[index] = pageDefinition
  return { ...state,
    pages: newPages
  }
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

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_SET_PAGE_DEFINITION:
      return setPageDefinition(state, action.payload.uuid, action.payload.pageDefinition)

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

    default:
      return state
  }
}

export default mapReportsReducer
