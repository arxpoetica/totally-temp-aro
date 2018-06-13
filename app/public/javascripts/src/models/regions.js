/* global app map google $ config globalServiceLayers globalAnalysisLayers */
app.service('regions', ['$rootScope', '$timeout', '$http', '$q', 'map_tools', 'MapLayer', 'optimization', ($rootScope, $timeout, $http, $q, map_tools, MapLayer, optimization) => {
  var regions = { selectedRegions: [] }
  var tool = config.ARO_CLIENT === 'verizon' ? 'boundaries' : map_tools.TOOL_IDS.AREA_NETWORK_PLANNING

  var selectionLayer
  function initSelectionLayer () {
    selectionLayer && selectionLayer.setMap(null)
    selectionLayer = new google.maps.Data()
    selectionLayer.setStyle({
      fillColor: 'green',
      zIndex: MapLayer.Z_INDEX_SELECTED_REGION  // We want the selected region to appear on top of non-selected regions
    })
    configureSelectionVisibility()
  }

  var searchOptions = {}
  $(document).ready(() => {
    initSelectionLayer()
    map.ready(() => {
      configureSearch()
    })
  })

  ;['dragend', 'zoom_changed'].forEach((eventName) => {
    $rootScope.$on(`map_${eventName}`, () => {
      configureSearch()
    })
  })

  function cleanUp () {
    initSelectionLayer()
    regions.selectedRegions = []
    $rootScope.$broadcast('regions_changed')
  }

  $rootScope.$on('plan_selected', cleanUp)

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
    if (regions.selectedRegions.length > 0) optimization.setMode('boundaries')
  })

  $rootScope.$on('map_tool_changed_visibility', () => configureSelectionVisibility())

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

  regions.removeAllGeographies = () => {
    cleanUp()
  }

  $rootScope.$on('optimization_mode_changed', (e, mode) => {
    if (mode === 'targets') {
      cleanUp()
    }
  })

  function selectGeography (geography, suppressEvents = false) {
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
    if (!suppressEvents) {
      $rootScope.$broadcast('regions_changed')
      optimization.setMode('boundaries')
    }
  }

  // Select multiple geography using geography ids. Returns a promise that resolves after all boundaries have been selected.
  regions.selectGeographyFromIds = (geographyIds) => {
    var defer = $q.defer()

    if (geographyIds.length === 0) {
      defer.resolve()
    } else {
      // Get geometry information for all geography ids
      $http.post('/boundary/info', { serviceAreaIds: geographyIds })
      .then((response) => {
        if (response.status >= 200 && response.status <= 299) {
          // Go through all elements of the response and select each element
          response.data.forEach((boundary, index) => {
            // Select geography, and suppress events for all but the last boundary
            boundary.layerId = boundary.layer_id
            delete boundary.layer_id
            regions.selectGeography(boundary, index < response.data.length - 1)
          })
          defer.resolve()
        } else {
          defer.reject(response.data)
        }
      })
      .catch((error) => defer.reject(error))
    }

    return defer.promise
  }

  var configureSearch = () => {
    var search = $('#area-network-planning-search')
    var bounds = map.getBounds()
    if (!bounds) {
      console.warn('map bounds not found in regions.js --> configureSearch(). Returning from function.')
      return
    }
    var params = {
      nelat: bounds.getNorthEast().lat(),
      nelon: bounds.getNorthEast().lng(),
      swlat: bounds.getSouthWest().lat(),
      swlon: bounds.getSouthWest().lng(),
      zoom: map.getZoom(),
      threshold: 0
    }
    var query = Object.keys(params).map((key) => `${key}=${params[key]}`).join('&')
    Object.keys(searchOptions).forEach((type) => {
      if (searchOptions[type]) {
        query += `&types=${type}`
      }
    })
    search.unbind()
    search.select2({
      ajax: {
        url: `/search/boundaries?${query}`,
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

          var sections = [
            { prefix: 'census_block', name: 'Census Blocks' },
            { prefix: 'county', name: 'County Subdivisions' }
          ]
          globalAnalysisLayers.forEach((layer) => {
            sections.push({
              prefix: layer.name,
              name: layer.description
            })
          })
          globalServiceLayers.forEach((layer) => {
            sections.push({
              prefix: layer.name,
              name: layer.description
            })
          })

          var results = sections.map((section) => ({
            text: section.name,
            children: items.filter((item) => item.id.indexOf(section.prefix) === 0)
          })).filter((item) => item.children.length > 0)

          return {
            results: results,
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

  function regionsSelected(feature, layer) {
    var name = feature.getProperty('name')
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      feature.toGeoJson((obj) => {
        selectGeography({
          id: feature.getProperty('id'),
          name: name,
          geog: obj.geometry,
          type: layer.type,
          layerId: layer.layerId
        })
        $timeout(() => $rootScope.$broadcast('regions_changed'))
      })
    }
  }

  regions.regionsSelected = regionsSelected

  // $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
  //   //if (!map_tools.is_visible(tool)) return

  //   regionsSelected(event.feature, layer);
  // })

  regions.setSearchOption = (type, enabled) => {
    searchOptions[type] = enabled
    configureSearch()
  }

  regions.getSelectedServiceAreas = () => {
    return globalServiceLayers.filter((layer) => searchOptions[layer.name])
  }

  regions.selectGeography = selectGeography

  function configureSelectionVisibility () {
    // selectionLayer.setMap(map_tools.is_visible(tool) ? map : null)
    if (selectionLayer.getMap() !== map) {
      selectionLayer.setMap(map)
    }
  }

  regions.hide = () => {
    selectionLayer.setMap(null)
  }

  regions.show = () => {
    selectionLayer.setMap(map)
  }

  return regions
}])
