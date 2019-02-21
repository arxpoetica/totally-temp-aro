class AnalysisModeController {

  constructor($scope, $http, $ngRedux, state, optimization, tracker) {
    this.state = state
    this.optimization = optimization
    this.canceler = null
    this.$scope = $scope
    tracker.trackEvent(tracker.CATEGORIES.ENTER_ANALYSIS_MODE, tracker.ACTIONS.CLICK)

    $scope.plan = null

    this.accordions = Object.freeze({
      INPUT: 0,
      OUTPUT: 1
    })

    this.expandedAccordionIndex = this.accordions.INPUT

    state.plan.subscribe((plan) => {
      this.plan = plan
    })
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  expandAccordion(expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }

  $onDestroy() {
    this.unsubscribeRedux()
  }

  // Map global state to component properties
  mapStateToThis(state) {
    return {
      coverageReport: state.coverage.report
    }
  }

  mapDispatchToTarget(dispatch) {
    return {}
  }
}

AnalysisModeController.$inject = ['$scope', '$http', '$ngRedux', 'state', 'optimization', 'tracker']

let analysisMode = {
  templateUrl: '/components/sidebar/analysis/analysis-mode.html',
  bindings: {},
  controller: AnalysisModeController
}

export default analysisMode

