/* global app swal $ google map */
// Search Controller
app.controller('area-network-planning-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  // Controller instance variables
  $scope.map_tools = map_tools

  $scope.allStatus = ['geographies', 'cover', 'budget', 'progress']
  $scope.wizardStatus = $scope.allStatus[0]
  $scope.advancedSettings = false
  $scope.selectedGeographies = []

  var selectionLayer = new google.maps.Data()
  $(document).ready(() => {
    selectionLayer.setMap(map)
  })

  $scope.forward = () => {
    var index = $scope.allStatus.indexOf($scope.wizardStatus)
    if (index + 1 < $scope.allStatus.length) {
      $scope.wizardStatus = $scope.allStatus[index + 1]
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
          geog: obj.geometry
        })
        $scope.$apply()
      })
    }
  })

  function selectGeography (geography) {
    if ($scope.selectedGeographies.find((geog) => geog.id === geography.id)) return
    $scope.selectedGeographies.push(geography)

    geography.features = selectionLayer.addGeoJson({
      type: 'Feature',
      geometry: geography.geog,
      properties: {
        id: geography.id
      }
    })
    console.log('features', geography.features.length)
  }

  var search = $('#area-network-planning-search')
  search.select2({
    ajax: {
      url: '/boundaries/search',
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
    selectGeography({
      id: boundary.id,
      name: boundary.text,
      geog: boundary.geog
    })
    search.select2('val', '')
    $scope.$apply()
  })
}])
