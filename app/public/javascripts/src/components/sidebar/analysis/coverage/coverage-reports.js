class CoverageReportsController {
  constructor($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.coverageReport = null
  }

  $onInit() {
    // If reports have not been initialized for this plan id, show the initialization control. Else show the download control.
    // For now, service is returning all the plans and we filter out the one that we need.
    this.initialize()
  }

  initialize() {
    this.$http.get(`/service/coverage/report/search/plan_id/${this.planId}`)
      .then((result) => {
        // If we don't find a coverage report for this plan id, we get an empty array back.
        this.coverageReport = result.data.filter(item => item.coverageAnalysisRequest.planId === this.planId)[0]
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  onCoverageInitialized() {
    this.initialize()
  }

  onReportSettingsReset() {
    this.initialize()
  }
}

CoverageReportsController.$inject = ['$http', '$timeout']

let coverageReports = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-reports.html',
  bindings: {
    planId: '<'
  },
  controller: CoverageReportsController
}

export default coverageReports
