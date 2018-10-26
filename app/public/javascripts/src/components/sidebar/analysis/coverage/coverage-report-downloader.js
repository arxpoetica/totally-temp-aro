class CoverageReportDownloaderController {
  constructor($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.Utils = Utils

    this.coverageReport = null
    this.rateReachMatrices = []
    this.selectedRateReachMatrix = null
    // Get the coverage report details
    this.$http.get('/service/rr/matrix')
      .then((result) => {
        this.rateReachMatrices = result.data
        this.selectedRateReachMatrix = result.data[0]
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  downloadReport() {
    this.$http.get(`/service/coverage/query/form477/${this.coverageReportId}/${this.selectedRateReachMatrix.id}`)
      .then((result) => this.Utils.downloadCSV(result.data, 'CoverageReport.csv'))
      .catch(err => console.error(err))
  }
}

CoverageReportDownloaderController.$inject = ['$http', '$timeout', 'state', 'Utils']

let coverageReportDownloader = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-report-downloader.html',
  bindings: {
    coverageReportId: '<'
  },
  controller: CoverageReportDownloaderController
}

export default coverageReportDownloader
