/* global $ app config randomColor tinycolor Chart */
// Customer Profile Controller
app.controller('customer_profile_controller', ['$scope', '$rootScope', '$http', '$q', ($scope, $rootScope, $http, $q) => {
  $scope.type = 'route'
  $scope.loading = false
  $scope.data = {}
  $scope.show_households = config.ui.map_tools.locations.view.indexOf('residential') >= 0

  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  var chart = null
  var geo_json

  $rootScope.$on('boundary_selected', (e, json, title, type) => {
    if (type !== 'customer_profile') return

    geo_json = json
    $scope.type = 'all'
    $scope.calculate_customer_profile()
    open_modal(title)
  })

  $rootScope.$on('customer_profile_selected', (e, json, title, type) => {
    $scope.data = $scope.plan.metadata
    calculateColors()
    $scope.type = 'route'
    open_modal(null)
    show_chart()
  })

  function open_modal (title) {
    $('#modal-customer-profile .modal-title').text(title ? 'Customer profile · ' + title : 'Customer profile')
    $('#modal-customer-profile').modal('show')
  }

  var canceller = null
  $scope.calculate_customer_profile = () => {
    $scope.data = {}
    var params = {
      boundary: geo_json && JSON.stringify(geo_json),
      type: $scope.type
    }
    if (canceller) canceller.resolve()
    canceller = $q.defer()
    var args = {
      params: params,
      timeout: canceller.promise,
      customErrorHandling: true
    }
    $scope.loading = true
    chart && chart.destroy()
    $http.get('/customer_profile/' + $scope.plan.id + '/boundary', args).success((response) => {
      $scope.data = response
      calculateColors()
      show_chart()
    }).error(() => {
      $scope.loading = false
    })
  }

  function calculateColors () {
    $scope.data.customer_types = $scope.data.customer_types || []
    var colors = randomColor({ seed: 1, count: $scope.data.customer_types.length })
    $scope.data.customer_types.forEach((customer_type) => {
      customer_type.color = colors.shift()
    })
  }

  function show_chart () {
    $scope.loading = false

    var data = $scope.data.customer_types.map((customer_type) => {
      var color = customer_type.color
      return {
        name: customer_type.name,
        label: customer_type.name,
        value: (customer_type.businesses + customer_type.households) * 100 / $scope.data.customers_businesses_total,
        color: color,
        highlight: tinycolor(color).lighten().toString()
      }
    })

    chart && chart.destroy()
    var options = {
      tooltipTemplate: `
        <%if (label){%><%=label%>: <%}%>
        <%= angular.injector(['ng']).get('$filter')('number')(value, 0) %>%
      `
    }
    var ctx = document.getElementById('customer-profile-chart').getContext('2d')
    chart = new Chart(ctx).Pie(data, options)
  }
}])
