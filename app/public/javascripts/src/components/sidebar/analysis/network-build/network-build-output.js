import Constants from '../../../common/constants'
class NetworkBuildOutputController {

  constructor(state, map_tools) {
    this.state = state
    this.map_tools = map_tools
  }

  showDetailedOutput() {
    var financialProfileConfig = {
      id: 'financial_profile',
      name: 'Financial Profile',
      short_name: 'F',
      icon: 'fa fa-line-chart fa-2x'
    }
    this.map_tools.toggle(financialProfileConfig)
    this.state.showRoicReportsModal = true
  }
}

NetworkBuildOutputController.$inject = ['state', 'map_tools']

let networkBuildOutput = {
  templateUrl: '/components/sidebar/analysis/network-build/network-build-output.html',
  bindings: {},
  controller: NetworkBuildOutputController
}

export default networkBuildOutput