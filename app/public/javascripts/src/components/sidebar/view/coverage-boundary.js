import CoverageBoundaryController from './coverageBoundaryController'

let coverageBoundary = {
  templateUrl: '/components/sidebar/view/coverage-boundary-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: CoverageBoundaryController
}

export default coverageBoundary
