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
      $scope.market_size = response;
      $('#location_show_business_market_size').modal('show');
      show_market_profile_chart();
    });
  }

  var chart;
  function show_market_profile_chart() {
    $('#business-market-size-chart').css({
      width: '100%',
      height: '200px',
    });

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
    var ctx = document.getElementById('business-market-size-chart').getContext('2d');
    chart && chart.destroy();
    chart = new Chart(ctx).Line(data, options);

    return chart
  };

});
