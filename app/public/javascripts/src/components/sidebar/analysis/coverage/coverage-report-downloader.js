class CoverageReportDownloaderController {
  constructor($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.Utils = Utils

    this.rateReachMatrices = []
    this.selectedRateReachMatrix = null
    
    const now = new Date()
    const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
    this.downloadFilename = `Coverage_${timeStamp}.csv`
  }

  downloadReport() {
    this.$http.get(`/service/coverage/query/${this.state.plan.getValue().id}`, {
      headers: { 'Accept': 'text/csv' }
    })
      .then(result => this.Utils.downloadCSV(result.data, this.downloadFilename))
      .catch(err => console.error(err))
  }
}

CoverageReportDownloaderController.$inject = ['$http', '$timeout', 'state', 'Utils']

let coverageReportDownloader = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-report-downloader.html',
  bindings: {},
  controller: CoverageReportDownloaderController
}

export default coverageReportDownloader
