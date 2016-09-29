/* global $ app */
app.controller('user_defined_boundary_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  function initialValues () {
    $scope.editingUserDefinedBoundary = {
      name: '',
      radius: 20
    }
  }

  initialValues()

  $rootScope.$on('edit_user_defined_boundary', (e, boundary) => {
    initialValues()
    $scope.editingUserDefinedBoundary.name = (boundary && boundary.name) || ''
    $scope.editingUserDefinedBoundary.id = (boundary && boundary.id) || Date.now()
    $('#user_defined_boundaries_modal').modal('show')
  })

  $scope.saveUserDefiendBoundary = () => {
    $rootScope.$broadcast('saved_user_defined_boundary', $scope.editingUserDefinedBoundary)
    $('#user_defined_boundaries_modal').modal('hide')
  }
}])
