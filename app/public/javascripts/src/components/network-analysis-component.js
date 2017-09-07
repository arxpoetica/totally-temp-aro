class NetworkAnalysisController {

    constructor($rootScope, $http, state, optimization, regions) {
        this.$http = $http
        this.state = state
        this.optimization = optimization
        this.regions = regions
        this.targets = []
        this.targetsTotal = 0

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
        //this.optimization.setMode('boundaries')

        this.state.optimizationOptions.selectedTechnology = this.state.optimizationOptions.technologies[0]

    }

    removeGeography(geography) {
        this.regions.removeGeography(geography)
    }
    removeAllGeographies() {
        this.regions.removeAllGeographies()
    }

    deleteAllTargets() {
        this.$http.delete(`/network_plan/${this.state.planId}/removeAllTargets`)
            .then((response) => {
                // Reload selected locations from database
                this.state.reloadSelectedLocations()
            })
    }

}

NetworkAnalysisController.$inject = ['$rootScope', '$http', 'state', 'optimization', 'regions']

app.component('networkAnalysis', {
    templateUrl: '/javascripts/src/components/views/network-analysis.html',
    bindings: {},
    controller: NetworkAnalysisController
})    