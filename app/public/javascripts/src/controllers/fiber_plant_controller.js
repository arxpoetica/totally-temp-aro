/* global app config $ _ google */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', 'tracker', 'map_utils', ($scope, $rootScope, $http, map_tools, MapLayer, tracker, map_utils) => {
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
  var select = $('[ng-controller="fiber_plant_controller"] [ng-change="carriersChanged()"]')

  $rootScope.$on('plan_selected', (e, plan) => {
    Object.keys(layers).forEach((key) => {
      layers[key].remove()
    })
    layers = {}
    if (!plan) return

    $http.get('/network/carriers/' + plan.id + '?fiberType=ilec').success((carriers) => {
      $scope.nbmCarriers = carriers.map((carrier) => {
        return {
          id: carrier.id,
          name: carrier.name,
          color: carrier.color
        }
      }).filter((carrier) => {
        return carrier.name !== config.client_carrier_name
      })
    })

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
          name: config.ui.labels.fiber,
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

  $scope.toggleAllCompetitors = () => {
    if ($scope.showAllCompetitors) {
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

  $scope.carriersChanged = () => {
    var selected = select.select2('val')
    if (selected.length > 0) {
      $scope.showAllCompetitors = false
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

  $scope.overlayChanged = () => {
    if ($scope.overlay === 'none') {
      select.prop('disabled', false)
    } else {
      $scope.showAllCompetitors = false
      select.select2('val', [], true)
      select.prop('disabled', true)
    }

    $scope.competitors_density.setVisible($scope.overlay === 'density')
    $scope.competitors_fairshare.setVisible($scope.overlay === 'fairshare')
  }

  $scope.overlay_is_loading = () => {
    return $scope.competitors_fairshare.is_loading || $scope.competitors_density.is_loading
  }

  $scope.nbmCarrierChanged = () => {
    var layer = $scope.nbmLayer
    if (layer && !$scope.nbmCarrier) {
      return layer.hide()
    }
    var endpoint = `/census_blocks/${$scope.nbmCarrier.id}`
    if (!layer) {
      layer = $scope.nbmLayer = new MapLayer({
        api_endpoint: endpoint,
        style_options: {
          normal: {
            strokeColor: 'blue',
            strokeWeight: 2,
            fillColor: 'blue'
          }
        },
        threshold: 13,
        reload: 'always',
        declarativeStyles: (feature, styles) => {
          var speed = feature.getProperty('download_speed')
          var h = 120 - speed * 10
          styles.fillColor = 'hsl(' + h + ',100%,50%)'
        }
      })
      layer.onDataLoaded = () => {
        var dataLayer = layer.data_layer
        dataLayer.forEach((feature) => {
          var p = feature.getProperty('centroid').coordinates
          var centroid = new google.maps.LatLng(p[1], p[0])
          var marker = map_utils.createCenteredMarker(dataLayer, feature, centroid, {})
          marker.setIcon('https://chart.googleapis.com/chart?chst=d_text_outline&chld=000000|16|h|FFFFFF|_|' + encodeURIComponent(feature.getProperty('speed')))
        })
      }
    } else {
      layer.setApiEndpoint(endpoint)
    }
    layer.show()
  }
}])
