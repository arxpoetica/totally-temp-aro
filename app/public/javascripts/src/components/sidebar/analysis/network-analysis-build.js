import { createSelector } from 'reselect'
import Constants from '../../common/constants'
import SelectionModes from '../../../react/components/selection/selection-modes'
import SelectionActions from '../../../react/components/selection/selection-actions'

// Get a copy of selection modes as our combo box will add "objectHash" keys to the modes
const getSelectionModes = state => state.selection.selectionModes
const getAllSelectionModes = createSelector([getSelectionModes], (selectionModes) => angular.copy(selectionModes))

class NetworkAnalysisBuildController {

  constructor($http, $ngRedux, state, optimization) {
    this.$http = $http
    this.$ngRedux = $ngRedux
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
    
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
      }
    })

    state.planOptimization.subscribe((newPlan) => {
      if (newPlan) {
        this.areControlsEnabled = (newPlan.planState === Constants.PLAN_STATE.START_STATE) || (newPlan.planState === Constants.PLAN_STATE.INITIALIZED)
      }
    })
    this.SelectionModes = SelectionModes
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  onSelectionTypeChange(selectionType) {
    this.setSelectionTypeById(selectionType)
  } 
  
  onBudgetChange(){
    //this.state.optimizationOptions.budget = this.budgetDisplay * 1000
    this.state.optimizationOptions.budget = this.budgetDisplay
  }

  onFiberOrFiveGClicked(networkType) {
    // If Fiber or FiveG is enabled, disable advanced analysis
    this.state.optimizationOptions.technologies[networkType].checked = !this.state.optimizationOptions.technologies[networkType].checked
    if (this.state.optimizationOptions.technologies[networkType].checked) {
      this.state.optimizationOptions.networkConstraints.advancedAnalysis = false  
    }
  }

  onAdvancedAnalysisClicked() {
    // If "Advanced Analysis" is enabled, disable Fiber and 5G
    this.state.optimizationOptions.networkConstraints.advancedAnalysis = !this.state.optimizationOptions.networkConstraints.advancedAnalysis
    if (this.state.optimizationOptions.networkConstraints.advancedAnalysis) {
      Object.keys(this.state.optimizationOptions.technologies).forEach(technologyKey => {
        this.state.optimizationOptions.technologies[technologyKey].checked = false
      })
    }
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

  $onDestroy() {
    this.unsubscribeRedux()
  }

  // Map global state to component properties
  mapStateToThis (reduxState) {
    return {
      activeSelectionModeId: reduxState.selection.activeSelectionMode.id,
      allSelectionModes: getAllSelectionModes(reduxState)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setSelectionTypeById: selectionTypeId => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId))
    }
  }
}

NetworkAnalysisBuildController.$inject = ['$http', '$ngRedux', 'state', 'optimization']

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