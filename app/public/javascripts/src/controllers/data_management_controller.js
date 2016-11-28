/* global app $ swal */
app.controller('data_management_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.userEntities = []
  $scope.userBoundaries = []

  function reloadAll () {
    loadUserEntities()
    loadCustomBoundaries()
  }

  function loadUserEntities () {
    $http.get('/user_entities/list')
      .success((response) => {
        $scope.userEntities = response
      })
  }

  function loadCustomBoundaries () {
    $http.get('/user_boundaries/list')
      .success((response) => {
        $scope.userBoundaries = response
      })
  }

  $('#data-management').on('shown.bs.modal', reloadAll)

  $scope.deleteUserEntities = (userEntities) => {
    swal({
      title: 'Are you sure?',
      text: 'This acction cannot be undone',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/user_entities/delete', { userEntities: userEntities.id }).success((response) => {
        reloadAll()
      })
    })
  }

  $scope.deleteUserBoundaries = (userBoundaries) => {
    swal({
      title: 'Are you sure?',
      text: 'This acction cannot be undone',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/user_boundaries/delete', { userBoundaries: userBoundaries.id }).success((response) => {
        reloadAll()
      })
    })
  }
}])
