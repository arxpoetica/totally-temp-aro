/* globals */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'

function loadReportsMetaData () {
  return dispatch => {
    AroHttp.get('/service/v2/installed/report/meta-data')
      .then(result => {
        dispatch({
          type: Actions.OPTIMIZATION_REPORTS_SET_REPORTS_METADATA,
          payload: result.data
        })
      })
      .catch(err => console.error(err))
  }
}

function clearOutput () {
  return {
    type: Actions.OPTIMIZATION_REPORTS_CLEAR_OUTPUT
  }
}

function showOrHideReportModal (showReportModal) {
  return {
    type: Actions.OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL,
    payload: showReportModal
  }
}

export default {
  clearOutput: clearOutput,
  loadReportsMetaData: loadReportsMetaData,
  showOrHideReportModal: showOrHideReportModal
}
