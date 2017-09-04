class NetworkBuildController {

    constructor($rootScope,$http,state,optimization,regions) {
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
                var locationIds = Array.from(selectedLocations).slice(0, 9) // Only get addresses for a few locations
                $http.post('/network_plan/targets/addresses', { locationIds: locationIds })
                    .then((result) => {
                        if (result.status >= 200 && result.status <= 299) {
                            this.targets = result.data
                        }
                    })
            })

        $rootScope.$on('map_layer_clicked_feature', (event, options, map_layer) => {
            if (options) {
                // Get a list of ids to add and remove
                var existingIds = state.selectedLocations.getValue()
                var idsToAdd = new Set(), idsToRemove = new Set()
                options.forEach((option) => {
                    if (existingIds.has(+option.location_id)) {
                        idsToRemove.add(+option.location_id)
                    } else {
                        idsToAdd.add(+option.location_id)
                    }
                })
                // Make these changes to the database, then reload targets from the DB
                var addRemoveTargetPromises = [
                    $http.post(`/network_plan/${state.planId}/addTargets`, { locationIds: Array.from(idsToAdd) }),
                    $http.post(`/network_plan/${state.planId}/removeTargets`, { locationIds: Array.from(idsToRemove) })
                ]
                Promise.all(addRemoveTargetPromises)
                    .then((response) => {
                        // Reload selected locations from database
                        state.reloadSelectedLocations()
                    })
            }
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
        this.optimization.setMode('boundaries')

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

NetworkBuildController.$inject = ['$rootScope','$http','state','optimization','regions']

app.component('networkBuild', {
    templateUrl: '/javascripts/src/components/views/network-build.html',
    bindings: {},
    controller: NetworkBuildController
})    