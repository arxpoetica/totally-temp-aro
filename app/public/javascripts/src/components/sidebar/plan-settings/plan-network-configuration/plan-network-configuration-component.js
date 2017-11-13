class PlanNetworkConfigurationController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedRoutingMode = 'DIRECT_ROUTING'
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }

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
          this.state.saveNetworkConfigurationToServer()
        }
      })
    }
  }

}

PlanNetworkConfigurationController.$inject = ['$http', 'state']

app.component('planNetworkConfiguration', {
  templateUrl: '/components/sidebar/plan-settings/plan-network-configuration/plan-network-configuration-component.html',
  bindings: {
    projectId: '<',
    userId: '<',
    planId: '<'
  },
  controller: PlanNetworkConfigurationController
})