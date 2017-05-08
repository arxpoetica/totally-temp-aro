/* global app $ globalUser */
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
    $http.get(`/reports/tabc/${plan.id}/list`).then((response) => {
      if ($scope.plan.id !== plan.id) return
      var twoDigits = (d) => d > 9 ? String(d) : '0' + d
      var date = new Date()
      var now = `${date.getFullYear()}${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}`
      var prefix = (reportId) => `${now}_${plan.id}_${twoDigits(reportId)}_${plan.area_name}`
      var tabcNames = [
        { name: 'T', id: 1, description: 'A_ring' },
        { name: 'A', id: 2, description: 'B_ring' },
        { name: 'B', id: 3, description: 'C_ring' },
        { name: 'C', id: 4, description: 'D_ring' }
      ]
      var analysis = [
        {
          name: `${prefix(0)}_ABCD_summary`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/summary_query`
        }
      ]
      var kml = tabcNames
        .filter((tabcName) => response.data.indexOf(tabcName.name) >= 0)
        .map((tabcName) => {
          return {
            name: `${prefix(tabcName.id)}_${tabcName.description}`,
            type: '.kml',
            url: `/reports/tabc/${plan.id}/kml/${tabcName.name}`
          }
        })
      analysis = analysis.concat(kml)
      analysis = analysis.concat([
        {
          name: `${prefix(5)}_endpoints_CRAN_maps`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/master_output_producer`
        },
        {
          name: `${prefix(6)}_dropped_included_towers_list`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/tower_details`
        },
        {
          name: `${prefix(7)}_Thiessen_Polygons`,
          type: '.kml',
          url: `/reports/user_defined/${plan.id}/kml`
        },
        {
          name: `${prefix(10)}_Fiber_Zone_summary`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/fiber_zone_summary`
        },
        {
          name: prefix(11) + '_A_route_400m_prem_passed',
          type: '.csv',
          url: '/reports/tabc/' + plan.id + '/a_route_400m_prem_passed'
        },
        {
          name: prefix(13) + '_A_route_150m_prem',
          type: '.csv',
          url: '/reports/tabc/' + plan.id + '/a_route_150m_prem'
        },
        {
          name: prefix(12) + '_Fiber_Miles_by_UACE',
          type: '.csv',
          url: '/reports/tabc/' + plan.id + '/fiber_miles_uace'
        },
        {
          name: 'ABCD Summary Formatted',
          type: '.xlsx',
          url: '/csv/ABCD Summary Formatted.xlsx'
        },
        {
          name : 'Equipment Summary',
          type: '.csv',
          url: '/reports/'+plan.id+'/network/csv/nodes'
        }
      ])
      if (globalUser.rol === 'biz-dev' || globalUser.rol === 'admin') {
        analysis = analysis.concat([
          {
            name: `${now}_${plan.id}_${plan.area_name}_BVB_Summary_Output`,
            type: '.csv',
            url: `/reports/tabc/${plan.id}/build_vs_buy_summary`
          },
          {
            name: `${now}_${plan.id}_${plan.area_name}_BVB_Summary_Formatted`,
            type: '.xlsx',
            url: '/csv/BVB Summary Formatted.xlsx'
          }
        ])
      }
      $scope.analysis = analysis
    })
    $scope.openReport(null, false)
  })
}])
