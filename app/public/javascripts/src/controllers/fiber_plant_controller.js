/* global app config $ _ google map */
// Fiber Plant Controller
app.controller('fiber_plant_controller', ['$scope', '$rootScope', '$http', 'map_tools', 'MapLayer', 'tracker', 'map_utils', ($scope, $rootScope, $http, map_tools, MapLayer, tracker, map_utils) => {
  $scope.map_tools = map_tools
  $scope.carriers = []
  $scope.overlay = 'none'

  // var nbmCarriers = {
  //   'Comcast Corporation': 'Comcast',
  //   'Time Warner Cable Inc.': 'Time Warner Cable',
  //   'Charter Communications': 'Charter',
  //   'Cox Communications, Inc.': 'Cox',
  //   'Bright House Networks, LLC': 'Bright House',
  //   'CSC Holdings': 'Cablevision', // was CSC Holdings, LLC
  //   'Mediacom Communications Corp.': 'Mediacom'
  // }

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
    $scope.clearNbmCarrier()
    if (!plan) return
    $scope.plan = plan

    map.ready(() => refreshNbmCarriers())

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
    if (!$scope.nbmCarrier || !$scope.nbmCarrier.id) {
      if (layer) return layer.hide()
      return
    }
    var endpoint = `/census_blocks/${$scope.nbmCarrier.id}`
    if (!layer) {
      layer = $scope.nbmLayer = new MapLayer({
        type: 'census_blocks_nbm',
        api_endpoint: endpoint,
        style_options: {
          normal: {
            strokeColor: '#d3d3d3',
            strokeWeight: 1,
            fillColor: 'blue'
          },
          highlight: {
            strokeColor: 'brown',
            strokeWeight: 2
          },
          selected: {
            strokeColor: 'brown',
            strokeWeight: 2
          }
        },
        threshold: 13,
        reload: 'always',
        declarativeStyles: (feature, styles) => {
          var speed = feature.getProperty('download_speed')
          var h = 120 - speed * 10
          styles.fillColor = 'hsl(' + h + ',100%,30%)'
        },
        highlighteable: true,
        single_selection: true
      })
      layer.onDataLoaded = () => {
        var dataLayer = layer.data_layer
        dataLayer.forEach((feature) => {
          var c = feature.getProperty('centroid')
          if (!c) {
            return console.warn('Feature missing centroid')
          }
          var p = c.coordinates
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

  $scope.clearNbmCarrier = () => {
    $scope.nbmCarrier = ''
    $scope.nbmCarrierChanged()
  }

  function refreshNbmCarriers () {
    if (!$scope.plan || !map) return
    var bounds = map.getBounds()
    if (!bounds) return
    var params = {
      nelat: bounds.getNorthEast().lat(),
      nelon: bounds.getNorthEast().lng(),
      swlat: bounds.getSouthWest().lat(),
      swlon: bounds.getSouthWest().lng(),
      zoom: map.getZoom()
    }
    var url = '/network/carriers/' + $scope.plan.id + '/viewport?fiberType=ilec'
    $http({ url: url, params: params }).success((carriers) => {
      var all = {
        id: 'all',
        name: 'All carriers',
        color: 'blue'
      }
      $scope.nbmCarriers = [all].concat(carriers).filter((carrier) => {
        return carrier.name !== config.client_carrier_name
      })
    })
  }

  ;['dragend', 'zoom_changed'].forEach((eventName) => {
    $rootScope.$on(`map_${eventName}`, () => {
      refreshNbmCarriers()
    })
  })
}])
