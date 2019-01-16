class CoverageInitializerController {
  constructor(state, $http, $timeout) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.coverageTypes = [
      { id: 'census_block', name: 'Form 477' },
      { id: 'location', name: 'Locations' }
    ]

    this.serviceAreas = []
    this.analysisAreas = []
    this.selectionModeLabels = {}
    this.selectionModeLabels[state.selectionModes.SELECTED_AREAS] = 'Service Areas'
    this.selectionModeLabels[state.selectionModes.SELECTED_ANALYSIS_AREAS] = 'Analysis Areas'
    this.selectionModeLabels[state.selectionModes.SELECTED_LOCATIONS] = 'Locations'

    this.allowedSelectionModes = angular.copy(state.selectionModes)
    delete this.allowedSelectionModes.SELECTED_LOCATIONS  // Do not allow locations to be a selection option
  }

  onSelectionTypeChange(selectionType) {
    this.state.selectionTypeChanged.next(selectionType)
  } 

  removeServiceAreas(targets) {
    this.$http.post(`/service_areas/${this.planId}/removeServiceAreaTargets`, { serviceAreaIds: targets.map((sa) => sa.id) })
    .then((response) => {
      this.state.reloadSelectedServiceAreas()
    })
    .catch(err => console.error(err))
  }

  removeAnalysisAreas(targets) {
    this.$http.post(`/analysis_areas/${this.planId}/removeAnalysisAreaTargets`, { analysisAreaIds: targets.map((sa) => sa.id) })
    .then((response) => {
      this.state.reloadSelectedAnalysisAreas()
    })
    .catch(err => console.error(err))
  }

  $onChanges(changesObj) {
    if (changesObj.selection) {
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
}

CoverageInitializerController.$inject = ['state', '$http', '$timeout']

let coverageInitializer = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-initializer.html',
  bindings: {
    planId: '<',
    selection: '<',
    onCoverageInitialized: '&'
  },
  controller: CoverageInitializerController
}

export default coverageInitializer
