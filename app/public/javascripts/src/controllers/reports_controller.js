/* global app _ $ */
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

  $scope.analysis = [
    {
      name: 'TABC Summary Stats',
      type: '.csv',
      createdAt: '10/19/2016'
    },
    {
      name: 'T Route',
      type: '.kml',
      createdAt: '10/19/2016'
    },
    {
      name: 'A Route',
      type: '.kml',
      createdAt: '10/19/2016'
    },
    {
      name: 'B Route',
      type: '.kml',
      createdAt: '10/19/2016'
    },
    {
      name: 'C Route',
      type: '.kml',
      createdAt: '10/19/2016'
    },
    {
      name: 'All TABC Endpoints',
      type: '.csv',
      createdAt: '10/19/2016'
    },
    {
      name: 'Dropped Tower Details',
      type: '.csv',
      createdAt: '10/19/2016'
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

  var backToReports = true
  $scope.openReport = (report, back) => {
    backToReports = back
    $('#reports').modal('hide')
    $('#reports-folder').modal('show')
  }

  $('#reports-folder').on('hidden.bs.modal', () => {
    if (backToReports) {
      $('#reports').modal('show')
    }
  })

  $rootScope.$on('open-report', (e, plan) => {
    $scope.openReport(null, false)
  })
}])
