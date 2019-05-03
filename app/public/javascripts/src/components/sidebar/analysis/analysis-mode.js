class AnalysisModeController {
  constructor ($scope, $http, $ngRedux, state, tracker) {
    this.state = state
    this.canceler = null
    this.$scope = $scope
    tracker.trackEvent(tracker.CATEGORIES.ENTER_ANALYSIS_MODE, tracker.ACTIONS.CLICK)

    $scope.plan = null

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

    state.plan.subscribe((plan) => {
      this.plan = plan
    })
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
    return {}
  }
}

AnalysisModeController.$inject = ['$scope', '$http', '$ngRedux', 'state', 'tracker']

let analysisMode = {
  templateUrl: '/components/sidebar/analysis/analysis-mode.html',
  bindings: {},
  controller: AnalysisModeController
}

export default analysisMode
