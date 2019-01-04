class RateReachDistanceEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.isCategoryInEditMode = {}  // For each category hold a flag that tells us if it is being edited
  }
}

RateReachDistanceEditorController.$inject = ['$http', '$timeout', 'state']

let rateReachEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-distance-editor.html',
  bindings: {
    categories: '=',
    rateReachGroupMap: '=',
    selectedTechnologyType: '<',
    allowEditableCategory: '<'
  },
  controller: RateReachDistanceEditorController
}

export default rateReachEditor