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
    $scope.analysis = []
    $http.get(`/reports/tabc/${plan.id}/list`).success((response) => {
      if ($scope.plan.id !== plan.id) return
      var names = ['T', 'A', 'B', 'C']
      var analysis = [
        {
          name: `TABC Summary Stats ${plan.name}`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/summary_query`
        }
      ]
      var kml = names
        .filter((name) => response.indexOf(name) >= 0)
        .map((name) => {
          return {
            name: `${name} Route ${plan.name}`,
            type: '.kml',
            url: `/reports/tabc/${plan.id}/kml/${name}`
          }
        })
      analysis = analysis.concat(kml)
      analysis = analysis.concat([
        {
          name: `Backhaul layer ${plan.name}`,
          type: '.kml',
          url: `/reports/tabc/${plan.id}/kml/layer`
        },
        {
          name: `All TABC Endpoints ${plan.name}`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/master_output_producer`
        },
        {
          name: `Dropped Tower Details ${plan.name}`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/tower_details`
        },
        {
          name: 'TABC Summary Formatted',
          type: '.xlsx',
          url: '/csv/TABC Summary Formatted.xlsx'
        },
        {
          name: `Analysis Polygons ${plan.name}`,
          type: '.kml',
          url: `/reports/user_defined/${plan.id}/kml`
        }
      ])
      $scope.analysis = analysis
    })
    $scope.openReport(null, false)
  })
}])
