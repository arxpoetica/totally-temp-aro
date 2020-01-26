/* globals Blob */
import { saveAs } from 'file-saver'
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

function downloadReport (reportId, reportFormat, planId) {
  return (dispatch, getState) => {
    const report = getState().optimization.report.reportsMetaData.filter(report => report.id === reportId)[0]
    const reportIndex = getState().optimization.report.reportsMetaData.findIndex(report => report.id === reportId)
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
    // For shapefiles (.shp) the endpoint ends with .shp but it is a zip file. Change the extension out before saving.
    const extension = (reportFormat === 'shp') ? 'zip' : reportFormat
    const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_${report.name}.${extension}`
    const reportUrl = `/service-download-file/${downloadFileName}/v2/report-extended/${report.id}/${planId}.${reportFormat}`

    dispatch(setIsDownloadingReport(reportIndex, true))
    AroHttp.get(reportUrl, true)
      .then(rawResult => {
        saveAs(new Blob([rawResult]), downloadFileName)
        dispatch(setIsDownloadingReport(reportIndex, false))
      })
      .catch(err => {
        console.error(err)
        dispatch(setIsDownloadingReport(reportIndex, false))
      })
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
  clearOutput,
  showOrHideReportModal,
  downloadReport
}
