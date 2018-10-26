class CoverageInitializerController {
  constructor(state, $http) {
    this.state = state
    this.$http = $http
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
  }

  initializeCoverageReport() {
    // Format the coverage report that so it can be sent over to aro-service
    var serviceCoveragePlan = {
      coverageAnalysisRequest: angular.copy(this.coveragePlan)
    }
    serviceCoveragePlan.coverageAnalysisRequest.planId = this.planId
    serviceCoveragePlan.coverageAnalysisRequest.projectTemplateId = this.state.loggedInUser.projectId
    serviceCoveragePlan.coverageAnalysisRequest.distanceThreshold = this.coveragePlan.distanceThreshold * this.state.configuration.units.length_units_to_meters
    var createdCoveragePlan = null
    this.$http.post(`/service/coverage/report`, serviceCoveragePlan)
      .then((result) => {
        createdCoveragePlan = result.data
        console.log(createdCoveragePlan)
        return this.$http.post(`/service/coverage/report/${createdCoveragePlan.reportId}/init?user_id=${this.state.loggedInUser.id}`, {})
      })
      .then(() => this.$http.post(`/service/coverage/report/${createdCoveragePlan.reportId}/process?user_id=${this.state.loggedInUser.id}`, {}))
      .then(() => this.onCoverageInitialized())
      .catch(err => console.error(err))
  }
}

CoverageInitializerController.$inject = ['state', '$http']

let coverageInitializer = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-initializer.html',
  bindings: {
    planId: '<',
    onCoverageInitialized: '&'
  },
  controller: CoverageInitializerController
}

export default coverageInitializer
