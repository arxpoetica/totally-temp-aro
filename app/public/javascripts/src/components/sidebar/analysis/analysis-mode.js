import ReportsActions from '../../../react/components/optimization/reports/reports-actions'

class AnalysisModeController {
  constructor ($scope, $ngRedux, state, tracker) {
    this.state = state
    this.canceler = null
    this.$scope = $scope
    tracker.trackEvent(tracker.CATEGORIES.ENTER_ANALYSIS_MODE, tracker.ACTIONS.CLICK)
    this.accordions = Object.freeze({
      INPUT: 0,
      OUTPUT: 1,
      TEST: 2
    })

    this.expandedAccordionIndex = this.accordions.INPUT

    this.analysisModePanels = Object.freeze({
      INPUT: 'INPUT',
      OUTPUT: 'OUTPUT',
      TEST: 'TEST'
    })

    this.analysisModePanel = this.analysisModePanels.INPUT
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  expandAccordion (expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  // Map global state to component properties
  mapStateToThis (state) {
    return {
      coverageReport: state.coverage.report
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      showReportModal: () => dispatch(ReportsActions.showOrHideReportModal(true))
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
