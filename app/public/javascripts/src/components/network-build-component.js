class NetworkBuildController {

  constructor($rootScope, $http, state, optimization, regions) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.regions = regions
    this.targets = []
    this.targetsTotal = 0
    this.selectedLocations = new Set()
    this.plan = null

    this.toogleTableView = false

    this.initializeConfigurations()

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

      state.plan
      .subscribe((plan) => {
        this.plan = plan
      })

      this.zoomTarget = (target) => {
        map.setZoom(18)
        map.panTo({lat:target.lat,lng:target.lng})
      }
    
      this.removeTarget = (target) => {
        this.$http.post(`/network_plan/${this.plan.id}/removeTargets`, { locationIds: [target.id] })
        .then((response) => {
          this.state.reloadSelectedLocations()
        })
      }
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

    this.state.optimizationOptions.geographicalLayers = [
      this.state.GEOGRAPHY_LAYERS.SERVICE_AREAS,
      this.state.GEOGRAPHY_LAYERS.LOCATIONS
    ]

    this.state.optimizationOptions.selectedgeographicalLayer = this.state.optimizationOptions.geographicalLayers[0]
    this.optimization.setMode('boundaries')

    this.state.optimizationOptions.selectedTechnology = this.state.optimizationOptions.technologies[0]

  }

  removeGeography(geography) {
    this.regions.removeGeography(geography)
  }
  removeAllGeographies() {
    this.regions.removeAllGeographies()
  }

  getSelectedGeographies() {
    var selectedRegions = []
    Object.keys(this.regions.selectedRegions).forEach((key) => {
      var regionObj = this.regions.selectedRegions[key]
      selectedRegions.push({
        id: regionObj.id,
        name: regionObj.name,
        type: regionObj.type,
        layerId: regionObj.layerId
      })
    })
    return selectedRegions
  }
}

NetworkBuildController.$inject = ['$rootScope', '$http', 'state', 'optimization', 'regions']

app.component('networkBuild', {
  templateUrl: '/javascripts/src/components/views/network-build.html',
  bindings: {},
  controller: NetworkBuildController
})    