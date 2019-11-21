/* globals */
import Actions from '../../../common/actions'
import AroHttp from '../../../common/aro-http'

function loadReportsMetaData () {
  return dispatch => {
    AroHttp.get('/service/v2/installed/report/meta-data')
      .then(result => {
        var reportsMetaData = result.data
        reportsMetaData.forEach(reportMetaData => { reportMetaData.isDownloading = false }) // Set a flag that shows whether the report is downloading
        reportsMetaData.sort((a, b) => (a.displayName > b.displayName) ? 1 : -1) // Sort reports by display name
        dispatch({
          type: Actions.OPTIMIZATION_REPORTS_SET_REPORTS_METADATA,
          payload: reportsMetaData
        })
      })
      .catch(err => console.error(err))
  }
}

function setIsDownloadingReport (index, isDownloading) {
  return {
    type: Actions.OPTIMIZATION_REPORTS_SET_IS_DOWNLOADING,
    payload: {
      index: index,
      isDownloading: isDownloading
    }
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
  loadReportsMetaData,
  setIsDownloadingReport,
  clearOutput,
  showOrHideReportModal
}
