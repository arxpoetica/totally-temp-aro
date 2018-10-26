class CoverageReportGeneratorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.coverageReport = null
    this.rateReachMatrices = []
    this.selectedRateReachMatrix = null
    this.$http.get('/service/rr/matrix')
      .then((result) => {
        this.rateReachMatrices = result.data
        this.selectedRateReachMatrix = result.data[0]
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  $onInit() {
    // Get the coverage report details
    this.coverageReport = null
    this.$http.get(`/service/coverage/report/${this.coverageReportId}`)
      .then((result) => this.coverageReport = result.data)
      .catch(err => console.error(err))
  }
}

CoverageReportGeneratorController.$inject = ['$http', '$timeout', 'state']

let coverageReportGenerator = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-report-downloader.html',
  bindings: {
    coverageReportId: '<'
  },
  controller: CoverageReportGeneratorController
}

export default coverageReportGenerator
