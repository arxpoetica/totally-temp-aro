import Actions from '../../../common/actions'

const defaultState = {
  reportsMetaData: null,
  showReportModal: false
}

function setReportsMetaData (state, reportsMetaData) {
  return { ...state,
    reportsMetaData: reportsMetaData
  }
}

function clearOutput (state) {
  return { ...state,
    reportsMetaData: null,
    showReportModal: false
  }
}

function setReportModalVisibility (state, showReportModal) {
  return { ...state,
    showReportModal: showReportModal
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.OPTIMIZATION_REPORTS_SET_REPORTS_METADATA:
      return setReportsMetaData(state, action.payload)

    case Actions.OPTIMIZATION_REPORTS_CLEAR_OUTPUT:
      return clearOutput(state)

    case Actions.OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL:
      return setReportModalVisibility(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
