class CoverageReportDownloaderController {
  constructor($http, $timeout, state, Utils) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.Utils = Utils

    this.coverageReport = null
    this.rateReachMatrices = []
    this.selectedRateReachMatrix = null
    this.coverageReports = []
  }

  $onInit() {
    // Get the coverage report details
    this.$http.get('/service/rr/matrix')
    .then((result) => {
      this.rateReachMatrices = result.data
      this.selectedRateReachMatrix = result.data[0]   // Now, this is not being set from the UI. Keeping it this way until the endpoints are stabilized.
      return this.$http.get('/service/installed/report/meta-data')
    })
    .then(result => {
      const now = new Date()
      const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
      this.coverageReports = result.data.filter(item => item.reportType === 'COVERAGE' || item.reportType === 'FORM477')
      this.coverageReports.forEach((item, index) => {
        this.coverageReports[index].downloadUrl = `/report-extended/${item.name}/${this.state.plan.getValue().id}/${item.mediaType}`
        this.coverageReports[index].downloadFilename = `Coverage_${timeStamp}.csv`
      })
      this.$timeout()
    })
    .catch(err => console.error(err))
  }

  downloadReport(report) {
    this.$http.get(report.downloadUrl)
      .then(result => this.Utils.downloadCSV(result.data, report.downloadFilename))
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
