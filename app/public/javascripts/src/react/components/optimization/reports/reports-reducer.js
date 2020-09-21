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

function setIsDownloading (state, index, isDownloading) {
  var newReportsMetaData = state.reportsMetaData.slice()
  newReportsMetaData[index] = { ...newReportsMetaData[index],
    isDownloading: isDownloading
  }
  return { ...state,
    reportsMetaData: newReportsMetaData
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

    case Actions.OPTIMIZATION_REPORTS_SET_IS_DOWNLOADING:
      return setIsDownloading(state, action.payload.index, action.payload.isDownloading)

    default:
      return state
  }
}

export default configurationReducer
