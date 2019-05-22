import { createSelector } from 'reselect'
import Constants from '../../common/constants'
import SelectionModes from '../../../react/components/selection/selection-modes'
import SelectionActions from '../../../react/components/selection/selection-actions'

// Get a copy of selection modes as our combo box will add "objectHash" keys to the modes
const getSelectionModes = state => state.selection.selectionModes
const getAllSelectionModes = createSelector([getSelectionModes], (selectionModes) => angular.copy(selectionModes))

class NetworkAnalysisBuildController {
  constructor ($http, $timeout, $ngRedux, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.$ngRedux = $ngRedux
    this.state = state
    this.targets = []
    this.targetsTotal = 0
    this.serviceAreas = []
    this.analysisAreas = []
    this.rateReachCategories = []
    this.toggleAdvanceSettings = false

    this.areControlsEnabled = true
    this.budgetDisplay = this.state.optimizationOptions.budget
    this.SelectionModes = SelectionModes
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  areControlsEnabled () {
    return (this.state.plan.planState === Constants.PLAN_STATE.START_STATE) || (this.state.plan.planState === Constants.PLAN_STATE.INITIALIZED)
  }

  onSelectionTypeChange (selectionType) {
    this.setSelectionTypeById(selectionType)
  }

  onBudgetChange () {
    // this.state.optimizationOptions.budget = this.budgetDisplay * 1000
    this.state.optimizationOptions.budget = this.budgetDisplay
  }

  onFiberClicked() {
    this.state.optimizationOptions.technologies.Fiber.checked = !this.state.optimizationOptions.technologies.Fiber.checked
    // Disable advanced analysis
    if (this.state.optimizationOptions.technologies.Fiber.checked) {
      this.state.optimizationOptions.networkConstraints.advancedAnalysis = false
    }
  }

  onFiveGClicked() {
    this.state.optimizationOptions.technologies.FiveG.checked = !this.state.optimizationOptions.technologies.FiveG.checked
    // Disable advanced analysis and Copper
    if (this.state.optimizationOptions.technologies.FiveG.checked) {
      this.state.optimizationOptions.networkConstraints.advancedAnalysis = false
      this.state.optimizationOptions.technologies.Copper.checked = false
    }
  }

  onCopperClicked() {
    this.state.optimizationOptions.technologies.Copper.checked = !this.state.optimizationOptions.technologies.Copper.checked
    // Disable advanced analysis and 5G
    if (this.state.optimizationOptions.technologies.Copper.checked) {
      this.state.optimizationOptions.networkConstraints.advancedAnalysis = false
      this.state.optimizationOptions.technologies.FiveG.checked = false
    }
  }

  onAdvancedAnalysisClicked() {
    // If "Advanced Analysis" is enabled, disable all other technology types
    this.state.optimizationOptions.networkConstraints.advancedAnalysis = !this.state.optimizationOptions.networkConstraints.advancedAnalysis
    if (this.state.optimizationOptions.networkConstraints.advancedAnalysis) {
      this.state.optimizationOptions.technologies.Fiber.checked = false
      this.state.optimizationOptions.technologies.FiveG.checked = false
      this.state.optimizationOptions.technologies.Copper.checked = false
    }
  }

  $onInit() {
    // Get the list of available speeds for the currently selected rate reach manager
    const selectedRateReachManagerId = this.state.resourceItems.rate_reach_manager.selectedManager.id
    this.$http.get(`/service/rate-reach-matrix/resource/${selectedRateReachManagerId}/config`)
      .then(result => {
        this.rateReachCategories = result.data.categories
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  $onDestroy () {
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

NetworkAnalysisBuildController.$inject = ['$http', '$timeout', '$ngRedux', 'state']

let networkAnalysisBuild = {
  templateUrl: '/components/sidebar/analysis/network-analysis-build.html',
  bindings: {
    selection: '<',
    removeTarget: '&',
    zoomTarget: '&'
  },
  controller: NetworkAnalysisBuildController
}

export default networkAnalysisBuild
