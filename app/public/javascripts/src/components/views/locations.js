import { createSelector } from 'reselect'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())
const getAllLocationFilters = state => (state.mapLayers.locationFilters || {})
const getOrderedLocationFilters = createSelector([getAllLocationFilters], locationFilters => {
  const orderedLocationFilters = JSON.parse(JSON.stringify(locationFilters))
  Object.keys(orderedLocationFilters).forEach(filterType => {
    const orderedRules = Object.keys(orderedLocationFilters[filterType].rules)
      .map(ruleKey => ({ ...orderedLocationFilters[filterType].rules[ruleKey], ruleKey }))
      .sort((a, b) => a.listIndex > b.listIndex ? 1 : -1)
    orderedLocationFilters[filterType].rules = orderedRules
  })
  return orderedLocationFilters
})


class LocationsController {
  constructor ($rootScope, $location, $timeout, $ngRedux, map_tools, state, rxState) {
    this.$location = $location
    this.$timeout = $timeout
    this.map_tools = map_tools
    this.state = state
    this.createdMapLayerKeys = new Set()
    this.disablelocations = false
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this.mergeToTarget.bind(this))

    // When the map zoom changes, map layers can change
    $rootScope.$on('map_zoom_changed', () => this.updateMapLayers())
    $rootScope.$on('plan_selected', (e, plan) => {
      this.plan = plan
      optimization.datasources = []

      if (plan) {
        plan.location_types = plan.location_types || []
      }
    })
    $rootScope.$on('map_layer_clicked_feature', (e, event, layer) => {
      if (layer.type !== 'road_segments') return
      var feature = event.feature
      layer.data_layer.revertStyle()
      layer.data_layer.overrideStyle(feature, {
        strokeWeight: 4
      })
      swal({ title: '', text: `gid: ${feature.getProperty('gid')} tlid: ${feature.getProperty('tlid')}`, type: 'info' })
    })

    // Create a new set of map layers
    state.mapReadyPromise.then(() => {
      this.updateMapLayers()
    })
      
    // Update map layers when the heatmap options change using react rxjs
    rxState.mapTileOptions.getMessage().subscribe((mapTileOptions) => {
      this.updateMapLayers()
    })       

    // Update map layers when the display mode button changes
    state.selectedDisplayMode.subscribe((newValue) => this.updateMapLayers())

