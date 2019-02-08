import fetch from 'cross-fetch'
import Actions from '../../common/actions'
import CoverageStatusTypes from './constants'

// Fetch the coverage report status for a given plan and set it
function updateCoverageStatus(planId) {
  return (dispatch) => {
    // First set the status and report initialized/null
    dispatch({
      type: Actions.SET_DEFAULT_COVERAGE_DETAILS
    })
    fetch(`/service/coverage/report/search/plan_id/${planId}`)
      .then(result => result.json())
      .then(result => {
        // If we don't find a coverage report for this plan id, we get an empty array back.
        const report = result.filter(item => item.coverageAnalysisRequest.planId === planId)[0]
        const status = report ? CoverageStatusTypes.FINISHED : CoverageStatusTypes.UNINITIALIZED
        const initializationParams = report && report.coverageAnalysisRequest
        dispatch({
          type: Actions.UPDATE_COVERAGE_STATUS,
          payload: {
            report: report, 
            status: status,
            initializationParams: initializationParams
          }
        })
      })
      .catch(err => console.error(err))

  }
}

export default {
  updateCoverageStatus: updateCoverageStatus
}
