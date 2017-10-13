class PlanNetworkConfigurationController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.networkConfigurations = this.pristineNetworkConfigurations = {}
    this.selectedRoutingMode = 'DIRECT_ROUTING'
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })
  }

  $onInit() {
    this.loadNetworkConfigurationFromServer()
  }

  $onDestroy() {
    // If any selections have been changed, ask the user if they want to save them
    if (this.isDirty) {
      if (this.areAllSelectionsValid()) {
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
            this.saveToServer()
          }
          this.isDirty = false  // Technically not required since we are in $onDestroy
        })
      } else {
        // All selections are not valid
        swal({
          title: 'Invalid selections',
          text: 'The resource selections are not valid. Correct them before trying to save your changes.',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: '#DD6B55'
        })
      }
    }
  }

  loadNetworkConfigurationFromServer() {
    this.$http.get(`/service/v1/project/${this.projectId}/network_configuration?user_id=${this.userId}`)
      .then((result) => {
        this.networkConfigurations = {}
        result.data.forEach((networkConfiguration) => {
          this.networkConfigurations[networkConfiguration.routingMode] = networkConfiguration
        })
        this.pristineNetworkConfigurations = angular.copy(this.networkConfigurations)
      })
      .catch((err) => console.log(err))
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