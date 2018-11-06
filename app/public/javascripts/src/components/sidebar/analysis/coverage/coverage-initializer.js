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
      { id: 'census_block', name: 'Census Blocks' },
      { id: 'location', name: 'Locations' }
    ]
    this.coveragePlan = {
      coverageType: 'census_block',
      distanceThreshold: 20000,
      spatialEdgeType: 'road'
    }
    this.isInitializingReport = false
    this.serviceAreas = []
    this.analysisAreas = []
    this.selectionModeLabels = {}
    this.selectionModeLabels[state.selectionModes.SELECTED_AREAS] = 'Service Areas'
    this.selectionModeLabels[state.selectionModes.SELECTED_ANALYSIS_AREAS] = 'Analysis Areas'
    this.selectionModeLabels[state.selectionModes.SELECTED_LOCATIONS] = 'Locations'

    this.serviceAreasObserver = state.selectedServiceAreas.subscribe((selectedServiceAreas) => {
      // The selected SA have changed.
      if (state.optimizationOptions.analysisSelectionMode != state.selectionModes.SELECTED_AREAS) return
      //console.log(selectedServiceAreas)
      var serviceAreaIds = Array.from(selectedServiceAreas)
      $http.post('/network_plan/service_area/addresses', { serviceAreaIds: serviceAreaIds })
      .then((result) => {
        this.serviceAreas = result.data
      })
      .catch(err => console.error(err))
    })  
    
    this.analysisAreasObserver = state.selectedAnalysisAreas.subscribe((selectedAnalysisAreas) => {
      // The selected analysis areas have changed.
      if (state.optimizationOptions.analysisSelectionMode != state.selectionModes.SELECTED_ANALYSIS_AREAS) return
      var analysisAreaIds = Array.from(selectedAnalysisAreas)
      $http.post('/network_plan/analysis_area/addresses', { analysisAreaIds: analysisAreaIds })
      .then((result) => {
        this.analysisAreas = result.data
      })
      .catch(err => console.error(err))
    })
  }

  onSelectionTypeChange(selectionType) {
    this.state.selectionTypeChanged.next(selectionType)
  } 

  removeServiceAreas(target) {
    $http.post(`/service_areas/${this.plan.id}/removeServiceAreaTargets`, { serviceAreaIds: target.map((sa) => sa.id) })
    .then((response) => {
      this.state.reloadSelectedServiceAreas()
    })
    .catch(err => console.error(err))
  }

  removeAnalysisAreas(target) {
    $http.post(`/analysis_areas/${this.plan.id}/removeAnalysisAreaTargets`, { analysisAreaIds: target.map((sa) => sa.id) })
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

  $onDestroy() {
    this.serviceAreasObserver.unsubscribe()
    this.analysisAreasObserver.unsubscribe()
  }
}

CoverageInitializerController.$inject = ['state', '$http', '$timeout']

let coverageInitializer = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-initializer.html',
  bindings: {
    planId: '<',
    onCoverageInitialized: '&'
  },
  controller: CoverageInitializerController
}

export default coverageInitializer
