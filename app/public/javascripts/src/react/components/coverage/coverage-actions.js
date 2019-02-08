import fetch from 'cross-fetch'
import Actions from '../../common/actions'
import CoverageStatusTypes from './constants'

function initializeCoverageReport(userId, planId, projectId, activeSelectionMode, locationTypes, tileLayers, initializationParams, oldReport) {
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

    dispatch({
      type: Actions.UPDATE_COVERAGE_STATUS,
      payload: {
        report: oldReport, 
        status: CoverageStatusTypes.RUNNING,
        initializationParams: requestBody.coverageAnalysisRequest
      }
    })

    var coverageReport = null
    fetch(`/service/coverage/report`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(result => result.json())
      .then(result => {
        coverageReport = result
        dispatch({
          type: Actions.UPDATE_COVERAGE_STATUS,
          payload: {
            report: coverageReport, 
            status: CoverageStatusTypes.RUNNING,
            initializationParams: requestBody.coverageAnalysisRequest
          }
        })
        return fetch(`/service/coverage/report/${coverageReport.reportId}/init?user_id=${userId}`, { method: 'POST' })
      })
      .then(() => {
        dispatch({
          type: Actions.UPDATE_COVERAGE_STATUS,
          payload: {
            report: coverageReport, 
            status: CoverageStatusTypes.FINISHED,
            initializationParams: requestBody.coverageAnalysisRequest
          }
        })
      })
      .catch(err => {
        console.error(err)
      })
  }
}

// Fetch the coverage report status for a given plan and set it
function updateCoverageStatus(planId) {
  return dispatch => {
    // First set the status and report initialized/null
    dispatch({
      type: Actions.SET_DEFAULT_COVERAGE_DETAILS
    })
    fetch(`/service/coverage/report/search/plan_id/${planId}`)
      .then(result => result.json())
      .then(result => {
        // Update the coverage status only if we have a valid report
        const report = result.filter(item => item.coverageAnalysisRequest.planId === planId)[0]
        if (report) {
          dispatch({
            type: Actions.UPDATE_COVERAGE_STATUS,
            payload: {
              report: report, 
              status: CoverageStatusTypes.FINISHED,
              initializationParams: report.coverageAnalysisRequest
            }
          })
        }
      })
      .catch(err => console.error(err))

  }
}

// Initialize coverage report

export default {
  updateCoverageStatus: updateCoverageStatus,
  initializeCoverageReport: initializeCoverageReport
}
