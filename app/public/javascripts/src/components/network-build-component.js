class NetworkBuildController {

    constructor(state,optimization) {
        this.state = state
        this.optimization = optimization

        this.initializeConfigurations()
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
        this.optimization.setMode('boundaries')
    }

}

NetworkBuildController.$inject = ['state','optimization']

app.component('networkBuild', {
    templateUrl: '/javascripts/src/components/views/network-build.html',
    bindings: {},
    controller: NetworkBuildController
})    