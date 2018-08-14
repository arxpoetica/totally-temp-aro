/* global app $ swal encodeURIComponent location Chart tinycolor map */
// Market Size Controller
app.controller('market_size_controller', ['$q', '$scope', '$rootScope', '$http', 'map_tools', 'tracker', ($q, $scope, $rootScope, $http, map_tools, tracker) => {
  // Controller instance variables
  $scope.filters = null
  $scope.loading = false
  $scope.customer_type = null

  // filters
  $scope.threshold = 152.4 // 500 feet in meters
  $scope.industry = null
  $scope.product = null
  $scope.employees_range = null
  $scope.entityType = 'businesses'

  var geo_json

  $http.get('/market_size/filters').then((response) => {
    $scope.filters = response.data
    $scope.customer_type = response.data.customer_types[1]
    $('#market-size select[multiple]').each(function () {
      var self = $(this)
      self.select2({
        placeholder: self.attr('data-placeholder')
      })
    })
  })

  $rootScope.$on('boundary_selected', (e, json, title, type) => {
    if (type !== 'market_size') return

    geo_json = json
    $scope.market_type = 'all'
    $scope.calculateMarketSize()
    $('#market-size .modal-title').text('Market profile · ' + title)
    $('#market-size').modal('show')
  })

  $rootScope.$on('market_profile_selected', (e, market_profile) => {
    geo_json = null
    $scope.market_type = 'all'
    $('#market-size .modal-title').text('Market profile')

    if (market_profile) {
      $('#market-size select[multiple]').select2('val', '')
      $scope.customer_type = ''
      $scope.market_size = market_profile.market_size
      $scope.market_size_existing = market_profile.market_size_existing
      $scope.fair_share = market_profile.fair_share
      $scope.share = market_profile.share
      destroyCharts()
    } else {
      $scope.calculateMarketSize()
    }
    $('#market-size').modal('show')
  })

  $('#market-size').on('shown.bs.modal', () => {
    if ($scope.market_size) {
      showChart()
    }
  })

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  var canceller = null
  $scope.calculateMarketSize = (onlyFairShare) => {
    $scope.market_size = null
    $scope.fair_share = null
    var bounds = map.getBounds()
    var params = {
      boundary: geo_json && JSON.stringify(geo_json),
      type: $scope.market_type,
      industry: arr($scope.industry),
      employees_range: arr($scope.employees_range),
      product: arr($scope.product),
      customer_type: $scope.customer_type && $scope.customer_type.id,
      nelat: bounds.getNorthEast().lat(),
      nelon: bounds.getNorthEast().lng(),
      swlat: bounds.getSouthWest().lat(),
      swlon: bounds.getSouthWest().lng(),
      zoom: map.getZoom(),
      threshold: 0,
      entity_type: $scope.entityType
    }
    if (canceller) canceller.resolve()
    canceller = $q.defer()
    var args = {
      params: params,
      timeout: canceller.promise,
      customErrorHandling: true
    }
    $scope.loading = true
    destroyCharts()
    var endpoint = onlyFairShare ? '/fair_share' : '/calculate'
    $http.get('/market_size/plan/' + $scope.plan.id + endpoint, args).then((market_profile) => {
      if (market_profile.status >= 200 && market_profile.status < 299) {
        $scope.loading = false
        if (onlyFairShare) {
          $scope.fair_share = market_profile.data
          destroyFairShareChart()
          showFairShareChart()
        } else {
          $scope.market_size = market_profile.data.market_size
          $scope.fair_share = market_profile.data.fair_share
          $scope.share = market_profile.data.share
          destroyCharts()
          showChart()
        }
      } else {
        $scope.loading = false
      }
    })
  }

  function arr (value) {
    if (!value) return value
    return value.map((elem) => {
      return elem.id
    }).join(',')
  }

  $('#market-size .nav-tabs a').click((e) => {
    e.preventDefault()
    $(this).tab('show')
  })

  $('#market-size .nav-tabs').on('shown.bs.tab', (e) => {
    var href = $(e.target).attr('href')
    if (href === '#market_profile_fair_share') { //  && !fair_share_chart
      showFairShareChart()
    } else if (href === '#market_profile_market_size') {
      showMarketSizeChart()
    }
  })

  $scope.export = () => {
    $('#market-size').modal('hide')
    swal({
      title: 'File name',
      text: 'Note: generating the CSV file may take a few minutes.',
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: false,
      showLoaderOnConfirm: true,
      animation: 'slide-from-top',
      inputPlaceholder: 'export'
    }, (name) => {
      if (!name) return false
      var bounds = map.getBounds()
      var params = {
        boundary: geo_json && JSON.stringify(geo_json),
        type: $scope.market_type,
        industry: arr($scope.industry),
        employees_range: arr($scope.employees_range),
        product: arr($scope.product),
        customer_type: $scope.customer_type && $scope.customer_type.id,
        filename: name,
        nelat: bounds.getNorthEast().lat(),
        nelon: bounds.getNorthEast().lng(),
        swlat: bounds.getSouthWest().lat(),
        swlon: bounds.getSouthWest().lng(),
        zoom: map.getZoom(),
        threshold: 0
      }
      $http({
        url: '/market_size/plan/' + $scope.plan.id + '/export',
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
    $('#market_profile_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  function destroyFairShareChart () {
    fair_share_chart && fair_share_chart.destroy()
    $('#market_profile_fair_share_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height')
  }

  function destroyCharts () {
    destroyMarketSizeChart()
    destroyFairShareChart()
  }

  function showChart () {
    $('#market-size .nav-tabs a:first').tab('show')
    showMarketSizeChart()
  }

  var fair_share_chart = null
  function showFairShareChart () {
    $scope.fair_share = $scope.fair_share || []

    var total = $scope.fair_share.reduce((total, carrier) => total + carrier.value, 0)
    var data = $scope.fair_share.map((carrier) => {
      return {
        label: carrier.name,
        value: ((carrier.value * 100) / total).toFixed(2),
        color: carrier.color,
        highlight: tinycolor(carrier.color).lighten().toString()
      }
    })

    var options = {
      tooltipTemplate: `<%if (label){%><%=label%>: <%}%><%= value %>%`, // eslint-disable-line
      legendTemplate: `
        <ul class="<%=name.toLowerCase()%>-legend">
          <% for (var i=0; i<segments.length; i++) { %>
            <li><span style="background-color:<%=segments[i].fillColor%>"></span>
              <% if(segments[i].label) { %><%= segments[i].label %><% } %>
            </li>
          <% } %>
        </ul>
      `
    }
    var ctx = document.getElementById('market_profile_fair_share_chart').getContext('2d')
    destroyFairShareChart()
    fair_share_chart = new Chart(ctx).Pie(data, options)
    document.getElementById('market_profile_fair_share_chart_legend').innerHTML = fair_share_chart.generateLegend()
  }

  var market_size_chart = null
  function showMarketSizeChart () {
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

    // var existingDataset = {
    //   label: 'Existing spend',
    //   fillColor: 'rgba(70,191,189,0.2)',
    //   strokeColor: 'rgba(70,191,189,1)',
    //   pointColor: 'rgba(70,191,189,1)',
    //   pointStrokeColor: '#fff',
    //   pointHighlightFill: '#fff',
    //   pointHighlightStroke: 'rgba(70,191,189,1)',
    //   data: []
    // }

    var data = {
      labels: [],
      datasets: [dataset, carrierDataset] //, existingDataset
    }

    $scope.market_size.forEach((row) => {
      data.labels.push(row.year)
      dataset.data.push(row.total)
      carrierDataset.data.push(row.total * $scope.share)
    })

    // $scope.market_size_existing.forEach(function(row) {
    //   existingDataset.data.push(row.total);
    // });

    var options = {
      scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value) %>`, // eslint-disable-line
      legendTemplate: `
        <ul class="<%=name.toLowerCase()%>-legend" style="float:right">
          <% for (var i=0; i<datasets.length; i++) { %>
            <li><span style="background-color:<%=datasets[i].strokeColor%>"></span>
              <% if(datasets[i].label) { %><%= datasets[i].label %><% } %>
            </li>
          <% } %>
        </ul>
      `
    }
    var ctx = document.getElementById('market_profile_market_size_chart').getContext('2d')
    destroyMarketSizeChart()
    market_size_chart = new Chart(ctx).Line(data, options)
    document.getElementById('market_profile_market_size_chart_legend').innerHTML = market_size_chart.generateLegend()
  }
}])
