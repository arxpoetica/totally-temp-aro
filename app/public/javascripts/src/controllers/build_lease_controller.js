/* global app $ Chart */
app.controller('build_lease_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $rootScope.$on('build_lease_show', () => {
    $('#build-lease').modal('show')
  })

  $scope.areas = []
  for (var i = 1; i < 6; i++) {
    $scope.areas.push({
      id: i,
      name: `Polygon ${i}`
    })
  }

  $scope.expandArea = (area) => {
    if ($scope.selectedArea && $scope.selectedArea.id === area.id) {
      $scope.selectedArea = null
      $('#build_lease_selected_info').hide()
    } else {
      $scope.areaInfo = null
      $scope.selectedArea = area
      $scope.calculateAreaInfo()

      var row = $('#build_lease_' + area.id)
      $('#build_lease_selected_info').insertAfter(row.parent()).show()
    }
  }

  $scope.calculateAreaInfo = () => {
    setTimeout(showAreaInfoChart, 100)
  }

  var areaInfoChart
  function showAreaInfoChart () {
    console.log('showAreaInfoChart')
    var dataset = {
      label: 'Build vs Lease',
      fillColor: 'rgba(151,187,205,0.2)',
      strokeColor: 'rgba(151,187,205,1)',
      pointColor: 'rgba(151,187,205,1)',
      pointStrokeColor: '#fff',
      pointHighlightFill: '#fff',
      pointHighlightStroke: 'rgba(151,187,205,1)',
      data: [
        0,
        11693.75445859149,
        20668.711005560453,
        27585.347509921223,
        32943.9876512066,
        37123.63842735468,
        40411.40956810251,
        43024.798741812796,
        45128.57260083811,
        46847.554174588906,
        48276.30932099969,
        49486.484214743345,
        50532.36349579503,
        51455.08056822294,
        52285.8069027
      ]
    }

    var labels = []
    for (var i = 0; i < dataset.data.length; i++) {
      labels.push(`${2016 + i}`)
    }

    var data = {
      labels: labels,
      datasets: [dataset]
    }

    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    destroyAreaInfoChart()
    var ctx = document.getElementById('build_lease_area_chart').getContext('2d')
    areaInfoChart = new Chart(ctx).Line(data, options)
  }

  function destroyAreaInfoChart () {
    areaInfoChart && areaInfoChart.destroy()
    $('#build_lease_area_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }
}])
