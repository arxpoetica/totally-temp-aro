class NetworkAnalysisOutputController {

  constructor($scope,$rootScope, $http, state, optimization, regions) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.regions = regions
    
    this.showOutput = () => {
      state.showNetworkAnalysisOutput.next(true)
    }

    state.splitterObj
    .subscribe((splitterObj) => {
      this.splitterObj = splitterObj
    })
    
  }

}

NetworkAnalysisOutputController.$inject = ['$scope','$rootScope', '$http', 'state', 'optimization', 'regions']

app.component('networkAnalysisOutput', {
  templateUrl: '/javascripts/src/components/views/network-analysis-output.html',
  bindings: {},
  controller: NetworkAnalysisOutputController
})    