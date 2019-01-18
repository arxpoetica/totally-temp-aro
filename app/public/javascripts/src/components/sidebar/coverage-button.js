import StateCoverage from '../../models/state-coverage'

class CoverageButtonController {
  constructor(state, $http, $timeout) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.isInitializingCoverage = false
    this.isModifyingCoverage = false
  }

  areInputsComplete() {

    if (this.state.coverage.initializationParams.coverageType === 'census_block') {
      return true // For census_blocks/Form477 inputs are complete even without selecting locationtypes
    }

    // Check if at least one location type is selected for optimization
    const isLocationInputValid = this.state.locationInputSelected('business') || this.state.locationInputSelected('household') || this.state.locationInputSelected('celltower')
    return isLocationInputValid
  }

  initializeCoverageReport() {
    // Format the coverage report that so it can be sent over to aro-service
    var requestBody = {
      coverageAnalysisRequest: angular.copy(this.state.coverage.initializationParams)
    }
    requestBody.coverageAnalysisRequest.planId = this.state.plan.getValue().id
    requestBody.coverageAnalysisRequest.projectTemplateId = this.state.loggedInUser.projectId
    requestBody.coverageAnalysisRequest.analysisSelectionMode = this.state.optimizationOptions.analysisSelectionMode
    requestBody.coverageAnalysisRequest.locationTypes = this.state.locationTypes.getValue()
                                                                                        .filter(item => item.checked)
                                                                                        .map(item => item.plannerKey)
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
      requestBody.coverageAnalysisRequest.analysisLayerId = visibleAnalysisLayers[0].analysisLayerId
    }
    this.isInitializingCoverage = true
    this.$http.post(`/service/coverage/report`, requestBody)
      .then((result) => {
        this.state.coverage.report = result.data
        return this.$http.post(`/service/coverage/report/${this.state.coverage.report.reportId}/init?user_id=${this.state.loggedInUser.id}`, {})
      })
      .then(() => this.$http.post(`/service/coverage/report/${this.state.coverage.report.reportId}/process?user_id=${this.state.loggedInUser.id}`, {}))
      .then(() => {
        this.isInitializingCoverage = false
        this.$timeout()
      })
      .catch(err => {
        console.error(err)
        this.isInitializingCoverage = false
        this.$timeout()
      })
  }

  modifyCoverageReport() {
    this.isModifyingCoverage = true
    this.$http.delete(`/service/coverage/report/${this.state.coverage.report.reportId}`)
      .then(result => {
        this.isModifyingCoverage = false
        StateCoverage.initializeCoverage(this.state, this.$http, this.$timeout)
        this.$timeout()
      })
      .catch(err => {
        this.isModifyingCoverage = false
        console.error(err)
        this.$timeout()
      })
  }
}

CoverageButtonController.$inject = ['state', '$http', '$timeout']

let coverageButton = {
  templateUrl: '/components/sidebar/coverage-button.html',
  bindings: {},
  controller: CoverageButtonController
}

export default coverageButton