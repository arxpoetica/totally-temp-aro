/* global app google map $ swal */
app.controller('body_controller', ['$scope', 'state', ($scope, state) => {
  // This controller is only for exposing the application state object to children.
  // Do not put anything else in this controller.
  $scope.state = state
}])
