import ReportsActions from '../../../react/components/optimization/reports/reports-actions'
import NetworkOptimizationActions from '../../../react/components/optimization/network-optimization/network-optimization-actions'
import NetworkAnalysisTypes from '../../../react/components/optimization/network-optimization/network-analysis-types'
import AngConstants from '../../common/constants' // ToDo: merge constants, put in Redux?

class AnalysisModeController {
  constructor ($scope, $ngRedux, state, tracker) {
    this.NetworkAnalysisTypes = NetworkAnalysisTypes
    this.state = state
    this.canceler = null
    this.$scope = $scope
    tracker.trackEvent(tracker.CATEGORIES.ENTER_ANALYSIS_MODE, tracker.ACTIONS.CLICK)
    this.accordions = Object.freeze({
      INPUT: 0,
      OUTPUT: 1
    })

    this.expandedAccordionIndex = this.accordions.INPUT

    this.analysisModePanels = Object.freeze({
      INPUT: 'INPUT',
      OUTPUT: 'OUTPUT'
    })

    this.analysisModePanel = this.analysisModePanels.INPUT
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    var initAnalysisType = this.NetworkAnalysisTypes[0]
    this.NetworkAnalysisTypes.forEach(analysisType => {
      if (analysisType.id === this.networkAnalysisType) initAnalysisType = analysisType
    })
    this.localAnalysisType = initAnalysisType
  }

  expandAccordion (expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }

  onAnalysisTypeChange (event) {
    this.setNetworkAnalysisType(this.localAnalysisType.id)
  }

  // ToDo: this is also in network-optimization-input.jsx
  areControlsEnabled () {
    return (this.planState === AngConstants.PLAN_STATE.START_STATE) || (this.planState === AngConstants.PLAN_STATE.INITIALIZED)
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  // Map global state to component properties
  mapStateToThis (reduxState) {
    return {
      coverageReport: reduxState.coverage.report,
      networkAnalysisType: reduxState.optimization.networkOptimization.optimizationInputs.analysis_type,
      planState: reduxState.plan.activePlan.planState
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true)),
      setNetworkAnalysisType: (networkAnalysisType) => dispatch(NetworkOptimizationActions.setNetworkAnalysisType(networkAnalysisType))
    }
  }
}

AnalysisModeController.$inject = ['$scope', '$ngRedux', 'state', 'tracker']

let analysisMode = {
  templateUrl: '/components/sidebar/analysis/analysis-mode.html',
  bindings: {},
  controller: AnalysisModeController
}

export default analysisMode
