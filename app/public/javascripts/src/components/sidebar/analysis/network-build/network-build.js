class NetworkBuildController {

  constructor($http, state, optimization) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.targets = []
    this.targetsTotal = 0
    this.serviceAreas = []
    this.analysisAreas = []
    this.config = config

    this.areControlsEnabled = true
    //this.budgetDisplay = this.state.optimizationOptions.budget / 1000
    this.budgetDisplay = this.state.optimizationOptions.budget
    
    this.selectionModeLabels = {}
    this.selectionModeLabels[state.selectionModes.SELECTED_AREAS] = 'Service Areas'
    this.selectionModeLabels[state.selectionModes.SELECTED_ANALYSIS_AREAS] = 'Analysis Areas'
    this.selectionModeLabels[state.selectionModes.SELECTED_LOCATIONS] = 'Locations'
    
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

    this.locationsObserver = state.selectedLocations.subscribe((selectedLocations) => {
      // The selected locations have changed. Get the count and addresses that we want to show
      if (state.optimizationOptions.analysisSelectionMode != state.selectionModes.SELECTED_LOCATIONS) return
      this.targetsTotal = selectedLocations.size
      var locationIds = Array.from(selectedLocations) // Only get addresses for a few locations
      $http.post('/network_plan/targets/addresses', { locationIds: locationIds })
      .then((result) => {
        this.targets = result.data
      })
      .catch(err => console.error(err))
    })
  }

  onSelectionTypeChange(selectionType) {
    this.state.selectionTypeChanged.next(selectionType)
  } 
  
  onBudgetChange(){
    //this.state.optimizationOptions.budget = this.budgetDisplay * 1000
    this.state.optimizationOptions.budget = this.budgetDisplay
  }

  $onDestroy() {
    this.locationsObserver.unsubscribe()
  }

  $onChanges(changesObj) {
    if (changesObj.selection) {
      // The selected service areas have changed.
      var serviceAreaIds = Array.from(this.state.selection.planTargets.serviceAreaIds)
      this.$http.post('/network_plan/service_area/addresses', { serviceAreaIds: serviceAreaIds })
        .then((result) => {
          this.serviceAreas = result.data
        })
        .catch(err => console.error(err))
      
      // The selected analysis areas have changed.
      var analysisAreaIds = Array.from(this.state.selection.planTargets.analysisAreaIds)
      this.$http.post('/network_plan/analysis_area/addresses', { analysisAreaIds: analysisAreaIds })
        .then((result) => {
          this.analysisAreas = result.data
        })
        .catch(err => console.error(err))
    }
  }
}

NetworkBuildController.$inject = ['$http', 'state', 'optimization']

let networkBuild = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build.html',
  bindings: {
    selection: '<',
    removeTarget: '&', 
    zoomTarget: '&',
    removeServiceArea: '&',
    removeAnalysisAreas: '&'
  },
  controller: NetworkBuildController
}

export default networkBuild