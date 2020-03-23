import Actions from '../../common/actions'
import uuidv4 from 'uuid/v4'

const defaultState = {
  pages: [],
  activePageUuid: null,
  editingPageUuid: null,
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

function addPage (state, pageDefinition) {
  return { ...state,
    pages: state.pages.concat(pageDefinition)
  }
}

function removePage (state, uuid) {
  var newPages = [].concat(state.pages)
  const index = state.pages.findIndex(page => page.uuid === uuid)
  newPages.splice(index, 1)
  return { ...state,
    pages: newPages,
    activePageUuid: null
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

function mapReportsReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.MAP_REPORTS_SET_PAGE_DEFINITION:
      return setPageDefinition(state, action.payload.uuid, action.payload.pageDefinition)

    case Actions.MAP_REPORTS_CLEAR:
      return clearMapReports()

    case Actions.MAP_REPORTS_ADD_PAGE:
      return addPage(state, action.payload)

    case Actions.MAP_REPORTS_REMOVE_PAGE:
      return removePage(state, action.payload)

    case Actions.MAP_REPORTS_SET_ACTIVE_PAGE_UUID:
      return setActivePageUuid(state, action.payload)

    case Actions.MAP_REPORTS_SET_EDITING_PAGE_INDEX:
      return setEditingPageUuid(state, action.payload)

    default:
      return state
  }
}

export default mapReportsReducer
