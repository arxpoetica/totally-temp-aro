// Show businesses of a selected location
app.controller('location_show_businesses', function($rootScope, $scope, $http) {
  $scope.businesses = [];

  $rootScope.$on('contextual_menu_feature', function(event, options, map_layer, feature) {
    if (map_layer.type !== 'locations') return;

    options.add('Show businesses', function(map_layer, feature) {
      var id = feature.getProperty('id');
      $http.get('/locations/businesses/' + id).success(function(response) {
        $scope.businesses = response;
        $('#location_show_businesses').modal('show');
      });
    });
  });

  $scope.show_market_profile = function(business) {
    $http.get('/market_size/business/'+business.id).success(function(response) {
      $scope.market_size = response.market_size;
      $scope.fair_share = response.fair_share;
      $('#location_show_business_market_profile').modal('show');
      show_current_chart();
    });
  }

  $('#location_show_business_market_profile').on('shown.bs.tab', function(e) {
    show_current_chart();
  });

  $('#location_show_business_market_profile .nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  function show_current_chart() {
    var href = $('#location_show_business_market_profile .nav-tabs > .active a').attr('href');
    if (href === '#location_show_business_market_size') {
      show_market_size_chart();
    } else if (href === '#location_show_business_fair_share') {
      show_fair_share_chart();
    }
  }

  function destroy_market_size_chart() {
    market_size_chart && market_size_chart.destroy();
    $('#business_market_size_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_fair_share_chart() {
    fair_share_chart && fair_share_chart.destroy();
    $('#business_fair_share_chart').css({ width: '100%', height: '200px' }).removeAttr('width').removeAttr('height');
  }

  function destroy_charts() {
    destroy_market_size_chart();
    destroy_fair_share_chart();
  }

  var market_size_chart;
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

    var data = {
      labels: [],
      datasets: [dataset],
    };

    $scope.market_size.forEach(function(row) {
      data.labels.push(row.year);
      dataset.data.push(row.total);
    });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
    };
    destroy_market_size_chart();
    var ctx = document.getElementById('business_market_size_chart').getContext('2d');
    market_size_chart = new Chart(ctx).Line(data, options);
  };

  var fair_share_chart = null;
  function show_fair_share_chart() {
    var colors = [];
    colors.push({
      color: '#F7464A',
      highlight: '#FF5A5E',
    });
    colors.push({
      color: '#46BFBD',
      highlight: '#5AD3D1',
    });
    colors.push({
      color: '#FDB45C',
      highlight: '#FFC870',
    });

    var total = ($scope.fair_share || []).reduce(function(total, carrier) {
      return total + carrier.value;
    }, 0);

    var data = ($scope.fair_share || []).map(function(carrier) {
      var info = colors.shift();
      if (!info) {
        info = {
          color: 'gray',
          highlight: 'gray',
        }
      }
      info.label = carrier.name;
      info.value = ((carrier.value*100)/total).toFixed(2);
      return info;
    });

    var options = {
      tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>%",
    };
    destroy_fair_share_chart();
    var ctx = document.getElementById('business_fair_share_chart').getContext('2d');
    fair_share_chart = new Chart(ctx).Pie(data, options);
  };

});
