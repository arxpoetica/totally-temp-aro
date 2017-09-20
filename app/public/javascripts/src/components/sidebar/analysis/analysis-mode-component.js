class AnalysisModeController {

  constructor($scope,$rootScope,$http,state,optimization) {
    this.state = state
    this.optimization = optimization
    this.canceler = null
    this.$scope = $scope

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
      state.requestPanToMap.next({ lat: target.lat, lng: target.lng, zoom:18 })
    }

    this.removeTarget = (target) => {
      $http.post(`/network_plan/${this.plan.id}/removeTargets`, { locationIds: [target.id] })
        .then((response) => {
          this.state.reloadSelectedLocations()
        })
    }

    this.removeServiceArea = (target) => {
      $http.post(`/service_areas/${this.plan.id}/removeServiceAreaTargets`, { serviceAreaIds: [target.id] })
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

AnalysisModeController.$inject = ['$scope','$rootScope','$http','state','optimization']

app.component('analysisMode', {
  templateUrl: '/components/sidebar/analysis/analysis-mode-component.html',
  bindings: {},
  controller: AnalysisModeController
})

