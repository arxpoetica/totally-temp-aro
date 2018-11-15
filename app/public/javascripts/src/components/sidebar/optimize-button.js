class OptimizeButtonController {
  constructor(state) {
    this.state = state
  }

  areInputsComplete() {
    // First, check if the selected targets are valid. E.g. if the user has selected Service Areas, then at least one service area must be selected.
    const areLocationsValid = (this.state.selection.planTargets.locationIds.size > 0)
                              && (this.state.optimizationOptions.analysisSelectionMode === this.state.selectionModes.SELECTED_LOCATIONS)
    const areServiceAreasValid = (this.state.selection.planTargets.serviceAreaIds.size > 0)
                                 && (this.state.optimizationOptions.analysisSelectionMode === this.state.selectionModes.SELECTED_AREAS)
    const areAnalysisAreasValid = (this.state.selection.planTargets.analysisAreaIds.size > 0)
                                  && (this.state.optimizationOptions.analysisSelectionMode === this.state.selectionModes.SELECTED_ANALYSIS_AREAS)
    const isTargetSelectionValid = areLocationsValid || areServiceAreasValid || areAnalysisAreasValid

    // Check if at least one location type is selected for optimization
    const isLocationInputValid = this.state.locationInputSelected('business') || this.state.locationInputSelected('household') || this.state.locationInputSelected('celltower')

    return isTargetSelectionValid && isLocationInputValid
  }

  saveExpertMode(){
    this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertMode.OPTIMIZATION_SETTINGS))
  }

}

OptimizeButtonController.$inject = ['state']

let optimizeButton = {
  templateUrl: '/components/sidebar/optimize-button.html',
  bindings: {},
  controller: OptimizeButtonController
}

export default optimizeButton