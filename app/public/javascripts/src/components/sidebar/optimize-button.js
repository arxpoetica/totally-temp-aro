import Constants from '../common/constants'
import SelectionModes from '../../react/components/selection/selection-modes'

class OptimizeButtonController {
  constructor ($ngRedux, state) {
    this.state = state
    this.Constants = Constants
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  areInputsComplete () {
    // First, check if the selected targets are valid. E.g. if the user has selected Service Areas, then at least one service area must be selected.
    const areLocationsValid = (this.planTargets.locations.size > 0) &&
                              (this.activeSelectionModeId === SelectionModes.SELECTED_LOCATIONS)
    const areServiceAreasValid = (this.planTargets.serviceAreas.size > 0) &&
                                 (this.activeSelectionModeId === SelectionModes.SELECTED_AREAS)
    const areAnalysisAreasValid = (this.planTargets.analysisAreas.size > 0) &&
                                  (this.activeSelectionModeId === SelectionModes.SELECTED_ANALYSIS_AREAS)
    const isTargetSelectionValid = areLocationsValid || areServiceAreasValid || areAnalysisAreasValid

    // Check if at least one location type is selected for optimization
    const isLocationInputValid = this.state.locationInputSelected('business') || this.state.locationInputSelected('household') || this.state.locationInputSelected('celltower')

    return isTargetSelectionValid && isLocationInputValid
  }

  saveExpertMode () {
    this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertMode.OPTIMIZATION_SETTINGS))
  }

  // Map global state to component properties
  mapStateToThis (reduxState) {
    return {
      activeSelectionModeId: reduxState.selection.activeSelectionMode.id,
      planTargets: reduxState.selection.planTargets,
      connectivityDefinition: reduxState.optimization.networkAnalysis.connectivityDefinition
    }
  }

  mapDispatchToTarget (dispatch) {
    return { }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

OptimizeButtonController.$inject = ['$ngRedux', 'state']

let optimizeButton = {
  templateUrl: '/components/sidebar/optimize-button.html',
  bindings: {},
  controller: OptimizeButtonController
}

export default optimizeButton
