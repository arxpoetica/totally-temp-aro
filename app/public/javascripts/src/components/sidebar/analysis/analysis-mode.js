class AnalysisModeController {

  constructor($scope, $rootScope, $http, state, optimization, tracker) {
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

    state.plan
      .subscribe((plan) => {
        this.plan = plan
      })

    this.zoomTarget = (target) => {
      state.requestSetMapCenter.next({ latitude: target.lat, longitude: target.lng})
    }

    this.removeTarget = (target) => {
      $http.post(`/network_plan/${this.plan.id}/removeTargets`, { locationIds: target.map((loc) => loc.id) })
        .then((response) => {
          this.state.reloadSelectedLocations()
        })
    }

    this.removeServiceArea = (target) => {
      $http.post(`/service_areas/${this.plan.id}/removeServiceAreaTargets`, { serviceAreaIds: target.map((sa) => sa.id) })
        .then((response) => {
          this.state.reloadSelectedServiceAreas()
        })
    }

    this.validateRunButton = () => {
      // yet to check weather serviceArea/locations are selected or not once service area selection is done
      return state.selectedLocations.getValue().size > 0 ? true : false
    }
  }

  expandAccordion(expandedAccordionIndex) {
    this.expandedAccordionIndex = expandedAccordionIndex
  }
}

AnalysisModeController.$inject = ['$scope', '$rootScope', '$http', 'state', 'optimization', 'tracker']

let analysisMode = {
  templateUrl: '/components/sidebar/analysis/analysis-mode.html',
  bindings: {},
  controller: AnalysisModeController
}

export default analysisMode

