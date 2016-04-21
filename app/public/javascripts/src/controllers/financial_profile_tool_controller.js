/* global app $ Chart */
// Search Controller
app.controller('financial-profile-tool-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools

  var charts = {}

  showCashFlowChart()

  $('#financial_profile_controller .nav-tabs').on('shown.bs.tab', (e) => {
    var href = $(e.target).attr('href')
    if (href === '#financialProfileCashFlow') {
      showCashFlowChart()
    } else if (href === '#financialProfileBudget') {
      showBudgetChart()
    } else if (href === '#financialProfileCapex') {
      showCapexChart()
    } else if (href === '#financialProfileRevenue') {
      showRevenueChart()
    } else if (href === '#financialProfilePremises') {
      showPremisesChart()
    } else if (href === '#financialProfileSubscribers') {
      showSubscribersChart()
      showPenetrationChart()
    }
  })

  function showChart (id, type, data, options) {
    charts[id] && charts[id].destroy()
    var ctx = document.getElementById(id).getContext('2d')
    charts[id] = new Chart(ctx)[type](data, options)
    var legend = document.getElementById(id + '-legend')
    if (legend) {
      legend.innerHTML = charts[id].generateLegend()
    }
  }

  function showCashFlowChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'BAU',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Fiber',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-cash-flow', 'Line', data, options)
  }

  function showBudgetChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'Planned',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Spent',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-budget', 'Bar', data, options)
  }

  function showCapexChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'Network Deployment',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Connect',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-capex', 'Bar', data, options)
  }

  function showRevenueChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'Businesses',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Households',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-revenue', 'Bar', data, options)
  }

  function showPremisesChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'Existing OFS',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Incremental OFS',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-premises', 'Bar', data, options)
  }

  function showSubscribersChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'BAU',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Fiber',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-subscribers', 'Bar', data, options)
  }

  function showPenetrationChart () {
    var data = {
      labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      datasets: [
        {
          label: 'Households',
          fillColor: 'rgba(220,220,220,0.5)',
          strokeColor: 'rgba(220,220,220,0.8)',
          highlightFill: 'rgba(220,220,220,0.75)',
          highlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
          label: 'Businesses',
          fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }
      ]
    }
    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    showChart('financial-profile-chart-penetration', 'Line', data, options)
  }
}])
