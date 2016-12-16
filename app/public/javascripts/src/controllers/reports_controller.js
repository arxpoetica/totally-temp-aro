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
    $http.get(`/reports/abcd/${plan.id}/list`).success((response) => {
      if ($scope.plan.id !== plan.id) return
      var twoDigits = (d) => d > 9 ? String(d) : '0' + d
      var date = new Date()
      var now = `${date.getFullYear()}${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}`
      var prefix = (reportId) => `${now}_${plan.id}_${twoDigits(reportId)}_${plan.area_name}`
      var abcdNames = [
        { name: 'T', id: 1, description: 'A_ring' },
        { name: 'A', id: 2, description: 'B_ring' },
        { name: 'B', id: 3, description: 'C_ring' },
        { name: 'C', id: 4, description: 'D_ring' }
      ]
      var analysis = [
        {
          name: `${prefix(0)}_ABCD_summary`,
          type: '.csv',
          url: `/reports/abcd/${plan.id}/summary_query`
        }
      ]
      var kml = abcdNames
        .filter((abcdName) => response.indexOf(abcdName.name) >= 0)
        .map((abcdName) => {
          return {
            name: `${prefix(abcdName.id)}_${abcdName.description}`,
            type: '.kml',
            url: `/reports/abcd/${plan.id}/kml/${abcdName.name}`
          }
        })
      analysis = analysis.concat(kml)
      analysis = analysis.concat([
        {
          name: `${prefix(5)}_endpoints_CRAN_maps`,
          type: '.csv',
          url: `/reports/abcd/${plan.id}/master_output_producer`
        },
        {
          name: `${prefix(6)}_dropped_included_towers_list`,
          type: '.csv',
          url: `/reports/abcd/${plan.id}/tower_details`
        },
        {
          name: `${prefix(7)}_Thiessen_Polygons`,
          type: '.kml',
          url: `/reports/user_defined/${plan.id}/kml`
        },
        {
          name: `${prefix(10)}_Fiber_Zone_summary`,
          type: '.csv',
          url: `/reports/abcd/${plan.id}/fiber_zone_summary`
        },
        {
          name: `${prefix(12)}_A_route_400m_prem_passed`,
          type: '.csv'
        },
        {
          name: 'ABCD Summary Formatted',
          type: '.xlsx',
          url: '/csv/ABCD Summary Formatted.xlsx'
        }
      ])
      $scope.analysis = analysis
    })
    $scope.openReport(null, false)
  })
}])
