class CoverageInitializerController {
  constructor(state, $http, $timeout) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.spatialEdgeTypes = [
      { id: 'road', name: 'Roads' },
      { id: 'copper', name: 'Copper' },
      { id: 'fiber', name: 'Fiber' }
    ]
    this.coverageTypes = [
      { id: 'census_block', name: 'Form 477' },
      { id: 'location', name: 'Locations' }
    ]
    this.coveragePlan = {
      coverageType: 'census_block',
      saveSiteCoverage: false,
      useMarketableTechnologies: true,
      useMaxSpeed: true
    }

    this.isInitializingReport = false
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

  initializeCoverageReport() {
    // Format the coverage report that so it can be sent over to aro-service
    var serviceCoveragePlan = {
      coverageAnalysisRequest: angular.copy(this.coveragePlan)
    }
    serviceCoveragePlan.coverageAnalysisRequest.planId = this.planId
    serviceCoveragePlan.coverageAnalysisRequest.projectTemplateId = this.state.loggedInUser.projectId
    serviceCoveragePlan.coverageAnalysisRequest.distanceThreshold = this.coveragePlan.distanceThreshold * this.state.configuration.units.length_units_to_meters
    serviceCoveragePlan.coverageAnalysisRequest.analysisSelectionMode = this.state.optimizationOptions.analysisSelectionMode
    serviceCoveragePlan.coverageAnalysisRequest.locationTypes = this.state.locationTypes.getValue().map(item => item.plannerKey)
    if (this.state.optimizationOptions.analysisSelectionMode === this.state.selectionModes.SELECTED_ANALYSIS_AREAS) {
      // If we have analysis areas selected, we can have exactly one analysis layer selected in the UI
      const visibleAnalysisLayers = this.state.boundaries.tileLayers.filter(item => item.visible && (item.type === 'analysis_layer'))
      if (visibleAnalysisLayers.length !== 1) {
        const errorMessage = 'You must have exactly one analysis layer selected to initialize the coverage report'
        swal({
          title: 'Analysis Layer error',
          text: errorMessage,
          type: 'error',
          closeOnConfirm: true
        })
        throw errorMessage
      }
      serviceCoveragePlan.coverageAnalysisRequest.analysisLayerId = visibleAnalysisLayers[0].analysisLayerId
    }
    var createdCoveragePlan = null
    this.isInitializingReport = true
    console.log(serviceCoveragePlan)
    this.$http.post(`/service/coverage/report`, serviceCoveragePlan)
      .then((result) => {
        createdCoveragePlan = result.data
        return this.$http.post(`/service/coverage/report/${createdCoveragePlan.reportId}/init?user_id=${this.state.loggedInUser.id}`, {})
      })
      .then(() => this.$http.post(`/service/coverage/report/${createdCoveragePlan.reportId}/process?user_id=${this.state.loggedInUser.id}`, {}))
      .then(() => {
        this.onCoverageInitialized()
        this.isInitializingReport = false
        this.$timeout()
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
