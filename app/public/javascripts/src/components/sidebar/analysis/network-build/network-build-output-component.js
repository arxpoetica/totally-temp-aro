class NetworkBuildOutputController {

  constructor($http, state, map_tools) {
    this.state = state
    this.$http = $http
    this.map_tools = map_tools
    this.networkBuildSummary = {}
    this.config = config

    state.plan
    .subscribe((plan) => {
      this.plan = plan
      if(plan.planState === 'COMPLETED')
        this.getNetworkBuildReport()
    })
  }

  getNetworkBuildReport() {
    this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
      this.networkBuildSummary = response.data
    })  
  }

  showDetailedOutput() {
    var financialProfileConfig = {
      id: 'financial_profile',
      name: 'Financial Profile',
      short_name: 'F',
      icon: 'fa fa-line-chart fa-2x'
    }
    this.map_tools.toggle(financialProfileConfig)
  }

}

NetworkBuildOutputController.$inject = ['$http','state','map_tools']

app.component('networkBuildOutput', {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-output-component.html',
  bindings: {},
  controller: NetworkBuildOutputController
})    