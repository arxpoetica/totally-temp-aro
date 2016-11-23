/* global app $ swal */
app.controller('data_management_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.dataSources = []
  $('#data-management').on('shown.bs.modal', () => {
    loadDataSources()
  })

  function loadDataSources () {
    $http.get('/data_sources/list')
      .success((response) => {
        $scope.dataSources = response
      })
  }

  $scope.deleteDataSource = (dataSource) => {
    swal({
      title: 'Are you sure?',
      text: 'This acction cannot be undone',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $http.post('/data_sources/delete', { dataSource: dataSource.id }).success((response) => {
        loadDataSources()
      })
    })
  }
}])
