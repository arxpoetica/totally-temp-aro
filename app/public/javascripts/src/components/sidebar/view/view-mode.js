class ViewModeController {
  
  constructor($scope, state, configuration) {
    this.state = state
    this.currentUser = state.loggedInUser
    $scope.configuration = configuration
  }
}

ViewModeController.$inject = ['$scope', 'state', 'configuration']

let viewMode = {
    templateUrl: '/components/sidebar/view/view-mode.html',
  controller: ViewModeController
}

export default viewMode