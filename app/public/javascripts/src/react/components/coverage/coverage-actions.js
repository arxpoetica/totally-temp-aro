import AroHttp from '../../common/aro-http'
import Actions from '../../common/actions'
import CoverageStatusTypes from './constants'

function initializeCoverageReport(userId, planId, projectId, activeSelectionMode, locationTypes, tileLayers, initializationParams) {
  return dispatch => {
    // Format the coverage report that so it can be sent over to aro-service
    var requestBody = {
      coverageAnalysisRequest: Object.assign({}, initializationParams)
    }
    requestBody.coverageAnalysisRequest.planId = planId
    requestBody.coverageAnalysisRequest.projectTemplateId = projectId
    requestBody.coverageAnalysisRequest.analysisSelectionMode = activeSelectionMode
    requestBody.coverageAnalysisRequest.locationTypes = locationTypes
    if (activeSelectionMode === 'SELECTED_ANALYSIS_AREAS') {
      // If we have analysis areas selected, we can have exactly one analysis layer selected in the UI
      const visibleAnalysisLayers = tileLayers.filter(item => item.visible && (item.type === 'analysis_layer'))
      if (visibleAnalysisLayers.length !== 1) {
        const errorMessage = 'You must have exactly one analysis layer selected to initialize the coverage report'
        swal({
          title: 'Analysis Layer error',
          text: errorMessage,
          type: 'error',
          closeOnConfirm: true
        })
        return null
      }
      requestBody.coverageAnalysisRequest.analysisLayerId = visibleAnalysisLayers[0].analysisLayerId
    }

    dispatch({ type: Actions.SET_COVERAGE_STATUS, payload: { status: CoverageStatusTypes.RUNNING } })

    var coverageReport = null
    AroHttp.post(`/service/coverage/report`, requestBody)
      .then(result => {
        coverageReport = result.data
        dispatch({ type: Actions.SET_COVERAGE_STATUS, payload: { status: CoverageStatusTypes.RUNNING }})
        dispatch({ type: Actions.SET_COVERAGE_REPORT, payload: { report: coverageReport }})
        dispatch({ type: Actions.SET_COVERAGE_INIT_PARAMS, payload: { initializationParams: requestBody.coverageAnalysisRequest }})
        return AroHttp.post(`/service/coverage/report/${coverageReport.reportId}/init?user_id=${userId}`, {})
      })
      .catch(err => {
        console.error(err)
      })
  }
}

// Modify the coverage report
function modifyCoverageReport(reportId) {
  return dispatch => {
    AroHttp.delete(`/service/coverage/report/${reportId}`)
      .then(result => {
        dispatch({ type: Actions.SET_DEFAULT_COVERAGE_DETAILS })
      })
      .catch(err => console.error(err))
  }
}

// Fetch the coverage report status for a given plan and set it
function updateCoverageStatus(planId) {
  return dispatch => {
    // First set the status and report initialized/null
    dispatch({
      type: Actions.SET_DEFAULT_COVERAGE_DETAILS
    })
    AroHttp.get(`/service/coverage/report/search/plan_id/${planId}`)
      .then(result => {
        // Update the coverage status only if we have a valid report
        const report = result.data.filter(item => item.coverageAnalysisRequest.planId === planId)[0]
        if (report) {
          dispatch({ type: Actions.SET_COVERAGE_STATUS, payload: { status: CoverageStatusTypes.FINISHED }})
          dispatch({ type: Actions.SET_COVERAGE_REPORT, payload: { report: report }})
          dispatch({ type: Actions.SET_COVERAGE_INIT_PARAMS, payload: { initializationParams: report.coverageAnalysisRequest }})
        }
      })
      .catch(err => console.error(err))

  }
}

// Initialize coverage report

export default {
  updateCoverageStatus: updateCoverageStatus,
  initializeCoverageReport: initializeCoverageReport,
  modifyCoverageReport: modifyCoverageReport
}
