/* global app config $ encodeURIComponent _ tinycolor swal location Chart angular */
// Selected location controller
// #179702878 is this component still in use?
app.controller('selected_location_controller', ($rootScope, $scope, $http, $filter, map_tools, state) => {
  $scope.location = {}
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0
  $scope.config = config
  $scope.entityType = 'businesses'

  var chartColors = {
    fillColor: 'rgba(77,153,229,0.0)',
    strokeColor: 'rgba(77,153,229,1)',
    pointColor: '#fff',
    pointStrokeColor: 'rgba(77,153,229,1)',
    pointHighlightFill: 'rgba(77,153,229,1)',
    pointHighlightStroke: 'rgba(77,153,229,1)'
  }

  $scope.state = state

  $rootScope.$on('map_layer_clicked_feature', (event, options) => {
    if (!map_tools.is_visible(map_tools.TOOL_IDS.LOCATIONS)) {
      return // Process the click only if we have the locations layer open
    }
    if (options.length > 0 && options[0].location_id) {
      var id = options[0].location_id
      // openLocation(id) In project2.0 version on click of location in view mode -> more info w'll display the location detail modal
    }
  })

  $rootScope.$on('openLocation', (event, id) => {
    openLocation(id)
  })

  function openLocation (id) {
    $http.get(`/locations/${state.plan.id}/${id}/show`).then((response) => {
      response.data.id = id
      setSelectedLocation(response.data)
      $scope.market_size = null
      $scope.fair_share = null
      $scope.calculateMarketSize()
        .then(() => {
          $('#selected_location_controller').modal('show')
          $('#selected_location_market_profile select[multiple]').select2('val', [])
        })
    })
  }

  state.showDetailedLocationInfo
    .subscribe((locationInfo) => {
      if (!locationInfo) return
      setSelectedLocation(locationInfo)
      $scope.market_size = null
      $scope.fair_share = null
      $scope.calculateMarketSize()
        .then(() => {
          $('#selected_location_controller').modal('show')
          $('#selected_location_market_profile select[multiple]').select2('val', [])
        })
    })

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
    }).then((response) => {
      $('#selected_location_controller').modal('hide')
    })
  }

  function setSelectedLocation (location) {
    location.total_costs = location.entry_fee +
                          location.household_install_costs * location.number_of_households +
                          location.business_install_costs * location.number_of_businesses
    $scope.location = location

    var coordinates = location.geog.coordinates[1] + ',' + location.geog.coordinates[0]
    var params = {
      center: coordinates,
      zoom: 13,
      size: '434x110', // We want an image with size '868x220' but our free license only allows a max size of 640x640
      scale: 2, // So we set scale = 2 and size of '434x110'
      maptype: 'roadmap',
      markers: 'color:red|label:L|' + coordinates,
      key: state.googleMapsLicensing.API_KEY
    }
    $scope.map_url = 'https://maps.googleapis.com/maps/api/staticmap?' +
      _.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&')

    preserveBusinessDetail()
    $scope.businesses = []
    $scope.selected_business = null
    $http.get('/locations/businesses/' + location.id).then((response) => {
      preserveBusinessDetail()
      $scope.businesses = response.data
      if (!location.address) {
        var business = $scope.businesses.filter((business) => {
          return business.address
        })[0]
        location.address = business && business.address
      }
    })
    $scope.towers = []
    $http.get('/locations/towers/' + location.id).then((response) => {
      preserveBusinessDetail()
      $scope.towers = response.data
    })
    $scope.households = []
    $http.get('/locations/households/' + location.id).then((response) => {
      preserveBusinessDetail()
      $scope.households = response.data
    })
  }

  function preserveBusinessDetail () {
    $('#selected_location_businesses tbody:first').append($('#location_business_selected_info').hide())
  }

  $('#selected_location_controller .nav-pills a').click((e) => {
    e.preventDefault()
    $(this).tab('show')
  })

  $http.get('/market_size/filters').then((response) => {
    $scope.filters = response.data
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
    return $http.get('/market_size/location/' + $scope.location.id, args).then((response) => {
      $scope.market_size = response.data.market_size
      $scope.fair_share = response.data.fair_share
      $scope.share = response.data.share
      $scope.loading = false
      destroyCharts()
      showCurrentChart()
      return Promise.resolve()
    })
  }

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
        url: '/market_size/plan/' + state.plan.id + '/location/' + $scope.location.id + '/export',
        method: 'GET',
        params: params
      })
        .then((response) => {
          swal('Exported file now available')
          location.href = '/exported_file?filename=' + encodeURIComponent(name)
        })
    })
  }

  function destroyMarketSizeChart () {
    market_size_chart && market_size_chart.destroy()
    $('#location_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  var fairShareCharts = {}
  function destroyFairShareCharts () {
    Object.keys(fairShareCharts).forEach((key) => {
      fairShareCharts[key].destroy()
      $(`#location_fair_share_chart_${key}`).css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
    })
  }

  // function destroyCustomerProfileChart (type) {
  //   customerProfileCharts[type] && customerProfileCharts[type].destroy()
  //   $(`#location_customer_profile_chart_${type}`).css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  // }

  // function destroyCustomerProfileCharts () {
  //   Object.keys(customerProfileCharts).forEach(destroyCustomerProfileChart)
  // }

  function destroyCharts () {
    destroyMarketSizeChart()
    destroyFairShareCharts()
    // destroyCustomerProfileCharts()
  }

  function arr (value) {
    if (!value) return value
    return value.map((elem) => elem.id).join(',')
  }

  function showCurrentChart () {
    var href = $('#selected_location_controller .nav-pills .active').attr('href')
    if (href === '#selected_location_fair_share') {
      showFairShareCharts()
    } else if (href === '#selected_location_market_profile') {
      showMarketProfileCharts()
    }
    // else if (href === '#selected_location_customer_profile') {
    //   showCustomerProfileCharts()
    // }
  }

  var market_size_chart
  function showMarketProfileCharts () {
    var dataset = {
      label: 'Market size',
      fillColor: chartColors.fillColor,
      strokeColor: chartColors.strokeColor,
      pointColor: chartColors.pointColor,
      pointStrokeColor: chartColors.pointStrokeColor,
      pointHighlightFill: chartColors.pointHighlightFill,
      pointHighlightStroke: chartColors.pointHighlightStroke,
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
      datasets: [dataset] // carrierDataset
    }

    $scope.market_size.forEach((row) => {
      data.labels.push(row.year)
      dataset.data.push(row.total)
      carrierDataset.data.push(row.total * $scope.share)
    })

    var options = {
      scaleBeginAtZero: 1,
      scales: { yAxes: [{ ticks: { callback: function (value, index, values) { return $filter('currency')(value / 1000, '$', 0) + ' K' }, beginAtZero: true } }] },
      tooltips: { mode: 'label',
        callbacks: {
          label: function (tooltipItems, data) {
            return $filter('currency')(tooltipItems.yLabel / 1000, '$', 2) + ' K'
          }
        } }
    }
    var ctx = document.getElementById('location_market_size_chart').getContext('2d')
    destroyMarketSizeChart()
    market_size_chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: options
    })
  };

  function showFairShareCharts () {
    destroyFairShareCharts()
    ;['households', 'businesses', 'towers'].forEach((key) => showFairShareChart(key))
  }

  function showFairShareChart (type) {
    var values = ($scope.fair_share || {})[type] || []
    var total = values.reduce((total, carrier) => total + carrier.value, 0)

    var data = values.map((carrier) => {
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
    var el = document.getElementById(`location_fair_share_chart_${type}`)
    if (!el) return
    var ctx = el.getContext('2d')
    var chart = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: options
    })
    fairShareCharts[type] = chart
    document.getElementById(`location_fair_share_chart_legend_${type}`).innerHTML = chart.generateLegend()
  }

  var customerProfileCharts = {}
  // function showCustomerProfileCharts () {
  //   ['households', 'businesses', 'towers'].forEach(showCustomerProfileChart)
  // }

  // var customerTypeColor = {}
  // function showCustomerProfileChart (type) {
  //   var customerTypes = $scope.location.customer_profile[type]
  //   var customerTypeColorsArray = [
  //     'rgb(242, 252, 148)',
  //     'rgb(181, 111, 19)',
  //     'rgb(29, 183, 244)',
  //     'rgb(59, 86, 186)',
  //     'rgb(178, 7, 35)'
  //   ]

  //   var data = []
  //   customerTypes.forEach((customerType) => {
  //     var color = customerTypeColor[customerType.name] || customerTypeColorsArray.shift()
  //     customerTypeColor[customerType.name] = color
  //     data.push({
  //       label: customerType.name,
  //       value: customerType.total,
  //       color: color,
  //       highlight: tinycolor(color).lighten().toString()
  //     })
  //   })

  //   var options = {
  //     tooltipTemplate: '<%if (label){%><%=label%>: <%}%><%= value %>',
  //     tooltipFontSize : 12
  //   }
  //   var ctx = document.getElementById('location_customer_profile_chart_' + type).getContext('2d')
  //   destroyCustomerProfileChart(type)
  //   //customerProfileCharts[type] = new Chart(ctx).Pie(data, options)
  //   //Using 2.7.0 version of Chart.js
  //   customerProfileCharts[type] = new Chart(ctx, {
  //     type: 'pie',
  //     data: data,
  //     options: options
  //   });
  //   document.getElementById('location_customer_profile_chart_legend_' + type).innerHTML = customerProfileCharts[type].generateLegend()
  // }

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
    var params = {
      product: arr($scope.product)
    }
    var args = {
      params: params
    }
    $http.get('/market_size/business/' + $scope.selected_business.id, args).then((response) => {
      $scope.business_market_size = response.data.market_size
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
      fillColor: chartColors.fillColor,
      strokeColor: chartColors.strokeColor,
      pointColor: chartColors.pointColor,
      pointStrokeColor: chartColors.pointStrokeColor,
      pointHighlightFill: chartColors.pointHighlightFill,
      pointHighlightStroke: chartColors.pointHighlightStroke,
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
      scaleBeginAtZero: 1,
      scales: { yAxes: [{ ticks: { callback: function (value, index, values) { return $filter('currency')(value / 1000, '$', 0) + ' K' }, beginAtZero: true } }] },
      tooltips: { callbacks: {
        label: function (tooltipItems, data) {
          return $filter('currency')(tooltipItems.yLabel / 1000, '$', 2) + ' K'
        }
      } }
    }
    destroyBusinessMarketSizeChart()
    var ctx = document.getElementById('business_market_size_chart').getContext('2d')
    business_market_size_chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: options
    })
  }
})