    var latestOverlay = null
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: false
    })

    this.drawingManager.addListener('overlaycomplete', (e) => {
      removeLatestOverlay()
      latestOverlay = e.overlay

      var points = e.overlay.getPath()
      var total = 0
      var prev = null
      points.forEach((point) => {
        if (prev) {
          total += google.maps.geometry.spherical.computeDistanceBetween(prev, point)
        }
        prev = point
      })
      this.measuredDistance = total
      this.$timeout()
    })

    function removeLatestOverlay () {
      latestOverlay && latestOverlay.setMap(null)
      latestOverlay = null
    }

    $(document).keydown(function (e) {
      if (e.keyCode === 27 && this.measuringStickEnabled) {
        this.toggleMeasuringStick()
      }
    })

    this.filterToOrderedRules = {}
  }

  getOrderedRulesForFilter (filter) {
    // We are going to cache the ordered rules so we don't compute them every digest cycle. Using "description" as the cache key.
    if (!this.filterToOrderedRules[filter.description]) {
      var orderedRules = Object.keys(filter.rules)
        .map(ruleKey => ({ ...filter.rules[ruleKey], ruleKey }))
        .sort((a, b) => a.listIndex > b.listIndex ? 1 : -1)
      this.filterToOrderedRules[filter.description] = orderedRules
    }
    return this.filterToOrderedRules[filter.description]
  }

  toggleMeasuringStick () {
    var current = this.drawingManager.getMap()
    this.drawingManager.setMap(current ? null : map)
    removeLatestOverlay()
    this.measuringStickEnabled = !current
    if (current) this.measuredDistance = null
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  // Creates map layers based on selection in the UI
  updateMapLayers () {
    const baseUrl = `${this.$location.protocol()}://${this.$location.host()}:${this.$location.port()}`

    // Make a copy of the state mapLayers. We will update this
    var oldMapLayers = angular.copy(this.state.mapLayers.getValue())

    // Remove all the map layers previously created by this controller
    this.createdMapLayerKeys.forEach((createdMapLayerKey) => {
      delete oldMapLayers[createdMapLayerKey]
    })
    this.createdMapLayerKeys.clear()

    // Hold a list of layers that we want merged
    var mergedLayerDefinitions = []

    // Get the point transformation mode with the current zoom level
    const getPointTransformForLayer = zoomThreshold => {
      var transform = ''
      // For other Clients except frontier
      if(this.state.configuration.ARO_CLIENT !== 'frontier') {
        // rSelectedHeatMapOption is a redux state which is set from too-bar-reducer.js
        if (this.rSelectedHeatMapOption === 'HEATMAP_OFF') {
          // The user has explicitly asked to display points, not aggregates
          transform = 'select'
        } else {
          var mapZoom = map.getZoom()
          // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
          // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
          transform = (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
        }
      } else {
        if (this.rSelectedHeatMapOption === 'HEATMAP_OFF') {
          // The user has explicitly asked to display points, not aggregates
          transform = 'select'
        } else {
          var mapZoom = map.getZoom()
          // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
          // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
          transform = (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
        }
      }
      return transform
    }

    // Replaces any occurrences of searchText by replaceText in the keys of an object
    const objectKeyReplace = (obj, searchText, replaceText) => {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(searchText, replaceText)
        }
      })
    }

    // Add map layers based on the selection
    var v2Filters = null // If not null, the renderer will display zero objects
    if (Object.keys(this.locationFilters).length > 0) {
      // Define the v2Filters object ONLY if there are some filters defined in the system
      v2Filters = []
      Object.keys(this.locationFilters).forEach(filterKey => {
        const filter = this.locationFilters[filterKey]
        Object.keys(filter.rules).forEach(ruleKey => {
          if (filter.rules[ruleKey].isChecked) {
            v2Filters.push(filter.rules[ruleKey])
          }
        })
      })
    }

    var selectedLocationLibraries = this.dataItems && this.dataItems.location && this.dataItems.location.selectedLibraryItems
    if (selectedLocationLibraries) {
      selectedLocationLibraries.forEach((selectedLocationLibrary) => {
        // Loop through the location types
        this.locationLayers.forEach((locationType) => {
          if (locationType.checked &&
              // Temp: 155808171 preventing calls to service if zoom is between 1 to 9 as service is not ready with pre-caching
              map && map.getZoom() >= 10) {
            this.disablelocations = false
            this.$timeout()

            // First, construct the filtering function based on the selected values. Each "featureFilter" corresponds
            // to a single filter (e.g. salesType).
            var featureFilters = []
            var layerIconUrl = locationType.iconUrl
            const activeLocationFilters = this.state.configuration.perspective.locationFilters.filter(item => item.useFilter)
            activeLocationFilters.forEach(locationFilter => {
              var individualFilter = feature => true // A filter that returns back all the input items
              if (locationFilter.type === 'multiSelect') {
                const checkedAttributes = locationFilter.values.filter(item => item.checked).map(item => item.key)
                if (checkedAttributes.length > 0) {
                  // Some items are selected. Apply filtering
                  individualFilter = feature => checkedAttributes.indexOf(feature.properties[locationFilter.attributeKey]) >= 0
                  const firstCheckedFilterWithIconUrl = locationFilter.values.filter(item => item.checked && item.iconUrl)[0]
                  if (firstCheckedFilterWithIconUrl) {
                    layerIconUrl = firstCheckedFilterWithIconUrl.iconUrl
                  }
                }
              } else if (locationFilter.type === 'threshold') {
                // For threshold we assume that the property value is going to be numeric
                individualFilter = feature => (+feature.properties[locationFilter.attributeKey]) > locationFilter.value
              }
              featureFilters.push(individualFilter)
            })
            // For sales tiles, we will also filter by the salesCategory. This is done just to keep the same logic as
            // non-sales tiles where we have small/medium/large businesses. This is actually just another type of filter.
            if (locationType.isSalesTile) {
              featureFilters.push(feature => feature.properties.locationCategory === locationType.categoryKey)
            }
            // The final result of the filter is obtained by AND'ing the individual filters
            const featureFilter = feature => {
              var returnValue = true
              featureFilters.forEach(f => { returnValue = returnValue && f(feature) })
              return returnValue
            }

            // Location type is visible
            var mapLayerKey = `${locationType.key}_${selectedLocationLibrary.identifier}`
            var pointTransform = getPointTransformForLayer(+locationType.aggregateZoomThreshold)
            var tileDefinitions = []
            locationType.tileDefinitions.forEach((rawTileDefinition) => {
              var tileDefinition = angular.copy(rawTileDefinition)
              objectKeyReplace(tileDefinition, '${tilePointTransform}', pointTransform)
              objectKeyReplace(tileDefinition, '${libraryId}', selectedLocationLibrary.identifier)
              tileDefinitions.push(tileDefinition)
            })

            if (pointTransform === 'aggregate') {
              // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
              mergedLayerDefinitions = mergedLayerDefinitions.concat(tileDefinitions)
            } else {
              var drawingOptions = {
                "strokeStyle":"#0000ff",
                "labels":{ ...this.lableDrawingOptions, "properties":["name"]}
              }

              // We want to create an individual layer
              var mapLayerProps = {
                tileDefinitions: tileDefinitions,
                iconUrl: `${baseUrl}${layerIconUrl}`,
                mduIconUrl: locationType.mduIconUrl && `${baseUrl}${locationType.mduIconUrl}`,
                renderMode: 'PRIMITIVE_FEATURES',
                
                strokeStyle: drawingOptions.strokeStyle,
                lineWidth: drawingOptions.lineWidth || 2,
                fillStyle: drawingOptions.fillStyle,
                opacity: drawingOptions.opacity || 0.5,
                
                zIndex: locationType.zIndex,
                selectable: true,
                featureFilter: featureFilter,
                v2Filters: v2Filters
              }

              if (this.showLocationLabels) { // && map.getZoom() > this.networkEquipmentLayers.labelDrawingOptions.visibilityZoomThreshold
                mapLayerProps.drawingOptions = drawingOptions
              }

              oldMapLayers[mapLayerKey] = mapLayerProps
              this.createdMapLayerKeys.add(mapLayerKey)
            }
          } else if (map && map.getZoom() < 10) {
            this.disablelocations = true
            this.$timeout()
          } else if (map && map.getZoom() >= 10) {
            this.disablelocations = false
            this.$timeout()
          }
        })
      })
    }

    if (mergedLayerDefinitions.length > 0) {
      // We have some business layers that need to be merged into one
      // We still have to specify an iconURL in case we want to debug the heatmap rendering. Pick any icon.
      var firstLocation = this.locationLayers[0]
      var mapLayerKey = 'aggregated_locations'
      oldMapLayers[mapLayerKey] = {
        tileDefinitions: mergedLayerDefinitions,
        iconUrl: `${baseUrl}${firstLocation.iconUrl}`,
        renderMode: 'HEATMAP',
        zIndex: 6500,
        aggregateMode: 'FLATTEN',
        v2Filters: v2Filters
      }
      this.createdMapLayerKeys.add(mapLayerKey)
    }
    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  // Update old and new map layers when data sources change
  onSelectedDataSourcesChanged () {
    this.updateMapLayers()
  }

  setRuleChecked (rule, isChecked) {
    rule.isChecked = isChecked
    this.updateMapLayers()
  }

  areAnyLocationLayersVisible () {
    return this.locationLayers.filter(layer => layer.show).length > 0
  }

  areAnyLocationFiltersVisible () {
    return Object.keys(this.locationFilters).length > 0
  }

  mapStateToThis (reduxState) {
    return {
      locationLayers: getLocationLayersList(reduxState),
      locationFilters: reduxState.mapLayers.locationFilters || {},
      orderedLocationFilters: getOrderedLocationFilters(reduxState),
      dataItems: reduxState.plan.dataItems,
      showLocationLabels: reduxState.viewSettings.showLocationLabels,
      lableDrawingOptions: reduxState.mapLayers.networkEquipment.labelDrawingOptions,
      rSelectedHeatMapOption: reduxState.toolbar.selectedHeatMapOption,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      updateLayerVisibility: (layer, isVisible, allLocationLayers) => {
        // First set the visibility of the current layer
        dispatch(MapLayerActions.setLayerVisibility(layer, isVisible))
      },
      setLocationFilterChecked: (filterType, ruleKey, isChecked) => dispatch(MapLayerActions.setLocationFilterChecked(filterType, ruleKey, isChecked))
    }
  }

  mergeToTarget (nextState, actions) {
    const currentLocationLayers = this.locationLayers
    const currentSelectedLibrary = this.dataItems && this.dataItems.location && this.dataItems.location.selectedLibraryItems
    const currentLocationFilters = this.locationFilters

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    const nextSelectedLibrary = this.dataItems && this.dataItems.location && this.dataItems.location.selectedLibraryItems
    if ((currentLocationLayers !== nextState.locationLayers) ||
      (currentSelectedLibrary !== nextSelectedLibrary) ||
      // Fix for infinite call of tiles renedring notifications.
      (JSON.stringify(currentLocationFilters) !== JSON.stringify(this.locationFilters))) {
      this.updateMapLayers()
    }
  }
}

LocationsController.$inject = ['$rootScope', '$location', '$timeout', '$ngRedux', 'map_tools', 'state', 'rxState']

let locations = {
  templateUrl: '/components/views/locations.html',
  bindings: {},
  controller: LocationsController
}

export default locations
