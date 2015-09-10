// Customer Profile Controller
app.controller('customer_profile_controller', ['$scope', '$rootScope', function($scope, $rootScope) {

  $rootScope.$on('route_selected', function(e, route) {
    $scope.route = route;
  });

  var chart = null;

  $('#modal-customer-profile').on('shown.bs.modal', function() {
    var colors = {
      'Existing Copper': {
        color: '#F7464A',
        highlight: '#FF5A5E',
      },
      'Existing Fiber': {
        color: '#46BFBD',
        highlight: '#5AD3D1',
      },
      'Prospect': {
        color: '#FDB45C',
        highlight: '#FFC870',
      }
    };
    var data = $scope.route.metadata.customer_types.map(function(customer_type) {
      return {
        value: customer_type.businesses + customer_type.households,
        color: colors[customer_type.name].color,
        highlight: colors[customer_type.name].highlight,
        label: customer_type.name,
      }
    });

    chart && chart.destroy();
    var options = {};
    var ctx = document.getElementById('customer-profile-chart').getContext('2d');
    chart = new Chart(ctx).Pie(data, options);
  });

}]);
