/* global app swal $ google map */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools

  $scope.allStatus = ['optimization', 'geographies', 'cover', 'progress']
  $scope.wizardStatus = $scope.allStatus[0]
  $scope.advancedSettings = false
  $scope.selectedGeographies = []
  $scope.calculating = false

  $scope.coverHouseholds = true
  $scope.coverBusinesses = true
  $scope.coverTowers = true

  $scope.optimizationType = 'capex'
  $scope.irrThreshold = 100
  $scope.budget = 10000000

  var budgetInput = $('#area_network_planning_controller input[name=budget]')
  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +budgetInput.val().match(/\d+/g).join('') || 0

  budgetInput.on('focus', () => {
    budgetInput.val(String(parseBudget()))
  })

  budgetInput.on('blur', () => {
    budgetInput.val(parseBudget().toLocaleString())
  })

  var selectionLayer
  function initSelectionLayer () {
    selectionLayer && selectionLayer.setMap(null)
    selectionLayer = new google.maps.Data()
    selectionLayer.setStyle({
      fillColor: 'green'
    })
    selectionLayer.setMap(map_tools.is_visible('area_network_planning') ? map : null)
  }

  $(document).ready(() => {
    initSelectionLayer()
  })

  $rootScope.$on('plan_selected', (e, plan) => {
    initSelectionLayer()
    $scope.selectedGeographies = []
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    initSelectionLayer()
    $scope.selectedGeographies = plan.metadata.selectedRegions
    $scope.selectedGeographies.forEach((geography) => {
      geography.features = selectionLayer.addGeoJson({
        type: 'Feature',
        geometry: geography.geog,
        properties: {
          id: geography.id
        }
      })
    })
  })

  $rootScope.$on('map_tool_changed_visibility', () => {
    selectionLayer.setMap(map_tools.is_visible('area_network_planning') ? map : null)
  })

  $scope.forward = () => {
    var index = $scope.allStatus.indexOf($scope.wizardStatus)
    if (index + 1 < $scope.allStatus.length) {
      $scope.wizardStatus = $scope.allStatus[index + 1]
      if ($scope.wizardStatus === 'progress') {
        calculate()
      }
    }
  }

  $scope.back = () => {
    var index = $scope.allStatus.indexOf($scope.wizardStatus)
    if (index > 0) {
      $scope.wizardStatus = $scope.allStatus[index - 1]
    }
  }

  $scope.toggleAdvancedSettings = () => {
    $scope.advancedSettings = !$scope.advancedSettings
  }

  $scope.cancel = () => {
    if (!$scope.calculating) return $scope.back()
    swal({
      title: 'Are you sure?',
      text: 'Are you sure you want to cancel?',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep Going',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      $scope.back()
      $scope.$apply()
    })
  }

  $scope.removeGeography = (geography) => {
    var index = $scope.selectedGeographies.indexOf(geography)
    if (index >= 0) {
      $scope.selectedGeographies.splice(index, 1)[0]
      geography.features.forEach((feature) => {
        selectionLayer.remove(feature)
      })
    }
  }

  $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
    if (!map_tools.is_visible('area_network_planning')) return

    var feature = event.feature
    var name = feature.getProperty('name')
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      feature.toGeoJson((obj) => {
        selectGeography({
          id: feature.getProperty('id'),
          name: name,
          geog: obj.geometry,
          type: layer.type
        })
        $scope.$apply()
      })
    }
  })

  function selectGeography (geography) {
    geography.id = String(geography.id)
    if ($scope.selectedGeographies.find((geog) => geog.id === geography.id && geog.type === geography.type)) return
    $scope.selectedGeographies.push(geography)

    geography.features = selectionLayer.addGeoJson({
      type: 'Feature',
      geometry: geography.geog,
      properties: {
        id: geography.id,
        type: geography.type
      }
    })
  }

  var search = $('#area-network-planning-search')
  search.select2({
    ajax: {
      url: '/search/boundaries',
      dataType: 'json',
      delay: 250,
      data: (term) => ({ text: term }),
      results: (data, params) => {
        var items = data.map((boundary) => {
          return {
            id: String(boundary.id),
            text: boundary.name,
            geog: boundary.geog
          }
        })
        $scope.searchResults = items

        return {
          results: items,
          pagination: {
            more: false
          }
        }
      },
      cache: true
    }
  })

  search.on('change', () => {
    var value = search.select2('val')
    var boundary = $scope.searchResults.find((boundary) => boundary.id === value)
    var n = boundary.id.indexOf(':')
    var type = boundary.id.substring(0, n)
    var id = boundary.id.substring(n + 1)

    selectGeography({
      id: id,
      name: boundary.text,
      geog: boundary.geog,
      type: type
    })
    search.select2('val', '')
    $scope.$apply()
  })

  $scope.plan = null
  $rootScope.$on('plan_selected', (e, plan) => {
    $scope.plan = plan
  })

  function calculate () {
    var locationTypes = []
    if ($scope.coverHouseholds) locationTypes.push('households')
    if ($scope.coverBusinesses) locationTypes.push('businesses')
    if ($scope.coverTowers) locationTypes.push('towers')
    var changes = {
      locationTypes: locationTypes,
      geographies: $scope.selectedGeographies.map((i) => ({ geog: i.geog, name: i.name, id: i.id, type: i.type })),
      algorithm: $scope.optimizationType,
      budget: parseBudget()
    }

    var url = '/network_plan/' + $scope.plan.id + '/edit'
    var config = {
      url: url,
      method: 'post',
      saving_plan: true,
      data: changes
    }
    $scope.calculating = true
    $http(config)
      .success((response) => {
        $scope.calculating = false
        $rootScope.$broadcast('route_planning_changed', response)
        $scope.wizardStatus = $scope.allStatus[0]
      })
      .error(() => {
        $scope.calculating = false
      })
  }
}])
