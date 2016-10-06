/* global app config $ encodeURIComponent _ tinycolor swal location Chart angular randomColor */
// Selected location controller
app.controller('selected_location_controller', ($rootScope, $scope, $http, map_layers, tracker, map_tools) => {
  $scope.location = {}
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0
  $scope.config = config
  $scope.entityType = 'businesses'

  $scope.select_random_location = () => {
    var map_layer = map_layers.getFeatureLayer('locations')
    var feature
    map_layer.data_layer.forEach((f) => {
      feature = feature || f
    })
    var options = {
      add: (text, func) => {
        if (text === 'See more information') {
          func(map_layer, feature)
        }
      }
    }
    $rootScope.$broadcast('contextual_menu_feature', options, map_layer, feature)
  }

  $rootScope.$on('map_layer_clicked_feature', (event, options, map_layer) => {
    if ((map_layer.type !== 'locations' && map_layer.type !== 'selected_locations' && map_layer.type !== 'towers') ||
      map_tools.is_visible('target_builder')) return
    var feature = options.feature
    var id = feature.getProperty('id')
    openLocation(id)
    tracker.track('Location selected')
  })

  $rootScope.$on('openLocation', (event, id) => {
    openLocation(id)
  })

  function openLocation (id) {
    $http.get('/locations/' + id + '/show').success((response) => {
      response.id = id
      setSelectedLocation(response)
      $('#selected_location_controller').modal('show')
      $('#selected_location_market_profile select[multiple]').select2('val', [])
      $scope.market_size = null
      $scope.fair_share = null
      $scope.calculateMarketSize()
    })
  }

  $('#selected_location_controller').on('shown.bs.modal', (e) => {
    $('#selected_location_controller a[href="#selected_location_customer_profile"]').tab('show')
    showCurrentChart()
  })

  $('#selected_location_controller').on('shown.bs.tab', (e) => {
    showCurrentChart()
  })

  $scope.update = () => {
    var location = $scope.location
    var location_id = location.location_id
    $http.post('/locations/' + location_id + '/update', {
      number_of_households: location.number_of_households
    }).success((response) => {
      $('#selected_location_controller').modal('hide')
    })
  }

  function setSelectedLocation (location) {
    location.total_costs = location.entry_fee +
                          location.household_install_costs * location.number_of_households +
                          location.business_install_costs * location.number_of_businesses
    $scope.location = location

    var google_maps_key = 'AIzaSyDYjYSshVYlkt2hxjrpqTg31KdMkw-TXSM'
    var coordinates = location.geog.coordinates[1] + ',' + location.geog.coordinates[0]
    var params = {
      center: coordinates,
      zoom: 13,
      size: '400x150',
      maptype: 'roadmap',
      markers: 'color:red|label:L|' + coordinates,
      key: google_maps_key
    }
    $scope.map_url = 'https://maps.googleapis.com/maps/api/staticmap?' +
      _.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&')

    preserveBusinessDetail()
    $scope.businesses = []
    $scope.selected_business = null
    $http.get('/locations/businesses/' + location.id).success((response) => {
      preserveBusinessDetail()
      $scope.businesses = response
      if (!location.address) {
        var business = $scope.businesses.filter((business) => {
          return business.address
        })[0]
        location.address = business && business.address
      }
    })
    $scope.towers = []
    $http.get('/locations/towers/' + location.id).success((response) => {
      preserveBusinessDetail()
      $scope.towers = response
    })
    $scope.households = []
  }

  function preserveBusinessDetail () {
    $('#selected_location_businesses tbody:first').append($('#location_business_selected_info').hide())
  }

  $('#selected_location_controller .nav-tabs a').click((e) => {
    e.preventDefault()
    $(this).tab('show')
    tracker.track('Location selected / ' + $(this).text())
  })

  $http.get('/market_size/filters').success((response) => {
    $scope.filters = response
    $('#selected_location_controller select[multiple]').each(function () {
      var self = $(this)
      self.select2({
        placeholder: self.attr('data-placeholder')
      })
    })
  })

  $scope.calculateMarketSize = () => {
    $scope.loading = true
    var params = {
      industry: arr($scope.industry),
      employees_range: arr($scope.employees_range),
      product: arr($scope.product),
      customer_type: $scope.customer_type && $scope.customer_type.id,
      entity_type: $scope.entityType
    }
    var args = {
      params: params
    }
    $http.get('/market_size/location/' + $scope.location.id, args).success((response) => {
      $scope.market_size = response.market_size
      $scope.fair_share = response.fair_share
      $scope.share = response.share
      $scope.loading = false
      destroyCharts()
      showCurrentChart()
    })
  }

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  $scope.export = () => {
    $('#selected_location_controller').modal('hide')
    swal({
      title: 'File name',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: false,
      showLoaderOnConfirm: true,
      animation: 'slide-from-top',
      inputPlaceholder: 'export'
    }, (name) => {
      if (name === false) return false
      var params = {
        type: $scope.market_type,
        industry: arr($scope.industry),
        employees_range: arr($scope.employees_range),
        product: arr($scope.product),
        customer_type: $scope.customer_type && $scope.customer_type.id,
        filename: name
      }
      $http({
        url: '/market_size/plan/' + $scope.plan.id + '/location/' + $scope.location.id + '/export',
        method: 'GET',
        params: params
      })
      .success((response) => {
        swal('Exported file now available')
        location.href = '/exported_file?filename=' + encodeURIComponent(name)
      })
    })
  }

  function destroyMarketSizeChart () {
    market_size_chart && market_size_chart.destroy()
    $('#location_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  function destroyFairShareChart () {
    fair_share_chart && fair_share_chart.destroy()
    $('#location_fair_share_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  function destroyCustomerProfileChart (type) {
    customerProfileCharts[type] && customerProfileCharts[type].destroy()
    $('#location_customer_profile_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  function destroyCustomerProfileCharts () {
    Object.keys(customerProfileCharts).forEach(destroyCustomerProfileChart)
  }

  function destroyCharts () {
    destroyMarketSizeChart()
    destroyFairShareChart()
    destroyCustomerProfileCharts()
  }

  function arr (value) {
    if (!value) return value
    return value.map((elem) => elem.id).join(',')
  }

  function showCurrentChart () {
    var href = $('#selected_location_controller .nav-tabs > .active a').attr('href')
    if (href === '#selected_location_fair_share') {
      showFaiShareChart()
    } else if (href === '#selected_location_market_profile') {
      showMarketProfileCharts()
    } else if (href === '#selected_location_customer_profile') {
      showCustomerProfileCharts()
    }
  }

  var market_size_chart
  function showMarketProfileCharts () {
    var dataset = {
      label: 'Market size',
      fillColor: 'rgba(151,187,205,0.2)',
      strokeColor: 'rgba(151,187,205,1)',
      pointColor: 'rgba(151,187,205,1)',
      pointStrokeColor: '#fff',
      pointHighlightFill: '#fff',
      pointHighlightStroke: 'rgba(151,187,205,1)',
      data: []
    }

    var carrierDataset = {
      label: 'Fair share',
      fillColor: 'rgba(220,220,220,0.2)',
      strokeColor: 'rgba(220,220,220,1)',
      pointColor: 'rgba(220,220,220,1)',
      pointStrokeColor: '#fff',
      pointHighlightFill: '#fff',
      pointHighlightStroke: 'rgba(220,220,220,1)',
      data: []
    }

    var data = {
      labels: [],
      datasets: [dataset, carrierDataset]
    }

    $scope.market_size.forEach((row) => {
      data.labels.push(row.year)
      dataset.data.push(row.total)
      carrierDataset.data.push(row.total * $scope.share)
    })

    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    var ctx = document.getElementById('location_market_size_chart').getContext('2d')
    destroyMarketSizeChart()
    market_size_chart = new Chart(ctx).Line(data, options)
  };

  var fair_share_chart = null
  function showFaiShareChart () {
    $scope.fair_share = $scope.fair_share || []
    var total = $scope.fair_share.reduce((total, carrier) => total + carrier.value, 0)

    var data = $scope.fair_share.map((carrier) => {
      var distance = carrier.distance !== null ? ' (' + angular.injector(['ng']).get('$filter')('number')(carrier.distance, 2) + 'm)' : ''
      return {
        label: carrier.name + distance,
        value: ((carrier.value * 100) / total).toFixed(2),
        color: carrier.color,
        highlight: tinycolor(carrier.color).lighten().toString()
      }
    })

    var options = {
      tooltipTemplate: `<%if (label){%><%=label%>: <%}%><%= value %>%` // eslint-disable-line
    }
    var ctx = document.getElementById('location_fair_share_chart').getContext('2d')
    destroyFairShareChart()
    fair_share_chart = new Chart(ctx).Pie(data, options)
    document.getElementById('location_fair_share_chart_legend').innerHTML = fair_share_chart.generateLegend()
  }

  var customerProfileCharts = {}
  function showCustomerProfileCharts () {
    ['households', 'businesses', 'towers'].forEach(showCustomerProfileChart)
  }

  var customerTypeColorsArray = randomColor({ seed: 1, count: 3 })
  var customerTypeColor = {}
  function showCustomerProfileChart (type) {
    var customerTypes = $scope.location.customer_profile[type]

    var data = []
    customerTypes.forEach((customerType) => {
      var color = customerTypeColor[customerType.name] || customerTypeColorsArray.shift()
      customerTypeColor[customerType.name] = color
      data.push({
        label: customerType.name,
        value: customerType.total,
        color: color,
        highlight: tinycolor(color).lighten().toString()
      })
    })

    var options = {
      tooltipTemplate: '<%if (label){%><%=label%>: <%}%><%= value %>'
    }
    var ctx = document.getElementById('location_customer_profile_chart_' + type).getContext('2d')
    destroyCustomerProfileChart(type)
    customerProfileCharts[type] = new Chart(ctx).Pie(data, options)
    document.getElementById('location_customer_profile_chart_legend_' + type).innerHTML = customerProfileCharts[type].generateLegend()
  }

  $scope.show_market_profile = (business) => {
    if ($scope.selected_business && $scope.selected_business.id === business.id) {
      $scope.selected_business = null
      $('#location_business_selected_info').hide()
    } else {
      $scope.business_market_size = null
      $scope.selected_business = business
      $scope.calculate_business_market_size()

      var row = $('#location_business_row_' + business.id)
      $('#location_business_selected_info').insertAfter(row.parent()).show()
    }
  }

  $scope.calculate_business_market_size = () => {
    tracker.track('Location selected / Businesses / Business market profile')
    var params = {
      product: arr($scope.product)
    }
    var args = {
      params: params
    }
    $http.get('/market_size/business/' + $scope.selected_business.id, args).success((response) => {
      $scope.business_market_size = response.market_size
      showBusinessChart()
    })
  }

  function destroyBusinessMarketSizeChart () {
    business_market_size_chart && business_market_size_chart.destroy()
    $('#business_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  var business_market_size_chart
  function showBusinessChart () {
    var dataset = {
      label: 'Market size',
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

    $scope.business_market_size.forEach((row) => {
      data.labels.push(row.year)
      dataset.data.push(row.total)
    })

    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>` // eslint-disable-line
    }
    destroyBusinessMarketSizeChart()
    var ctx = document.getElementById('business_market_size_chart').getContext('2d')
    business_market_size_chart = new Chart(ctx).Line(data, options)
  }
})
