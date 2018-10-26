class CoverageReportsController {
  constructor($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.areCoverageReportsInitialized = false
  }

  $onInit() {
    // If reports have not been initialized for this plan id, show the initialization control. Else show the download control.
    // For now, service is returning all the plans and we filter out the one that we need.
    this.$http.get(`/service/coverage/report`)
      .then((result) => {
        this.areCoverageReportsInitialized = (result.data.filter(item => item.planId === this.planId).length > 0)
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  onCoverageInitialized() {
    this.areCoverageReportsInitialized = true
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
