/* global app $ Chart */
// Search Controller
app.controller('financial-profile-tool-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.aboveWirecenter = false

  var charts = {}
  var chartStyles = [
    {
      fillColor: 'rgba(220,220,220,0.5)',
      strokeColor: 'rgba(220,220,220,0.8)',
      highlightFill: 'rgba(220,220,220,0.75)',
      highlightStroke: 'rgba(220,220,220,1)'
    },
    {
      fillColor: 'rgba(151,187,205,0.5)',
      strokeColor: 'rgba(151,187,205,0.8)',
      highlightFill: 'rgba(151,187,205,0.75)',
      highlightStroke: 'rgba(151,187,205,1)'
    },
    {
      fillColor: 'rgba(121,127,121,0.5)',
      strokeColor: 'rgba(121,127,121,0.8)',
      highlightFill: 'rgba(121,127,121,0.75)',
      highlightStroke: 'rgba(121,127,121,1)'
    }
  ]

  function refresh () {
    $scope.financialData = {}
    refreshCurrentTab()
  }

  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (!map_tools.is_visible('financial_profile')) return

    $scope.aboveWirecenter = layer.type === 'county_subdivisions'

    var feature = event.feature
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      feature.toGeoJson((obj) => {
        $scope.selectedArea = {
          name: feature.getProperty('name'),
          geog: obj.geometry
        }
        refresh()
        $scope.$apply()
      })
    }
  })

  $rootScope.$on('custom_boundary_clicked', (e, boundary) => {
    if (!map_tools.is_visible('financial_profile')) return

    $scope.selectedArea = {
      name: boundary.name,
      geog: boundary.geom
    }
    refresh()
    $scope.$apply()
  })

  $('#financial_profile_controller .nav-tabs').on('shown.bs.tab', (e) => refreshCurrentTab())

  function refreshCurrentTab () {
    var href = $('#financial_profile_controller .nav-tabs li.active a').attr('href')
    if (href === '#financialProfileCashFlow') {
      showCashFlowChart()
    } else if (href === '#financialProfileCapex') {
      showBudgetChart()
      showCapexChart()
    } else if (href === '#financialProfileRevenue') {
      showRevenueChart()
    } else if (href === '#financialProfilePremises') {
      showPremisesChart()
    } else if (href === '#financialProfileSubscribers') {
      showSubscribersChart()
      showPenetrationChart()
    }
  }

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $scope.financialData = {}
  function request (key, params, callback) {
    if (!$scope.plan) return
    if ($scope.financialData[key]) return $scope.financialData[key]
    $http.get(`/financial_profile/${$scope.plan.id}/${key}`)
      .success((response) => {
        $scope.financialData[key] = response
        callback(response)
      })
  }

  function showChart (id, type, data, options) {
    charts[id] && charts[id].destroy()
    var ctx = document.getElementById(id).getContext('2d')
    charts[id] = new Chart(ctx)[type](data, options)
    var legend = document.getElementById(id + '-legend')
    if (legend) {
      legend.innerHTML = charts[id].generateLegend()
    }
  }

  function buildChartData (result, datasets) {
    return {
      labels: result.map((row) => String(row.year)),
      datasets: datasets.map((dataset, i) => Object.assign({
        label: dataset.name,
        data: result.map((row) => row[dataset.key])
      }, chartStyles[i % chartStyles.length]))
    }
  }

  function showCashFlowChart () {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'fiber', name: 'Fiber' },
      { key: 'incremental', name: 'Incremental' }
    ]
    request('cash_flow', {}, (cashFlow) => {
      var data = buildChartData(cashFlow, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-cash-flow', 'Line', data, options)
    })
  }

  function showBudgetChart () {
    var datasets = [
      { key: 'planned', name: 'Planned' },
      { key: 'spent', name: 'Spent' }
    ]
    request('budget', {}, (budget) => {
      var data = buildChartData(budget, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-budget', 'StackedBar', data, options)
    })
  }

  function showCapexChart () {
    var datasets = [
      { key: 'network_deployment', name: 'Network Deployment' },
      { key: 'connect', name: 'Connect' },
      { key: 'maintenance_capacity', name: 'Maintenance/Capacity' }
    ]
    request('capex', {}, (capex) => {
      var data = buildChartData(capex, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-capex', 'StackedBar', data, options)
    })
  }

  function showRevenueChart () {
    var datasets = [
      { key: 'businesses', name: 'Businesses' },
      { key: 'households', name: 'Households' },
      { key: 'towers', name: 'Towers' }
    ]
    request('revenue', {}, (revenue) => {
      var data = buildChartData(revenue, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-revenue', 'StackedBar', data, options)
    })
  }

  function showPremisesChart () {
    var datasets = [
      { key: 'existing', name: 'Existing OFS' },
      { key: 'incremental', name: 'Incremental OFS' }
    ]
    request('premises', {}, (premises) => {
      var data = buildChartData(premises, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-premises', 'StackedBar', data, options)
    })
  }

  function showSubscribersChart () {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'fiber', name: 'Fiber' },
      { key: 'incremental', name: 'Incremental' }
    ]
    request('subscribers', {}, (subscribers) => {
      var data = buildChartData(subscribers, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-subscribers', 'StackedBar', data, options)
    })
  }

  function showPenetrationChart () {
    var datasets = [
      { key: 'businesses', name: 'Businesses' },
      { key: 'households', name: 'Households' },
      { key: 'towers', name: 'Towers' }
    ]
    request('penetration', {}, (penetration) => {
      var data = buildChartData(penetration, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-penetration', 'Line', data, options)
    })
  }
}])
