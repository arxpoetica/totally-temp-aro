class CoverageInitializerController {
  constructor(state) {
    this.state = state
    this.reportTypes = [
      { id: 'FORM_477', name: 'Form 477' },
      { id: 'REGULAR', name: 'Regular' }
    ]
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
      name: 'Coverage Plan',
      distanceThreshold: 20000,
      useSiteBoundaries: false,
      spatialEdgeType: 'road'
    }
    this.coveragePlan.selectedReportType = this.reportTypes.filter((item) => item.id === 'FORM_477')[0]
  }
}

CoverageInitializerController.$inject = ['state']

let coverageInitializer = {
  templateUrl: '/components/sidebar/analysis/coverage/coverage-initializer.html',
  bindings: {},
  controller: CoverageInitializerController
}

export default coverageInitializer
