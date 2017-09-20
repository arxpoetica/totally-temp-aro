class NetworkAnalysisOutputController {

  constructor($scope,$rootScope, $http, state, optimization, regions) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.regions = regions
    this.plan = null
    
    this.showOutput = () => {
      state.showNetworkAnalysisOutput.next(true)
    }

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })

    state.splitterObj
    .subscribe((splitterObj) => {
      this.splitterObj = splitterObj
    })

    this.downloadChart = () => {
      if (!this.plan) return
      window.location.href = `/reports/network_analysis/download/${this.plan.id}/optimization_analysis`
    }
    
  }

}

NetworkAnalysisOutputController.$inject = ['$scope','$rootScope', '$http', 'state', 'optimization', 'regions']

app.component('networkAnalysisOutput', {
  templateUrl: '/components/sidebar/analysis/network-analysis/network-analysis-output-component.html',
  bindings: {},
  controller: NetworkAnalysisOutputController
})    