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
          url: `/reports/tabc/${plan.id}/summary_query`,
          ajax: true
        }
      ]
      var kml = names
        .filter((name) => response.indexOf(name) >= 0)
        .map((name) => {
          return {
            name: `${name} Route ${plan.name}`,
            type: '.kml',
            url: `/reports/tabc/${plan.id}/kml/${name}`,
            ajax: true
          }
        })
      analysis = analysis.concat(kml)
      analysis = analysis.concat([
        {
          name: `All TABC Endpoints ${plan.name}`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/master_output_producer`,
          ajax: true
        },
        {
          name: `Dropped Tower Details ${plan.name}`,
          type: '.csv',
          url: `/reports/tabc/${plan.id}/tower_details`,
          ajax: true
        },
        {
          name: 'TABC Summary Formatted',
          type: '.xlsx',
          url: '/csv/TABC Summary Formatted.xlsx'
        },
        {
          name: `Analysis Polygons ${plan.name}`,
          type: '.kml',
          url: `/reports/user_defined/${plan.id}/kml`,
          ajax: true
        }
      ])
      $scope.analysis = analysis
    })
    $scope.openReport(null, false)
  })

  $scope.download = (report) => {
    var filename = report.name + report.type
    report.downloading = true
    $http.get(report.url).success((response) => {
      report.downloading = false

      console.log('download', filename, response)
      var a = document.createElement('a')
      a.setAttribute('href', response)
      a.setAttribute('download', filename)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
  }
}])
