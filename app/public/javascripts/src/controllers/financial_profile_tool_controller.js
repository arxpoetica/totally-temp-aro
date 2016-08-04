/* global app $ Chart */
app.controller('financial-profile-tool-controller', ['$scope', '$rootScope', '$http', '$timeout', 'map_tools', ($scope, $rootScope, $http, $timeout, map_tools) => {
  $scope.map_tools = map_tools
  $scope.aboveWirecenter = false
  $scope.premisesFilterEntityTypes = { household: true }
  $scope.subscribersFilterEntityTypes = { household: true }
  $scope.connectCapexFilterEntityTypes = { household: true }
  $scope.penetrationFilter = {
    entityType: 'household'
  }
  $scope.revenueFilter = 'bau'
  $scope.capexFilterEntityTypes = { households: true }
  $scope.capexFilter = 'bau'
  $scope.connectCapexFilter = 'bau'
  $scope.details = false
  $scope.arpuFilter = 'household'

  $scope.entityTypes = {
    smallBusiness: 'SMB',
    mediumBusiness: 'Mid-tier',
    largeBusiness: 'Large Enterprise',
    household: 'Households',
    cellTower: 'Towers'
  }
  $scope.entityTypesArray = Object.keys($scope.entityTypes).map((key) => ({
    key: key,
    name: $scope.entityTypes[key]
  }))
  $scope.premisesPercentage = 'false'

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
    if ($scope.metadata) {
      refreshCurrentTab()
    }
    if ($scope.mode === 'area' && $scope.selectedArea) {
      loadWirecenterMetadata()
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
    if (layer.type !== 'wirecenter') return

    var feature = event.feature
    $scope.selectedArea = {
      id: feature.getProperty('id')
    }
    $scope.calculateShowData()
    refresh()
    if (!$scope.$$phase) { $scope.$apply() }

    // $scope.aboveWirecenter = layer.type === 'county_subdivisions'

    // var feature = event.feature
    // if (feature.getGeometry().getType() === 'MultiPolygon') {
    //   feature.toGeoJson((obj) => {
    //     $scope.selectedArea = {
    //       name: feature.getProperty('name'),
    //       geog: obj.geometry
    //     }
    //     refresh()
    //     $scope.$apply()
    //   })
    // }
  })

  $rootScope.$on('custom_boundary_clicked', (e, boundary) => {
    if (!map_tools.is_visible('financial_profile')) return

    // $scope.selectedArea = {
    //   name: boundary.name,
    //   geog: boundary.geom
    // }
    // refresh()
    // $scope.$apply()
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
      showConnectCapexChart(force)
    } else if (href === '#financialProfileRevenue') {
      showRevenueChart(force)
      showArpuChart(force)
    } else if (href === '#financialProfilePremises') {
      showPremisesChart(force)
      showCostPerPremiseChart(force)
    } else if (href === '#financialProfileSubscribers') {
      showSubscribersChart(force)
      showPenetrationChart(force)
    }
  }
  $scope.refreshCurrentTab = refreshCurrentTab

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
    $scope.mode = 'global'
    $scope.metadata = plan.metadata
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    $scope.plan = plan
    if ($scope.mode === 'global') {
      $scope.metadata = plan.metadata
    }
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
    var plan_id = $scope.mode === 'global' ? $scope.plan.id : $scope.selectedArea.id
    $http({ url: `/financial_profile/${plan_id}/${key}`, params: params })
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
      { key: 'plan', name: 'Plan' },
      { key: 'incremental', name: 'Incremental' }
    ]
    request(force, 'cash_flow', {}, (cashFlow) => {
      var data = buildChartData(cashFlow, datasets)
      var options = {
        datasetFill: false,
        bezierCurve: false,
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
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
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-capex', 'StackedBar', data, options)
    })
  }

  function showRevenueChart (force) {
    request(force, 'revenue', { filter: $scope.revenueFilter }, (revenue) => {
      var data = buildChartData(revenue, $scope.entityTypesArray)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
      }
      showChart('financial-profile-chart-revenue', 'StackedBar', data, options)
    })
  }

  function showArpuChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'arpu', { filter: $scope.arpuFilter }, (arpu) => {
      var data = buildChartData(arpu, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
      }
      showChart('financial-profile-chart-arpu', 'Bar', data, options)
    })
  }
  $scope.showArpuChart = showArpuChart

  function showConnectCapexChart (force) {
    var entityTypes = Object.keys($scope.connectCapexFilterEntityTypes).filter((key) => $scope.connectCapexFilterEntityTypes[key])
    var params = {
      entityTypes: entityTypes,
      filter: $scope.connectCapexFilter
    }
    var datasets = $scope.entityTypesArray.filter((entity) => entityTypes.indexOf(entity.key) > -1)
    request(force, 'connectcapex', params, (connectcapex) => {
      var data = buildChartData(connectcapex, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value, 0) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-connect-capex', 'Bar', data, options)
    })
  }
  $scope.showConnectCapexChart = showConnectCapexChart

  function showPremisesChart (force) {
    var datasets = [
      { key: 'incremental', name: 'Incremental OFS' },
      { key: 'existing', name: 'Existing OFS' }
    ]
    var params = {
      entityTypes: selectedKeys($scope.premisesFilterEntityTypes),
      percentage: $scope.premisesPercentage
    }
    request(force, 'premises', params, (premises) => {
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
  $scope.showPremisesChart = showPremisesChart

  function showCostPerPremiseChart (force) {
    var datasets = [{ key: 'value', name: 'Value' }]
    var params = {}
    request(force, 'costperpremise', params, (costs) => {
      var data = buildChartData(costs, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value, config.currency_symbol, 0) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value, config.currency_symbol, 0) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value, config.currency_symbol, 0) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-cost-per-premise', 'Bar', data, options)
    })
  }
  $scope.showCostPerPremiseChart = showCostPerPremiseChart

  function showSubscribersChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    var entityTypes = Object.keys($scope.subscribersFilterEntityTypes).filter((key) => $scope.subscribersFilterEntityTypes[key])
    request(force, 'subscribers', { entityTypes: entityTypes }, (subscribers) => {
      var data = buildChartData(subscribers, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value, 0) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-subscribers', 'Bar', data, options)
    })
  }
  $scope.showSubscribersChart = showSubscribersChart

  function showPenetrationChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'penetration', { entityType: $scope.penetrationFilter.entityType }, (penetration) => {
      var data = buildChartData(penetration, datasets)
      var options = {
        datasetFill: false,
        bezierCurve: false,
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value, 0) + '%' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value, 1) + '%' %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-penetration', 'Line', data, options)
    })
  }
  $scope.showPenetrationChart = showPenetrationChart

  function selectedKeys (obj) {
    return Object.keys(obj).filter((item) => !!obj[item])
  }

  $scope.download = () => {
    window.location.href = `/financial_profile/${$scope.plan.id}/export`
  }

  $scope.hasIRR = () => {
    return $scope.plan && $scope.plan.metadata &&
      +$scope.plan.metadata.irr == $scope.plan.metadata.irr // eslint-disable-line
  }

  $scope.showDetails = (show) => {
    $scope.details = show
  }

  $scope.mode = 'global'
  $scope.showData = true
  $scope.setMode = (mode) => {
    $scope.mode = mode
    $rootScope.$broadcast('financial_profile_changed_mode', mode)
    $scope.selectedArea = null
    $scope.metadata = $scope.plan.metadata
    $scope.calculateShowData()
    refresh()
  }

  $scope.calculateShowData = () => {
    $scope.showData = $scope.mode === 'global' || !!$scope.selectedArea
  }

  function loadWirecenterMetadata () {
    const calculateURL = () => {
      if (!$scope.selectedArea || !$scope.plan) return null
      return '/network_plan/' + $scope.plan.id + '/' + $scope.selectedArea.id
    }
    var url = calculateURL()
    $http.get(url).success((response) => {
      // Check if the user has changed to another wirectenter, to global mode or to another plan
      if (url === calculateURL() && $scope.mode === 'area') {
        console.log('loaded wirecenter data')
        $scope.metadata = response.metadata
      }
    })
  }
}])
