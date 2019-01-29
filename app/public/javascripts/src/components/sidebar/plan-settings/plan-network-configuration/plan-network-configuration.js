
class PlanNetworkConfigurationController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedRoutingMode = 'DIRECT_ROUTING'
    
  }
  
  /*
  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (!angular.equals(this.state.networkConfigurations, this.state.pristineNetworkConfigurations)) {
      swal({
        title: 'Save modified settings?',
        text: 'You have changed the network configuration. Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          // Save the changed settings to aro-service
          this.state.saveNetworkConfigurationToDefaultProject()
        }
      })
    }
  }
  */
  
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