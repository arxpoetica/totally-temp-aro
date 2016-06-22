/* global app $ Chart */
// Search Controller
app.controller('financial-profile-tool-controller', ['$scope', '$rootScope', '$http', '$timeout', 'map_tools', ($scope, $rootScope, $http, $timeout, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools
  $scope.aboveWirecenter = false
  $scope.premisesFilterEntityTypes = { households: true }
  $scope.subscribersFilterEntityType = 'households'
  $scope.revenueFilter = 'bau'
  $scope.capexFilterEntityTypes = { households: true }
  $scope.capexFilter = 'bau'
  var dirty = false

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
    if ($scope.plan && $scope.plan.metadata) {
      refreshCurrentTab()
    }
  }

  $rootScope.$on('route_planning_changed', () => {
    if (map_tools.is_visible('financial_profile')) {
      refresh()
    } else {
      dirty = true
    }
  })

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

  function refreshCurrentTab (force) {
    var href = $('#financial_profile_controller .nav-tabs li.active a').attr('href')
    if (href === '#financialProfileSummary') {
    } else if (href === '#financialProfileCashFlow') {
      showCashFlowChart(force)
    } else if (href === '#financialProfileCapex') {
      // showBudgetChart(force)
      showCapexChart(force)
    } else if (href === '#financialProfileRevenue') {
      showRevenueChart(force)
    } else if (href === '#financialProfilePremises') {
      showPremisesChart(force)
    } else if (href === '#financialProfileSubscribers') {
      showSubscribersChart(force)
      showPenetrationChart(force)
    }
  }
  $scope.refreshCurrentTab = refreshCurrentTab

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    $scope.plan = plan
    refresh()
  })

  $rootScope.$on('route_planning_changed', (e) => {
    if (!$scope.plan) return
    refreshCurrentTab()
  })

  $rootScope.$on('map_tool_changed_visibility', (e) => {
    if (map_tools.is_visible('financial_profile')) {
      $timeout(dirty ? refresh : refreshCurrentTab, 0)
      dirty = false
    }
  })

  $scope.financialData = {}
  function request (force, key, params, callback) {
    if (!$scope.plan) return
    if (force) delete $scope.financialData[key]
    else if ($scope.financialData[key]) return $scope.financialData[key]
    console.log('params', params)
    $http({ url: `/financial_profile/${$scope.plan.id}/${key}`, params: params })
      .success((response) => {
        $scope.financialData[key] = response
        console.log('Requested', key)
        console.table && console.table(response)
        callback(response)
      })
  }

  function showChart (id, type, data, options) {
    charts[id] && charts[id].destroy()
    var elem = document.getElementById(id)
    elem.removeAttribute('width')
    elem.removeAttribute('height')
    elem.style.width = '100%'
    elem.style.height = '200px'
    var ctx = elem.getContext('2d')
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

  function showCashFlowChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Fiber' },
      { key: 'incremental', name: 'Incremental' }
    ]
    request(force, 'cash_flow', {}, (cashFlow) => {
      var data = buildChartData(cashFlow, datasets)
      var options = {
        datasetFill: false,
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-cash-flow', 'Line', data, options)
    })
  }

  function showBudgetChart (force) {
    var datasets = [
      { key: 'budget', name: 'Budget' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'budget', {}, (budget) => {
      var data = buildChartData(budget, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-budget', 'Bar', data, options)
    })
  }

  function showCapexChart (force) {
    var datasets = [
      { key: 'network_deployment', name: 'Network Deployment' },
      { key: 'connect', name: 'Connect' },
      { key: 'maintenance_capacity', name: 'Maintenance/Capacity' }
    ]
    var params = {
      filter: $scope.capexFilter,
      entityTypes: selectedKeys($scope.capexFilterEntityTypes)
    }
    request(force, 'capex', params, (capex) => {
      var data = buildChartData(capex, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-capex', 'StackedBar', data, options)
    })
  }

  function showRevenueChart (force) {
    var datasets = [
      { key: 'businesses', name: 'Businesses' },
      { key: 'households', name: 'Households' },
      { key: 'towers', name: 'Towers' }
    ]
    request(force, 'revenue', { filter: $scope.revenueFilter }, (revenue) => {
      var data = buildChartData(revenue, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value, '$', 0) + ' K' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-revenue', 'StackedBar', data, options)
    })
  }

  function showPremisesChart (force) {
    var datasets = [
      { key: 'incremental', name: 'Incremental OFS' },
      { key: 'existing', name: 'Existing OFS' }
    ]
    request(force, 'premises', { entityTypes: selectedKeys($scope.premisesFilterEntityTypes) }, (premises) => {
      var data = buildChartData(premises, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>` // eslint-disable-line
        // scaleOverride: true,
        // scaleSteps: 10,
        // scaleStepWidth: 10000,
        // scaleStartValue: 0
      }
      showChart('financial-profile-chart-premises', 'StackedBar', data, options)
    })
  }

  function showSubscribersChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'subscribers', { entityType: $scope.subscribersFilterEntityType }, (subscribers) => {
      var data = buildChartData(subscribers, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-subscribers', 'Bar', data, options)
    })
  }

  function showPenetrationChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'penetration', { entityType: $scope.subscribersFilterEntityType }, (penetration) => {
      var data = buildChartData(penetration, datasets)
      var options = {
        datasetFill: false,
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value, 0) + '%' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value, 1) + '%' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-penetration', 'Line', data, options)
    })
  }

  function selectedKeys (obj) {
    return Object.keys(obj).filter((item) => !!obj[item])
  }
}])
