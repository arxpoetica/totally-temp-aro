/* global app $ swal */
app.controller('data_management_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.userEntities = []
  $scope.userBoundaries = []

  var errorHandler = (err) => {
    setTimeout(() => {
      swal({
        title: 'Error',
        text: `Error: ${err.error}`,
        type: 'error',
        closeOnConfirm: true
      })
    }, 400)
  }

  function reloadAll () {
    loadUserEntities()
    loadCustomBoundaries()
    loadUserFiber()
  }

  function loadUserEntities () {
    $http.get('/user_entities/list')
      .success((response) => {
        $scope.userEntities = response
      })
      .error(errorHandler)
  }

  function loadCustomBoundaries () {
    $http.get('/user_boundaries/list')
      .success((response) => {
        $scope.userBoundaries = response
      })
      .error(errorHandler)
  }

  function loadUserFiber () {
    $http.get('/user_fiber/list')
      .success((response) => {
        $scope.userFiber = response
      })
      .error(errorHandler)
  }

  $('#data-management').on('shown.bs.modal', reloadAll)

  $scope.deleteUserEntities = (userEntities) => {
    swal({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/user_entities/delete', { userEntities: userEntities.id }).success((response) => {
        reloadAll()
      })
      .error(errorHandler)
    })
  }

  $scope.deleteUserBoundaries = (userBoundaries) => {
    swal({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/user_boundaries/delete', { userBoundaries: userBoundaries.id }).success((response) => {
        reloadAll()
      })
      .error(errorHandler)
    })
  }

  $scope.deleteUserFiber = (userFiber) => {
    swal({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/user_fiber/delete', { userFiber: userFiber.systemId })
        .success((response) => {
          reloadAll()
        })
        .error(errorHandler)
    })
  }
}])
