import Constants from '../../../common/constants'

class NetworkBuildRoicReportsController {
  constructor ($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.roicResultsData = null
  }

  $onChanges (changesObj) {
    console.log(this)
    console.log(changesObj)
    var doRefresh = false


    if (changesObj.planId 
      || (changesObj.optimizationState && changesObj.optimizationState.currentValue == 'COMPLETED')
      || (changesObj.rOptimizationState && changesObj.rOptimizationState.currentValue == 'COMPLETED')) {
      
      this.$timeout(() => {this.refreshData()}, 0)
    }
  }

  refreshData () {
    if (!this.planId) {
      console.error('Plan ID not available')
      return
    }
    console.log('refresh data')
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

NetworkBuildRoicReportsController.$inject = ['$http', '$timeout', 'state']

let networkBuildRoicReports = {
  templateUrl: '/components/sidebar/analysis/roic-reports/common-roic-reports.html',
  bindings: {
    planId: '<',
    optimizationState: '<',
    rOptimizationState: '<', 
    reportSize: '<',
    isLocation: '<'
  },
  controller: NetworkBuildRoicReportsController
}

export default networkBuildRoicReports
