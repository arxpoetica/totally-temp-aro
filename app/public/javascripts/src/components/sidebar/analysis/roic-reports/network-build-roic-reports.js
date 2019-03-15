import Constants from '../../../common/constants'

class NetworkBuildRoicReportsController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state

    this.roicResultsData = null
  }

  $onChanges (changesObj) {
    if (changesObj.planId || changesObj.optimizationState) {
      this.refreshData()
    }
  }

  refreshData () {
    if (!this.planId) {
      console.error('Plan ID not available')
      return
    }

    this.loadROICResultsForPlan(this.planId)
  }

  loadROICResultsForPlan (planId) {
    this.$http.get(`/service/report/plan/${planId}`)
      .then(result => {
        this.roicResultsData = result.data
      })
      .catch(err => console.error(err))
  }
}

NetworkBuildRoicReportsController.$inject = ['$http', 'state']

let networkBuildRoicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports/common-roic-reports.html',
  bindings: {
    planId: '<',
    optimizationState: '<',
    reportSize: '<',
    isLocation: '<'
  },
  controller: NetworkBuildRoicReportsController
}

export default networkBuildRoicReports
