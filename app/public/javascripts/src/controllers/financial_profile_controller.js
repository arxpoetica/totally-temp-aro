/* global app Chart $ */
// Financial Profile Controller
app.controller('financial_profile_controller', ['$scope', '$rootScope', ($scope, $rootScope) => {
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  var chart = null

  $('#modal-financial-profile').on('shown.bs.modal', () => {
    var dataset = {
      label: 'NPV',
      fillColor: 'rgba(151,187,205,0.2)',
      strokeColor: 'rgba(151,187,205,1)',
      pointColor: 'rgba(151,187,205,1)',
      pointStrokeColor: '#fff',
      pointHighlightFill: '#fff',
      pointHighlightStroke: 'rgba(151,187,205,1)',
      data: []
    }

    var data = {
      labels: [],
      datasets: [dataset]
    }

    ;($scope.plan.metadata.npv || []).forEach((revenue) => {
      data.labels.push(revenue.year)
      dataset.data.push(revenue.value)
    })

    chart && chart.destroy()
    var options = {
      bezierCurve: false,
      datasetFill: false,
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    var ctx = document.getElementById('financial-profile-chart').getContext('2d')
    chart = new Chart(ctx).Line(data, options)
  })
}])
