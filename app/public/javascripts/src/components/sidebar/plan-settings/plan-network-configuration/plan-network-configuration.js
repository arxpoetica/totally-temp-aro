
class PlanNetworkConfigurationController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedRoutingMode = 'DIRECT_ROUTING'
  }
  
  onSelectionChanged() {
    this.onChange({childKey:this.key, isValid:true})
  }

}

PlanNetworkConfigurationController.$inject = ['$http', 'state']

let planNetworkConfiguration = {
  templateUrl: '/components/sidebar/plan-settings/plan-network-configuration/plan-network-configuration.html',
  bindings: {
    userId: '<',
    planId: '<', 
    key: '<', 
    onChange: '&'
  },
  controller: PlanNetworkConfigurationController
}

export default planNetworkConfiguration