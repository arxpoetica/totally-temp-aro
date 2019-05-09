import Actions from '../../../common/actions'

const defaultState = {
  chartReport: null,
  chartReportMetaData: null,
  chartReportDefinition: null,
  reportsMetaData: null,
  showReportModal: false
}

function setChartReport (state, chartReport) {
  return { ...state,
    chartReport: chartReport
  }
}

function setChartReportMetaData (state, chartReportMetaData) {
  return { ...state,
    chartReportMetaData: chartReportMetaData
  }
}

function setChartReportDefinition (state, chartReportDefinition) {
  return { ...state,
    chartReportDefinition: chartReportDefinition
  }
}

function setReportsMetaData (state, reportsMetaData) {
  return { ...state,
    reportsMetaData: reportsMetaData
  }
}

function clearOutput (state) {
  return { ...state,
    chartReport: null,
    chartReportMetaData: null,
    chartReportDefinition: null,
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
    case Actions.NETWORK_ANALYSIS_SET_CHART_REPORT:
      return setChartReport(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA:
      return setChartReportMetaData(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION:
      return setChartReportDefinition(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_REPORTS_METADATA:
      return setReportsMetaData(state, action.payload)

    case Actions.NETWORK_ANALYSIS_CLEAR_OUTPUT:
      return clearOutput(state)

    case Actions.NETWORK_ANALYSIS_SHOW_HIDE_REPORT_MODAL:
      return setReportModalVisibility(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
