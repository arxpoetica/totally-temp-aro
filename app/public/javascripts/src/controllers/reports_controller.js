/* global app _ */
app.controller('reports_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.reports = [
    {
      name: 'My new report',
      type: 'User-created',
      createdAt: '10/19/2016',
      owner: 'Dan Huntington'
    },
    {
      name: 'Test',
      type: 'Analysis-generated',
      createdAt: '10/19/2016',
      owner: 'Dan Huntington'
    },
    {
      name: 'My new report',
      type: 'User-created',
      createdAt: '10/19/2016',
      owner: 'Dan Huntington'
    },
    {
      name: 'Test',
      type: 'Analysis-generated',
      createdAt: '10/19/2016',
      owner: 'Dan Huntington'
    }
  ]

  $scope.sortBy = (field, descending) => {
    $scope.reports = _.sortBy($scope.reports, (report) => {
      return report[field] || ''
    })
    if (descending) {
      $scope.reports = $scope.reports.reverse()
    }
  }
}])
