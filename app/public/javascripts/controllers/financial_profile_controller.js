// Financial Profile Controller
app.controller('financial_profile_controller', ['$scope', '$rootScope', function($scope, $rootScope) {

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  $('#modal-financial-profile').on('shown.bs.modal', function() {
    var dataset = {
      label: "NPV",
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

    ($scope.route.metadata.npv || []).forEach(function(revenue) {
      data.labels.push(revenue.year);
      dataset.data.push(revenue.value);
    });

    var options = {
      scaleLabel : "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
      tooltipTemplate: "<%= angular.injector(['ng']).get('$filter')('currency')(value) %>",
    };
    var ctx = document.getElementById('financial-profile-chart').getContext('2d');
    var myLineChart = new Chart(ctx).Line(data, options);
  });


}]);
