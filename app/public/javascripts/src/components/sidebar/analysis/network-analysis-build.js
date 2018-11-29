class NetworkAnalysisBuildController {

  constructor($http, state, optimization) {
    this.$http = $http
    this.state = state
    this.optimization = optimization
    this.targets = []
    this.targetsTotal = 0
    this.serviceAreas = []
    this.analysisAreas = []
    this.config = config
    this.toggleAdvanceSettings = false

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
  }

  onSelectionTypeChange(selectionType) {
    this.state.selectionTypeChanged.next(selectionType)
  } 
  
  onBudgetChange(){
    //this.state.optimizationOptions.budget = this.budgetDisplay * 1000
    this.state.optimizationOptions.budget = this.budgetDisplay
  }

  $onChanges(changesObj) {
    if (changesObj.selection) {
      // The selected locations have changed. Get the count and addresses that we want to show
      this.targetsTotal = this.state.selection.planTargets.locationIds.size
      var locationIds = Array.from(this.state.selection.planTargets.locationIds) // Only get addresses for a few locations
      this.$http.post('/network_plan/targets/addresses', { locationIds: locationIds })
        .then((result) => {
          this.targets = result.data
        })
        .catch(err => console.error(err))

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

NetworkAnalysisBuildController.$inject = ['$http', 'state', 'optimization']

let networkAnalysisBuild = {
  templateUrl: '/components/sidebar/analysis/network-analysis-build.html',
  bindings: {
    selection: '<',
    removeTarget: '&', 
    zoomTarget: '&',
    removeServiceArea: '&',
    removeAnalysisAreas: '&'
  },
  controller: NetworkAnalysisBuildController
}

export default networkAnalysisBuild