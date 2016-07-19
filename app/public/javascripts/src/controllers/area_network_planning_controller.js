/* global app swal $ google map config */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', '$q', 'map_tools', ($scope, $rootScope, $http, $q, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools

  $scope.selectedGeographies = []
  $scope.calculating = false

  $scope.optimizeHouseholds = true
  $scope.optimizeBusinesses = true
  $scope.optimizeSMB = true // special case
  $scope.optimizeTowers = true

  $scope.optimizationType = 'CAPEX'
  $scope.irrThreshold = $scope.irrThresholdRange = 10
  $scope.budget = 10000000

  var budgetInput = $('#area_network_planning_controller input[name=budget]')
  budgetInput.val($scope.budget.toLocaleString())

  const parseBudget = () => +(budgetInput.val() || '0').match(/\d+/g).join('') || 0

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

  $scope.irrThresholdRangeChanged = () => {
    $scope.irrThreshold = +$scope.irrThresholdRange
  }

  $scope.irrThresholdChanged = () => {
    $scope.irrThresholdRange = $scope.irrThreshold
  }

  var canceler = null
  $scope.cancel = () => {
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
      canceler.resolve()
      canceler = null
    })
  }

  $scope.run = () => {
    var locationTypes = []
    var scope = config.ui.eye_checkboxes ? $rootScope : $scope
    if (scope.optimizeHouseholds) locationTypes.push('households')
    if (scope.optimizeBusinesses) locationTypes.push('businesses')
    if (scope.optimizeSMB) locationTypes.push('smb')
    if (scope.optimizeTowers) locationTypes.push('towers')

    var algorithm = $scope.optimizationType
    var changes = {
      locationTypes: locationTypes,
      geographies: $scope.selectedGeographies.map((i) => ({ geog: i.geog, name: i.name, id: i.id, type: i.type })),
      algorithm: $scope.optimizationType,
      budget: parseBudget(),
      irrThreshold: $scope.irrThreshold / 100
    }

    if (algorithm === 'CAPEX') {
      delete changes.budget
      delete changes.irrThreshold
    } else if (algorithm === 'MAX_IRR') {
      delete changes.budget
      delete changes.irrThreshold
    } else if (algorithm === 'IRR') {
      delete changes.irrThreshold
    } else if (algorithm === 'BUDGET_IRR') {
    }

    canceler = $q.defer()
    var url = '/network_plan/' + $scope.plan.id + '/edit'
    var options = {
      url: url,
      method: 'post',
      saving_plan: true,
      data: changes,
      timeout: canceler.promise
    }
    $scope.calculating = true
    $http(options)
      .success((response) => {
        $scope.calculating = false
        $rootScope.$broadcast('route_planning_changed', response)
      })
      .error(() => {
        $scope.calculating = false
      })
  }
}])
