class CoverageBoundaryController {

  constructor() {
    this.controlStates = Object.freeze({
      NO_TARGET_SELECTED: 'NO_TARGET_SELECTED',
      COMPUTING: 'COMPUTING',
      COMPUTED: 'COMPUTED'
    })
    this.controlState = this.controlStates.NO_TARGET_SELECTED
  }

  $onInit() {
  }
}

// CoverageBoundaryController.$inject = []

app.component('coverageBoundary', {
  templateUrl: '/components/sidebar/view/coverage-boundary-component.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: CoverageBoundaryController
})