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
    if (!angular.equals(this.networkConfigurations, this.pristineNetworkConfigurations)) {
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
          var configSavePromises = []
          Object.keys(this.networkConfigurations).forEach((networkConfigurationKey) => {
            // Only add the network configurations that have changed (e.g. DIRECT_ROUTING)
            if (!angular.equals(this.networkConfigurations[networkConfigurationKey], this.pristineNetworkConfigurations[networkConfigurationKey])) {
              var url = `/service/v1/project/${this.projectId}/network_configuration/${networkConfigurationKey}?user_id=${this.userId}`
              configSavePromises.push(this.$http.put(url, this.networkConfigurations[networkConfigurationKey]))
            }
          })
          Promise.all(configSavePromises)
        }
      })
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