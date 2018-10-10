class NetworkBuildOutputController {

  constructor($http, state, map_tools) {
    this.state = state
    this.$http = $http
    this.map_tools = map_tools
    this.networkBuildSummary = {}
    this.plannedNetworkDemand = {}
    this.config = config
    this.plan = null

    state.plan.subscribe((plan) => {
      this.plan = plan
      if(plan.planState === 'COMPLETED') this.getNetworkBuildReport()
    })

    state.planOptimization.subscribe((plan) => {
      if(plan && plan.planState === 'COMPLETED') this.getNetworkBuildReport()
    })
    
  }

  getNetworkBuildReport() {
    this.$http.get(`/service/report/plan/${this.plan.id}`).then((response) => {
      this.networkBuildSummary = response.data
      this.plannedNetworkDemand = this.networkBuildSummary.demandSummary.networkDemands.filter((item) => item.demandType === 'planned_demand')[0]
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

NetworkBuildOutputController.$inject = ['$http', 'state', 'map_tools']

let networkBuildOutput = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-output.html',
  bindings: {},
  controller: NetworkBuildOutputController
}

export default networkBuildOutput