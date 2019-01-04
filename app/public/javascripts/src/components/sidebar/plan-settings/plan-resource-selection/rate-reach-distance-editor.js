class RateReachDistanceEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
  }
}

RateReachDistanceEditorController.$inject = ['$http', '$timeout', 'state']

let rateReachEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-distance-editor.html',
  bindings: {
    categories: '=',
    rateReachGroupMap: '=',
    selectedTechnologyType: '<'
  },
  controller: RateReachDistanceEditorController
}

export default rateReachEditor