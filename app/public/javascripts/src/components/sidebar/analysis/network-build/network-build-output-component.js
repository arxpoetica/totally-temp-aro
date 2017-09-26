class NetworkBuildOutputController {

  constructor($http, state) {
    this.state = state
    this.$http = $http
    this.networkBuildSummary = {}

    state.plan
    .subscribe((plan) => {
      this.plan = plan

      this.getNetworkBuildReport()
    })
  }

  getNetworkBuildReport() {
    this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
      this.networkBuildSummary = response.data
    })  
  }

}

NetworkBuildOutputController.$inject = ['$http','state']

app.component('networkBuildOutput', {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-output-component.html',
  bindings: {},
  controller: NetworkBuildOutputController
})    