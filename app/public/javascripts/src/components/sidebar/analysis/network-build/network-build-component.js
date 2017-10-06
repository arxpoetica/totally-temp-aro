class NetworkBuildController {

  constructor($http, state, optimization) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.targets = []
    this.targetsTotal = 0
    this.serviceAreas = []
    this.config = config

    this.initializeConfigurations()

    this.areControlsEnabled = true
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })

    state.selectedLocations
      .subscribe((selectedLocations) => {
        // The selected locations have changed. Get the count and addresses that we want to show
        this.targetsTotal = selectedLocations.size
        var locationIds = Array.from(selectedLocations) // Only get addresses for a few locations
        $http.post('/network_plan/targets/addresses', { locationIds: locationIds })
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              this.targets = result.data
            }
          })
      })

    state.selectedServiceAreas
      .subscribe((selectedServiceAreas) => {
        // The selected SA have changed.
        var serviceAreaIds = Array.from(selectedServiceAreas)
        $http.post('/network_plan/service_area/addresses', { serviceAreaIds: serviceAreaIds })
          .then((result) => {
            if (result.status >= 200 && result.status <= 299) {
              this.serviceAreas = result.data
            }
          })
      }) 
  }

  initializeConfigurations() {
    this.state.optimizationOptions.uiAlgorithms = [
      this.state.OPTIMIZATION_TYPES.UNCONSTRAINED,
      this.state.OPTIMIZATION_TYPES.MAX_IRR,
      this.state.OPTIMIZATION_TYPES.BUDGET,
      this.state.OPTIMIZATION_TYPES.IRR_TARGET,
      this.state.OPTIMIZATION_TYPES.IRR_THRESH,
      this.state.OPTIMIZATION_TYPES.COVERAGE
    ]

    this.state.optimizationOptions.uiSelectedAlgorithm = this.state.optimizationOptions.uiAlgorithms[0]

    this.state.optimizationOptions.selectedgeographicalLayer = this.state.optimizationOptions.geographicalLayers[0]
    this.optimization.setMode('boundaries')
  }
}

NetworkBuildController.$inject = ['$http', 'state', 'optimization']

app.component('networkBuild', {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-component.html',
  bindings: {
    removeTarget: '&', 
    zoomTarget: '&',
    removeServiceArea: '&'
  },
  controller: NetworkBuildController
})    