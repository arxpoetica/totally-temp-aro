/* globals */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'

function loadReport (planId) {
  return dispatch => {
    // First get reports metadata so we can find the id of the optimization_analysis report
    AroHttp.get('/service/v2/installed/report/meta-data')
      .then(result => {
        const optimizationReports = result.data.filter(item => item.name === 'optimization_analysis')
        if (optimizationReports.length !== 1) {
          console.warn(`Warning - expected exactly one optimization report in DB, found ${optimizationReports.length}`)
        }
        dispatch({
          type: Actions.NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA,
          payload: optimizationReports[0]
        })
        // Get the report definition and actual report for this plan id
        const reportModuleId = optimizationReports[0].id
        return Promise.all([
          AroHttp.get(`/service-download-file/test.json/v2/report-extended/${reportModuleId}/${planId}.json`),
          AroHttp.get(`/service/v2/report-module/${reportModuleId}`)
        ])
      })
      .then(results => {
        dispatch({
          type: Actions.NETWORK_ANALYSIS_SET_CHART_REPORT,
          payload: results[0].data
        })
        // uiDefinition comes in as a JSON string. We should parse it back out.
        var reportDefinition = results[1].data
        reportDefinition.uiDefinition = JSON.parse(reportDefinition.uiDefinition)
        dispatch({
          type: Actions.NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION,
          payload: reportDefinition
        })
      })
      .catch(err => console.error(err))
  }
}

function setNetworkAnalysisConnectivityDefinition (spatialEdgeType, networkConnectivityType) {
  return {
    type: Actions.NETWORK_ANALYSIS_SET_CONNECTIVITY,
    payload: {
      spatialEdgeType,
      networkConnectivityType
    }
  }
}

export default {
  loadReport,
  setNetworkAnalysisConnectivityDefinition
}
