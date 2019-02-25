class NetworkBuildOutputController {
  constructor (state) {
    this.state = state
  }

  showDetailedOutput () {
    this.state.showRoicReportsModal = true
  }
}

NetworkBuildOutputController.$inject = ['state']

let networkBuildOutput = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-output.html',
  bindings: {},
  controller: NetworkBuildOutputController
}

export default networkBuildOutput
