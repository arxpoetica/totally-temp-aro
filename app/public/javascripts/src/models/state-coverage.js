class StateCoverage {

  static initializeCoverage(state, $http, $timeout) {
    state.coverage = {
      initializationParams: {
        coverageType: 'location',
        saveSiteCoverage: false,
        useMarketableTechnologies: true,
        useMaxSpeed: true
      },
      report: null
    }

    // Get the coverage report
    const planId = state.plan.getValue().id
    $http.get(`/service/coverage/report/search/plan_id/${planId}`)
      .then((result) => {
        // If we don't find a coverage report for this plan id, we get an empty array back.
        state.coverage.report = result.data.filter(item => item.coverageAnalysisRequest.planId === planId)[0]
        // Copy over the report params to the initialization params. If no report found, use old params
        if (state.coverage.report) {
          state.coverage.initializationParams = state.coverage.report.coverageAnalysisRequest
        }
        $timeout()
      })
      .catch(err => console.error(err))
  }
}

export default StateCoverage