/* global app $ */
app.controller('reports_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.analysis = []

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
        },
        {
          name: `Municipality Stats ${plan.name}`,
          type: '.kml'
        },
        {
          name: `Fibre zone summary ${plan.name}`,
          type: '.csv',
          url: `/reports/fiber_zone_summary/${plan.id}`
        }
      ])
      $scope.analysis = analysis
    })
    $scope.openReport(null, false)
  })
}])
