import Actions from '../../../common/actions'

const defaultState = {
  report: null,
  reportMetaData: null,
  reportDefinition: null
}

function setReport (state, report) {
  return { ...state,
    report: report
  }
}

function setReportMetaData (state, reportMetaData) {
  return { ...state,
    reportMetaData: reportMetaData
  }
}

function setReportDefinition (state, reportDefinition) {
  return { ...state,
    reportDefinition: reportDefinition
  }
}

function clearOutput (state) {
  return { ...state,
    report: null,
    reportMetaData: null,
    reportDefinition: null
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NETWORK_ANALYSIS_SET_REPORT:
      return setReport(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_REPORT_METADATA:
      return setReportMetaData(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_REPORT_DEFINITION:
      return setReportDefinition(state, action.payload)

    case Actions.NETWORK_ANALYSIS_CLEAR_OUTPUT:
      return clearOutput(state)

    default:
      return state
  }
}

export default configurationReducer