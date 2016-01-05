// Market Size Controller
app.controller('market_size_controller', ['$q', '$scope', '$rootScope', '$http', 'selection', 'map_tools', 'tracker', function($q, $scope, $rootScope, $http, selection, map_tools, tracker) {

  // Controller instance variables
  $scope.filters = null;
  $scope.loading = false;
  $scope.customer_type = null;

  // filters
  $scope.threshold = 152.4; // 500 feet in meters
  $scope.industry = null;
  $scope.product = null;
  $scope.employees_range = null;

  /************
  * FUNCTIONS *
  *************/

  var geo_json;

  $http.get('/market_size/filters').success(function(response) {
    $scope.filters = response;
    $scope.customer_type = response.customer_types[1];
    $('#market-size select[multiple]').each(function() {
      var self = $(this);
      self.select2({
        placeholder: self.attr('data-placeholder'),
      });
    });
  });

  $rootScope.$on('boundary_selected', function(e, json, title, type) {
    if (type !== 'market_size') return;

    geo_json = json;
    $scope.market_type = 'boundary';
    $scope.calculate_market_size();
    $('#market-size .modal-title').text('Market profile · '+title);
    $('#market-size').modal('show');
  });

  $rootScope.$on('market_profile_selected', function(e, market_profile) {
    geo_json = null;
    $scope.market_type = 'route';
    $('#market-size .modal-title').text('Market profile');

    if (market_profile) {
      $('#market-size select').val('').trigger('change');
      $scope.market_size = market_profile.market_size;
      $scope.market_size_existing = market_profile.market_size_existing;
      $scope.fair_share = market_profile.fair_share;
      $scope.share = market_profile.share;
      destroy_charts();
    } else {
      $scope.calculate_market_size();
    }
    $('#market-size').modal('show');
  });

  $('#market-size').on('shown.bs.modal', function() {
    if ($scope.market_size) {
      show_chart();
    }
  });

  $scope.route = null;
  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  var canceller = null;
  $scope.calculate_market_size = function() {
    $scope.market_size = null;
    $scope.fair_share = null;
    var params = {
      boundary: geo_json && JSON.stringify(geo_json),
      type: $scope.market_type,
      industry: arr($scope.industry),
      employees_range: arr($scope.employees_range),
      product: arr($scope.product),
      customer_type: $scope.customer_type && $scope.customer_type.id,
    };
    tracker.track('Market profile calculation', params);
    if (canceller) canceller.resolve();
    canceller = $q.defer();
    var args = {
      params: params,
      timeout: canceller.promise,
      customErrorHandling: true,
    };
    $scope.loading = true;
    destroy_charts();
    $http.get('/market_size/plan/'+$scope.route.id+'/calculate', args).success(function(market_profile) {
      $scope.loading = false;
      $scope.market_size = market_profile.market_size;
      $scope.fair_share = market_profile.fair_share;
      $scope.share = market_profile.share;
      destroy_charts();
      show_chart();
    }).error(function() {
      $scope.loading = false;
    });
  }

  function arr(value) {
    if (!value) return value;
    return value.map(function(elem) {
      return elem.id;
    }).join(',');
  }

  $('#market-size .nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    tracker.track('Market profile / '+$(this).text());
  });

  $('#market-size .nav-tabs').on('shown.bs.tab', function (e) {
    var href = $(e.target).attr('href')
    if (href === '#market_profile_fair_share') { //  && !fair_share_chart
      show_fair_share_chart();
    } else if (href === '#market_profile_market_size') {
      show_market_size_chart();
    }
  });

  $scope.export = function() {
    $('#market-size').modal('hide');
    tracker.track('Market profile export');
    swal({
      title: "File name",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: false,
      showLoaderOnConfirm: true,
      animation: "slide-from-top",
      inputPlaceholder: "export",
    }, function(name) {
      if (name === false) return false;
      var params = {
        boundary: geo_json && JSON.stringify(geo_json),
        type: $scope.market_type,
        industry: arr($scope.industry),
        employees_range: arr($scope.employees_range),
        product: arr($scope.product),
        customer_type: $scope.customer_type && $scope.customer_type.id,
        filename: name,
      };
      $http({
        url: '/market_size/plan/'+$scope.route.id+'/export',
        method: 'GET',
        params: params,
      })
      .success(function(response) {
        swal("Exported file now available");
        location.href = '/exported_file?filename='+encodeURIComponent(name);
      });
    });
  }

  function destroy_market_size_chart() {
    market_size_chart && market_size_chart.destroy();
    $('#market_profile_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_fair_share_chart() {
    fair_share_chart && fair_share_chart.destroy();
    $('#market_profile_fair_share_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_charts() {
    destroy_market_size_chart();
    destroy_fair_share_chart();
  }

  function show_chart() {
    $('#market-size .nav-tabs a:first').tab('show');
    show_market_size_chart();
  }

  var fair_share_chart = null;
  function show_fair_share_chart() {
    $scope.fair_share = $scope.fair_share || [];

    var total = $scope.fair_share.reduce(function(total, carrier) {
      return total + carrier.value;
    }, 0);

    var data = $scope.fair_share.map(function(carrier) {
      return {
        label: carrier.name,
        value: ((carrier.value*100)/total).toFixed(2),
        color: carrier.color,
        highlight: tinycolor(carrier.color).lighten().toString(),
      }
    });

    var options = {
      tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>%",
      legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"
    };
    var ctx = document.getElementById('market_profile_fair_share_chart').getContext('2d');
    destroy_fair_share_chart();
    fair_share_chart = new Chart(ctx).Pie(data, options);
    document.getElementById('market_profile_fair_share_chart_legend').innerHTML = fair_share_chart.generateLegend();
  }

  var market_size_chart = null;
  function show_market_size_chart() {
    var dataset = {
      label: "Market size",
      fillColor: "rgba(151,187,205,0.2)",
      strokeColor: "rgba(151,187,205,1)",
      pointColor: "rgba(151,187,205,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(151,187,205,1)",
      data: [],
    };

    var carrierDataset = {
      label: "Fair share",
      fillColor: "rgba(220,220,220,0.2)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(220,220,220,1)",
      data: [],
    }

    var existingDataset = {
      label: "Existing spend",
      fillColor: "rgba(70,191,189,0.2)",
      strokeColor: "rgba(70,191,189,1)",
      pointColor: "rgba(70,191,189,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(70,191,189,1)",
      data: [],
    }

    var data = {
      labels: [],
      datasets: [dataset, carrierDataset], //, existingDataset
    };

    $scope.market_size.forEach(function(row) {
      data.labels.push(row.year);
      dataset.data.push(row.total);
      carrierDataset.data.push(row.total*$scope.share);
    });

    // $scope.market_size_existing.forEach(function(row) {
    //   existingDataset.data.push(row.total);
    // });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      multiTooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\" style=\"float:right\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
    };
    var ctx = document.getElementById('market_profile_market_size_chart').getContext('2d');
    destroy_market_size_chart();
    market_size_chart = new Chart(ctx).Line(data, options);
    document.getElementById('market_profile_market_size_chart_legend').innerHTML = market_size_chart.generateLegend();
  };

}]);
