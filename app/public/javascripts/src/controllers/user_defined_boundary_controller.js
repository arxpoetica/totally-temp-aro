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
    $scope.editingUserDefinedBoundary.id = boundary && boundary.id
    $('#user_defined_boundaries_modal').modal('show')
  })

  $scope.saveUserDefiendBoundary = () => {
    var id = $scope.editingUserDefinedBoundary.id
    var url = id ? `/boundary/user_defined/${id}` : '/boundary/user_defined'
    $http.post(url, { name: $scope.editingUserDefinedBoundary.name })
      .success((response) => {
        $scope.editingUserDefinedBoundary.id = response.id
        $rootScope.$broadcast('saved_user_defined_boundary', $scope.editingUserDefinedBoundary)
        $('#user_defined_boundaries_modal').modal('hide')
      })
  }
}])
