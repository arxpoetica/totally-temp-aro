import StateCoverage from '../../models/state-coverage'

class CoverageButtonController {
  constructor(state, $http) {
    this.state = state
    this.$http = $http
    this.ButtonStates = Object.freeze({
      READY: 'READY',
      INITIALIZING: 'INITIALIZING',
      INITIALIZED: 'INITIALIZED',
      DELETING: 'DELETING'
    })
    this.buttonState = this.ButtonStates.READY
  }

  initializeCoverageReport() {
    // Format the coverage report that so it can be sent over to aro-service
    var serviceCoveragePlan = {
      coverageAnalysisRequest: angular.copy(this.state.coverage.initParams)
    }
    serviceCoveragePlan.coverageAnalysisRequest.planId = this.state.plan.getValue().id
    serviceCoveragePlan.coverageAnalysisRequest.projectTemplateId = this.state.loggedInUser.projectId
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
    this.buttonState = this.ButtonStates.INITIALIZING
    this.$http.post(`/service/coverage/report`, serviceCoveragePlan)
      .then((result) => {
        createdCoveragePlan = result.data
        return this.$http.post(`/service/coverage/report/${createdCoveragePlan.reportId}/init?user_id=${this.state.loggedInUser.id}`, {})
      })
      .then(() => this.$http.post(`/service/coverage/report/${createdCoveragePlan.reportId}/process?user_id=${this.state.loggedInUser.id}`, {}))
      .then(() => {
        this.buttonState = this.ButtonStates.INITIALIZED
        this.$timeout()
      })
      .catch(err => {
        console.error(err)
        this.buttonState = this.ButtonStates.READY
      })
  }

  modifyCoverageReport() {
    this.buttonState = this.ButtonStates.DELETING
    this.$http.delete(`/service/coverage/report/${this.state.coverage.report.reportId}`)
      .then(result => {
        this.buttonState = this.ButtonStates.READY
        StateCoverage.initializeCoverage(this.state)
        this.$timeout()
      })
      .catch(err => console.error(err))
  }
}

CoverageButtonController.$inject = ['state', '$http']

let coverageButton = {
  templateUrl: '/components/sidebar/coverage-button.html',
  bindings: {},
  controller: CoverageButtonController
}

export default coverageButton