class NetworkAnalysisOutputController {

  constructor($scope,$rootScope, $http, state, optimization, regions) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.regions = regions

    $rootScope.$on('plan_selected', planChanged)

    function planChanged(e, plan) {
      $scope.plan = plan
      if (!plan) return
    }

    this.showOutput1 = () => {
      $http.get(`/reports/network_analysis/${$scope.plan.id}/optimization_analysis`).then((response) => {
        response
      })   

    }
    
    this.showOutput = () => {
      state.showNetworkAnalysisOutput.next(true)
    }
  }

}

NetworkAnalysisOutputController.$inject = ['$scope','$rootScope', '$http', 'state', 'optimization', 'regions']

app.component('networkAnalysisOutput', {
  templateUrl: '/javascripts/src/components/views/network-analysis-output.html',
  bindings: {},
  controller: NetworkAnalysisOutputController
})    