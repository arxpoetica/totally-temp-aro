class NetworkBuildController {

  constructor($http, state, optimization) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.targets = []
    this.targetsTotal = 0
    this.serviceAreas = []
    this.config = config

    this.areControlsEnabled = true
    
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === 'START_STATE') || (newPlan.planState === 'INITIALIZED')
      }
    })

    state.planOptimization.subscribe((newPlan) => {
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

  onSelectionTypeChange(selectionType) {
    this.state.selectionTypeChanged.next(selectionType)
  } 

}

NetworkBuildController.$inject = ['$http', 'state', 'optimization']

let networkBuild = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build.html',
  bindings: {
    removeTarget: '&', 
    zoomTarget: '&',
    removeServiceArea: '&'
  },
  controller: NetworkBuildController
}

export default networkBuild