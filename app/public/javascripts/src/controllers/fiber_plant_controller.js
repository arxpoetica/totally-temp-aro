/* global app config $ _ */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', 'tracker', ($scope, $rootScope, $http, map_tools, MapLayer, tracker) => {
  $scope.map_tools = map_tools
  $scope.carriers = []
  $scope.overlay = 'none'

  $scope.competitors_fiber = new MapLayer({
    api_endpoint: '/network/fiber_plant_competitors',
    style_options: {
      normal: {
        strokeColor: 'blue',
        strokeWeight: 2,
        fillColor: 'blue'
      }
    },
    threshold: 12,
    reload: 'always'
  })

  $scope.competitors_density = new MapLayer({
    api_endpoint: '/network/fiber_plant_density',
    style_options: {
      normal: {
        strokeColor: 'blue',
        strokeWeight: 2,
        fillColor: 'blue'
      }
    },
    threshold: 12,
    reload: 'always'
  })

  $scope.competitors_fairshare = new MapLayer({
    api_endpoint: '/network/fairshare_density',
    style_options: {
      normal: {
        strokeColor: 'blue',
        strokeWeight: 2,
        fillColor: 'blue'
      }
    },
    threshold: 12,
    reload: 'always',
    denisty_hue_from: 120,
    denisty_hue_to: 0
  })

  var layers = {}
  var select = $('[ng-controller="fiber_plant_controller"] [ng-change="carriers_changed()"]')

  $rootScope.$on('plan_selected', (e, plan) => {
    Object.keys(layers).forEach((key) => {
      layers[key].remove()
    })
    layers = {}
    if (!plan) return

    $http.get('/network/carriers/' + plan.id).success((carriers) => {
      $scope.carriers = carriers.map((carrier) => {
        return {
          id: carrier.name,
          name: carrier.name,
          color: carrier.color
        }
      }).filter((carrier) => {
        return carrier.name !== config.client_carrier_name
      })

      $scope.carriers.forEach((carrier) => {
        layers[layer_name(carrier.name)] = new MapLayer({
          name: 'Fiber',
          short_name: 'F',
          api_endpoint: '/network/fiber_plant/' + encodeURIComponent(carrier.name),
          style_options: {
            normal: {
              strokeColor: carrier.color,
              strokeWeight: 2,
              fillColor: carrier.color
            }
          },
          threshold: 12,
          reload: 'always'
        })
      })

      function format (carrier) {
        return `<span style="background-color:${carrier.color}; padding: 1px 10px; margin-right: 10px"> </span> ${carrier.name}`
      }

      select.select2({
        placeholder: 'Write the name of the carriers to show',
        formatResult: format,
        formatSelection: format,
        escapeMarkup: (m) => m,
        data: $scope.carriers,
        multiple: true
      })
    })
  })

  $scope.toggle_all_competitors = () => {
    if ($scope.show_all_competitors) {
      $scope.competitors_fiber.show()

      select.select2('val', [], true)
      select.prop('disabled', true)
      _.values(layers).forEach((layer) => {
        layer.hide()
      })
    } else {
      $scope.competitors_fiber.hide()
      select.prop('disabled', false)
    }
  }

  function layer_name (carrier) {
    return 'fiber_plant_' + encodeURIComponent(carrier)
  }

  $scope.carriers_changed = () => {
    var selected = select.select2('val')
    if (selected.length > 0) {
      $scope.show_all_competitors = false
      $scope.competitors_fiber.hide()
      $scope.competitors_fairshare.hide()
    }

    $scope.carriers.forEach((carrier) => {
      var layer = layers[layer_name(carrier.name)]
      selected.indexOf(carrier.name) >= 0 ? layer.show() : layer.hide()
    })

    tracker.track('Competitor networks', {
      competitors: selected
    })
  }

  $scope.overlay_changed = () => {
    if ($scope.overlay === 'none') {
      select.prop('disabled', false)
    } else {
      $scope.show_all_competitors = false
      select.select2('val', [], true)
      select.prop('disabled', true)
    }

    $scope.competitors_density.set_visible($scope.overlay === 'density')
    $scope.competitors_fairshare.set_visible($scope.overlay === 'fairshare')
  }

  $scope.overlay_is_loading = () => {
    return $scope.competitors_fairshare.is_loading || $scope.competitors_density.is_loading
  }
}])
