/* global app map google $ */
app.service('regions', ($rootScope, $timeout, map_tools) => {
  var regions = { selectedRegions: [] }

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
    configureSearch()
  })

  $rootScope.$on('plan_selected', (e, plan) => {
    initSelectionLayer()
    regions.selectedRegions = []
    $rootScope.$broadcast('regions_changed')
  })

  $rootScope.$on('plan_changed_metadata', (e, plan) => {
    initSelectionLayer()
    regions.selectedRegions = plan.metadata.selectedRegions
    regions.selectedRegions.forEach((geography) => {
      geography.features = selectionLayer.addGeoJson({
        type: 'Feature',
        geometry: geography.geog,
        properties: {
          id: geography.id
        }
      })
    })
    $rootScope.$broadcast('regions_changed')
  })

  $rootScope.$on('map_tool_changed_visibility', () => {
    selectionLayer.setMap(map_tools.is_visible('area_network_planning') ? map : null)
  })

  regions.removeGeography = (geography) => {
    var index = regions.selectedRegions.indexOf(geography)
    if (index >= 0) {
      regions.selectedRegions.splice(index, 1)[0]
      geography.features.forEach((feature) => {
        selectionLayer.remove(feature)
      })
      $rootScope.$broadcast('regions_changed')
    }
  }

  function selectGeography (geography) {
    geography.id = String(geography.id)
    if (regions.selectedRegions.find((geog) => geog.id === geography.id && geog.type === geography.type)) return
    regions.selectedRegions.push(geography)

    geography.features = selectionLayer.addGeoJson({
      type: 'Feature',
      geometry: geography.geog,
      properties: {
        id: geography.id,
        type: geography.type
      }
    })
    $rootScope.$broadcast('regions_changed')
  }

  var configureSearch = () => {
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

    search.on('change', (e) => {
      var boundary = e.added
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
      $timeout(() => $rootScope.$broadcast('regions_changed'))
    })
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
        $timeout(() => $rootScope.$broadcast('regions_changed'))
      })
    }
  })

  return regions
})
