/* global app $ Chart config */
app.controller('financial-profile-tool-controller', ['$scope', '$rootScope', '$http', '$timeout', 'map_tools', 'MapLayer', 'regions','$filter','state', ($scope, $rootScope, $http, $timeout, map_tools, MapLayer, regions, $filter, state) => {
  $scope.map_tools = map_tools
  $scope.aboveWirecenter = false
  $scope.premisesFilterEntityTypes = { household: true }
  $scope.subscribersFilterEntityTypes = { household: true }
  $scope.connectCapexFilterEntityTypes = { household: true }
  $scope.opexRecurringFilterEntityTypes = { household: true }
  $scope.penetrationFilter = {
    entityType: 'household'
  }
  $scope.revenueFilter = 'bau'
  $scope.capexFilterEntityTypes = { households: true }
  $scope.capexFilter = 'bau'
  $scope.connectCapexFilter = 'bau'
  $scope.details = false
  $scope.arpuFilter = 'household'
  $scope.opexCostFilter = 'household'
  $scope.state = state

  var entityTypesMapping = {
    household: 'household',
    small: 'smallBusiness',
    medium: 'mediumBusiness',
    large: 'largeBusiness',
    celltower: 'cellTower'
  }
  $scope.premisesPercentage = 'false'
  var dirty = false

  var charts = {}
  var chartStyles = [
    {
      borderColor: 'rgba(220,220,220,1)',
      backgroundColor: 'rgba(220,220,220,0.5)',
      pointBorderColor: 'rgba(220,220,220,0.5)',
      pointBackgroundColor: 'rgba(220,220,220,0.75)',
      pointHoverBackgroundColor: 'rgba(220,220,220,0.8)'
    },
    {
      borderColor: 'rgba(151,187,205,1)',
      backgroundColor: 'rgba(151,187,205,0.5)',
      pointBorderColor: 'rgba(151,187,205,0.5)',
      pointBackgroundColor: 'rgba(151,187,205,0.75)',
      pointHoverBackgroundColor: 'rgba(151,187,205,0.8)',
    },
    {
      borderColor: 'rgba(121,127,121,1)',
      backgroundColor: 'rgba(121,127,121,0.5)',
      pointBorderColor: 'rgba(121,127,121,0.5)',
      pointBackgroundColor: 'rgba(121,127,121,0.75)',
      pointHoverBackgroundColor: 'rgba(121,127,121,0.8)'
    }
  ]

  var barChartOptions = {
    scales: { xAxes: [{ stacked: true }], yAxes: [{ ticks: { callback: function (value, index, values) { 
      if (value != 0 && value < 10) 
        return $filter('number')(value, 1)
      else
        return $filter('number')(value, 0)
    }, beginAtZero: true } }] },
    tooltips: {
      mode: 'label', callbacks: {
        label: function (tooltipItems, data) {
          var label = data.datasets[tooltipItems.datasetIndex].label || ''
          if (label) {
            label += ': '
          }
          label += $filter('number')(tooltipItems.yLabel, 2)
          return label
        }
      }
    }
  }

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
    if (config.ARO_CLIENT === 'verizon' || config.ui.map_tools.financial_profile.per_wirecenter) {
      if (layer.type !== 'child_plans') return
    } else {
      if (layer.type !== 'wirecenter') return
    }

    var feature = event.feature
    $scope.selectedArea = {
      id: feature.getProperty('id'),
      name: feature.getProperty('name')
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
    } else if (href === '#financialProfileOpex') {
      showOpexRecurringChart(force)
      showOpexCostChart(force)
    // } else if (href === '#financialProfileRouteOpportunities') {
    //   loadRouteOpportunities()
    } else if (href === '#financialProfileFiberDetails') {
      showDistanceToFiber()
    }
  }
  $scope.refreshCurrentTab = refreshCurrentTab

  $scope.plan = null
  state.planOptimization.subscribe((plan) => {
    if(plan && plan.planState === 'COMPLETED') updateMetadataLabels(plan)
  })
  state.plan.subscribe((plan) => {
    if (!plan) return
    $scope.plan = plan
    $scope.mode = 'global'
    if(plan.planState === 'COMPLETED')
      updateMetadataLabels(plan);

    $scope.premisesFilterEntityTypes = {}
    $scope.subscribersFilterEntityTypes = {}
    $scope.connectCapexFilterEntityTypes = {}
    $scope.opexRecurringFilterEntityTypes = {}
    $scope.penetrationFilter = {}
    $scope.capexFilterEntityTypes = {}

    if (!Array.isArray(plan.location_types)) {
      return console.warn('plan.location_types is not an array')
    }
    plan.location_types.forEach((type) => {
      type = entityTypesMapping[type]
      if (!type) return
      $scope.premisesFilterEntityTypes[type] = true
      $scope.subscribersFilterEntityTypes[type] = true
      $scope.connectCapexFilterEntityTypes[type] = true
      $scope.opexRecurringFilterEntityTypes[type] = true
      $scope.penetrationFilter = { entityType: type }
      $scope.capexFilterEntityTypes[type] = true
      $scope.arpuFilter = type
      $scope.opexCostFilter = type
    })
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    $scope.plan = plan
    if ($scope.mode === 'global') {
      updateMetadataLabels(plan.metadata);
    }
    refresh()
  })

  $rootScope.$on('route_planning_changed', (e, plan) => {
    if (!$scope.plan) return
    updateMetadataLabels(plan.metadata);
    refreshCurrentTab()
  })

  var initEntityTypes = () => {
    $scope.entityTypes = {
      smallBusiness: state.configuration.locationCategories.business.segments.small.label,
      mediumBusiness: state.configuration.locationCategories.business.segments.medium.label,
      largeBusiness: state.configuration.locationCategories.business.segments.large.label,
      household: state.configuration.locationCategories.household.label
    }
    if (state.configuration.locationCategories.celltower.show) {
      $scope.entityTypes.cellTower = state.configuration.locationCategories.celltower.label
    }
    $scope.entityTypesArray = Object.keys($scope.entityTypes).map((key) => ({
      key: key,
      name: $scope.entityTypes[key]
    }))
  }
  $rootScope.$on('map_tool_changed_visibility', (e, tool) => {
    if (map_tools.is_visible('financial_profile')) {
      initEntityTypes()
      if (config.ARO_CLIENT !== 'verizon') {
        $scope.selectedArea = null
        return
      }
      $timeout(dirty ? refresh : refreshCurrentTab, 0)
      dirty = false

      if ($scope.mode === 'area') {
        $scope.layersStatus = MapLayer.hideAllLayers()
        serviceAreaLayer.show()
        regions.hide()
      }
    } else if (tool === 'financial_profile') {
      initEntityTypes()
      $('a[href="#map-tools-financial"]:not(.collapsed)').click()

      if ($scope.layersStatus) {
        MapLayer.recoverLayersVisibility($scope.layersStatus)
      }
      serviceAreaLayer.hide()
      regions.show()
    }
  })

  $scope.fiberDetailLayers = {}
  $scope.fiberDetailColors = {
    conduit: 'chocolate',
    obstacle: 'CornflowerBlue',
    underground: 'Olive',
    buried: 'DarkBlue',
    arial: 'DarkMagenta',
    aerial: 'DarkMagenta',
    estimated: 'SeaGreen'
  }
  $scope.toggleFiberDetailLayer = (type) => {
    var layer = $scope.fiberDetailLayers[type]
    if (!layer) {
      layer = new MapLayer({
        name: `${type} fiber`,
        type: `${type}_fiber`,
        api_endpoint: `/network/fiber_type/:plan_id/${type}`,
        style_options: {
          normal: {
            strokeColor: $scope.fiberDetailColors[type],
            strokeWeight: 4
          }
        },
        threshold: 11,
        reload: 'always'
      })
      $scope.fiberDetailLayers[type] = layer
      layer.show()
    } else {
      layer.toggleVisibility()
    }
  }

  $scope.financialData = {}
  function request (force, key, params, callback) {
    if (!$scope.plan) return
    if (force) delete $scope.financialData[key]
    else if ($scope.financialData[key]) return $scope.financialData[key]
    var plan_id = $scope.mode === 'global' ? $scope.plan.id : $scope.selectedArea.id
    $http({ url: `/financial_profile/${plan_id}/${key}`, params: params })
      .then((response) => {
        $scope.financialData[key] = response.data
        callback(response.data)
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
    // ctx.fillStyle = 'white'
    // ctx.fillRect(0, 0, elem.offsetWidth, elem.offsetHeight)
    //charts[id] = new Chart(ctx)[type](data, options)
    charts[id] = new Chart(ctx, {
      type: type,
      data: data,
      options: options
    })
    // var legend = document.getElementById(id + '-legend')
    // if (legend) {
    //   legend.innerHTML = charts[id].generateLegend()
    // }
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

  function showDistanceToFiber () {
    $http.get(`/financial_profile/${$scope.plan.id}/fiber_details`)
      .then((response) => {
        $scope.fiberDetailsAdditional = response.data
      })
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
        elements: { line: { fill: false, tension: 0 } }, // disables bezier curves
        scales: { yAxes: [{ ticks: { callback: function (value, index, values) { return $filter('currency')(value / 1000, '$', 0) + ' K' },beginAtZero:  true } }] },
        tooltips: { mode: 'label', callbacks: {
            label: function (tooltipItems, data) {
              return $filter('currency')(tooltipItems.yLabel / 1000, '$', 2) + ' K'
            }
          } }
        // scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        // tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        // multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
      }
      showChart('financial-profile-chart-cash-flow', 'line', data, options)
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
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        scales: { xAxes: [{ stacked: true,ticks: { beginAtZero: true } }], yAxes: [{ stacked: true,ticks: { beginAtZero: true } }] }
      }
      showChart('financial-profile-chart-capex', 'bar', data, barChartOptions)
    })
  }

  function showRevenueChart (force) {
    request(force, 'revenue', { filter: $scope.revenueFilter }, (revenue) => {
      var data = buildChartData(revenue, $scope.entityTypesArray)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        scales: { xAxes: [{ stacked: true }], yAxes: [{ stacked: true }] }
      }
      showChart('financial-profile-chart-revenue', 'bar', data, barChartOptions)
    })
  }

  function showArpuChart (force) {
    if (!$scope.arpuFilter) return
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
      showChart('financial-profile-chart-arpu', 'bar', data, barChartOptions)
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
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
      }
      showChart('financial-profile-chart-connect-capex', 'bar', data, barChartOptions)
    })
  }
  $scope.showConnectCapexChart = showConnectCapexChart

  function showPremisesChart (force) {
    var params = {
      entityTypes: selectedKeys($scope.premisesFilterEntityTypes),
      percentage: $scope.premisesPercentage
    }
    request(force, 'premises', params, (premises) => {
      var data = buildChartData(premises, [
        { key: 'incremental', name: 'Incremental OFS' },
        { key: 'existing', name: 'Existing OFS' }
      ])
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        // scaleOverride: true,
        // scaleSteps: 10,
        // scaleStepWidth: 10000,
        // scaleStartValue: 0
        scales: { xAxes: [{ stacked: true }], yAxes: [{ stacked: true }] }
      }
      showChart('financial-profile-chart-premises', 'bar', data, barChartOptions)

      data = buildChartData(premises, [
        { key: 'period', name: 'Premises passed in time period' }
      ])
      options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-premises-period', 'bar', data, barChartOptions)
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
      showChart('financial-profile-chart-cost-per-premise', 'bar', data, barChartOptions)
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
      showChart('financial-profile-chart-subscribers', 'bar', data, barChartOptions)
    })
  }
  $scope.showSubscribersChart = showSubscribersChart

  function showPenetrationChart (force) {
    if (!$scope.penetrationFilter.entityType) return
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'penetration', { entityType: $scope.penetrationFilter.entityType }, (penetration) => {
      var data = buildChartData(penetration, datasets)
      var options = {
        elements: { line: { fill: false, tension: 0 } }, // disables bezier curves
        scales: { yAxes: [{ ticks: { callback: function (value, index, values) { return $filter('number')(value, 0) + '%' },beginAtZero:  true } }] },
        tooltips: { mode: 'label', callbacks: {
            label: function (tooltipItems, data) {
              return $filter('number')(tooltipItems.yLabel, 2) + '%'
            }
          } }
      }
      showChart('financial-profile-chart-penetration', 'line', data, options)
    })
  }
  $scope.showPenetrationChart = showPenetrationChart

  function showOpexRecurringChart (force) {
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    var entityTypes = Object.keys($scope.opexRecurringFilterEntityTypes).filter((key) => $scope.opexRecurringFilterEntityTypes[key])
    request(force, 'opexrecurring', { entityTypes: entityTypes }, (penetration) => {
      var data = buildChartData(penetration, datasets)
      var options = {
        scaleLabel: `<%= angular.injector(['ng']).get('$filter')('number')(value, 0) %>`, // eslint-disable-line
        tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value) %>`, // eslint-disable-line
        multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('number')(value, 1) %>` // eslint-disable-line
      }
      showChart('financial-profile-chart-opex-recurring', 'bar', data, barChartOptions)
    })
  }
  $scope.showOpexRecurringChart = showOpexRecurringChart

  function showOpexCostChart (force) {
    if (!$scope.opexCostFilter) return
    var datasets = [
      { key: 'bau', name: 'BAU' },
      { key: 'plan', name: 'Plan' }
    ]
    request(force, 'opexcost', { entityType: $scope.opexCostFilter }, (penetration) => {
      var data = buildChartData(penetration, datasets)
      var options = {
        elements: { line: { fill: false, tension: 0 } }, // disables bezier curves
        scales: { yAxes: [{ ticks: { callback: function (value, index, values) { return $filter('number')(value, 0) + '%' },beginAtZero:  true } }] },
        tooltips: { mode: 'label', callbacks: {
            label: function (tooltipItems, data) {
              return $filter('number')(tooltipItems.yLabel, 2) + '%'
            }
          } }
      }
      showChart('financial-profile-chart-opex-cost', 'line', data, options)
    })
  }
  $scope.showOpexCostChart = showOpexCostChart

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
    $scope.selectedArea = null
    updateMetadataLabels($scope.plan.metadata);
    $scope.calculateShowData()
    refresh()
    if (mode === 'area') {
      serviceAreaLayer.revertStyles()
      $scope.layersStatus = MapLayer.hideAllLayers()
      serviceAreaLayer.show()
      regions.hide()
    } else {
      MapLayer.recoverLayersVisibility($scope.layersStatus)
      serviceAreaLayer.hide()
      regions.show()
    }
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
    $http.get(url).then((response) => {
      // Check if the user has changed to another wirectenter, to global mode or to another plan
      if (url === calculateURL() && $scope.mode === 'area') {
        console.log('loaded wirecenter data')
        updateMetadataLabels(response.data.metadata);
      }
    })
  }

  $scope.downloadChart = (id, name) => {
    var canvas = document.getElementById(id)
    var element = document.createElement('a')
    element.setAttribute('href', canvas.toDataURL('image/png'))
    element.setAttribute('download', name || `${id}.png`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  $scope.downloadBusinesses = () => {
    window.location.href = `/financial_profile/${$scope.plan.id}/exportBusinesses`
  }

  $scope.showBuildLease = () => {
    $('#build-lease').modal('show')
  }

  function updateMetadataLabels(plan) {
    $http.get(`/service/report/plan/${plan.id}`).then((response) => {
      $scope.metadata = response.data
      $scope.plannedNetworkDemand = $scope.metadata.demandSummary.networkDemands.filter((item) => item.demandType === 'planned_demand')[0]
    })
  }

  var serviceAreaLayer = new MapLayer({
    name: 'Child Plans',
    type: 'child_plans',
    api_endpoint: '/network_plan/:plan_id/child_plans',
    highlighteable: true,
    style_options: {
      normal: {
        strokeColor: 'cyan',
        strokeWeight: 4,
        fillOpacity: 0
      },
      highlight: {
        strokeColor: 'cyan',
        strokeWeight: 6,
        fillOpacity: 0.1
      }
    },
    reload: 'always',
    threshold: 0,
    minZoom: 6,
    hoverField: 'name',
    single_selection: true,
    declarativeStyles: (feature, styles) => {
      var selected = feature.getProperty('selected')
      if (selected) {
        styles.fillOpacity = 0.1
      }
    }
  })
}])
