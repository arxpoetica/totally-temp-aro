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

  $scope.analysis = []

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
    } else if (latestModal) {
      $(latestModal).modal('show')
    }
  })

  var latestModal = null
  $scope.plan = null
  $rootScope.$on('open-report', (e, plan, modal) => {
    latestModal = modal
    $scope.plan = plan
    $scope.analysis = [
      {
        name: `TABC Summary Stats ${plan.name}`,
        type: '.csv',
        url: `/reports/tabc/${plan.id}/summary`
      },
      {
        name: `T Route ${plan.name}`,
        type: '.kml',
        url: `/reports/tabc/${plan.id}/kml/T`
      },
      {
        name: `A Route ${plan.name}`,
        type: '.kml',
        url: `/reports/tabc/${plan.id}/kml/A`
      },
      {
        name: `B Route ${plan.name}`,
        type: '.kml',
        url: `/reports/tabc/${plan.id}/kml/B`
      },
      {
        name: `C Route ${plan.name}`,
        type: '.kml',
        url: `/reports/tabc/${plan.id}/kml/C`
      },
      {
        name: `All TABC Endpoints ${plan.name}`,
        type: '.csv'
      },
      {
        name: `Dropped Tower Details ${plan.name}`,
        type: '.csv'
      },
      {
        name: 'TABC Summary Formatted',
        type: '.xlsx',
        url: '/csv/TABC Summary Formatted.xlsx'
      }
    ]
    $scope.openReport(null, false)
  })
}])
