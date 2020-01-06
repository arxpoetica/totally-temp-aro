/* globals Blob */
import { saveAs } from 'file-saver'
import AroHttp from '../../common/aro-http'

function downloadReport (planId) {
  return dispatch => {
    const reportUrl = `/map-reports/report`
    const postBody = [
      {
        paperSize: 'A2',
        worldLengthPerMeterOfPaper: 100000,
        dpi: 144,
        orientation: 'portrait',
        mapCenter: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        planId: planId,
        visibleLayers: [
          'FEEDER',
          'fiber_distribution_hub'
        ]
      }
    ]
    // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
    // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
    const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_map_report.pdf`
    AroHttp.post(reportUrl, postBody, true)
      .then(rawResult => {
        saveAs(new Blob([rawResult]), downloadFileName)
      })
      .catch(err => {
        console.error(err)
      })
  }
}

export default {
  downloadReport
}
