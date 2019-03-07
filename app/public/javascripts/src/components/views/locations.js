import { createSelector } from 'reselect'
import MapLayerActions from '../../react/components/map-layers/map-layer-actions'

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

class LocationsController {
  constructor ($rootScope, $location, $timeout, $ngRedux, map_tools, optimization, state) {
    this.$location = $location
    this.$timeout = $timeout
    this.map_tools = map_tools
    this.optimization = optimization
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
    // Update map layers when the heatmap options change
    state.mapTileOptions
      .subscribe((newValue) => this.updateMapLayers())

    // Update map layers when the dataItems property of state changes
    state.dataItemsChanged
      .skip(1)
      .subscribe((newValue) => this.updateMapLayers())

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
      if (this.state.mapTileOptions.getValue().selectedHeatmapOption.id === 'HEATMAP_OFF') {
        // The user has explicitly asked to display points, not aggregates
        transform = 'select'
      } else {
        var mapZoom = map.getZoom()
        // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
        // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
        transform = (mapZoom > zoomThreshold) ? 'select' : 'aggregate'
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
    var selectedLocationLibraries = this.state.dataItems && this.state.dataItems.location && this.state.dataItems.location.selectedLibraryItems
    if (selectedLocationLibraries) {
      selectedLocationLibraries.forEach((selectedLocationLibrary) => {
        // Loop through the location types
        this.locationLayers.forEach((locationType) => {
          if (locationType.checked &&
            // Temp: 155808171 preventing calls to service if zoom is between 1 to 9 as service is not ready with pre-caching
            map && map.getZoom() >= 10) {
            this.disablelocations = false
            this.$timeout()

            if (this.state.configuration.perspective.hasLocationFilters) {
              var hasFiltersSelected = this.state.locationFilters.filter((f) => { return f.checked }).length > 0
              if (hasFiltersSelected) {
                asGroup()
              } else {
                asSingle.bind(this)()
              }
            } else {
              asSingle.bind(this)()
            }

            // Returns a feature filter if we are in "sales" mode, otherwise return null
            function getFilterIfSales (locationType, filterName) {
              if (!locationType.isSalesTile) {
                return null
              }
              if (!filterName) {
                console.warn('We must have a filter name at this point')
              }
              return (feature) => {
                return (feature.properties.salesCategory === locationType.categoryKey) &&
                      (feature.properties.salesType === filterName)
              }
            }

            function asSingle () {
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
                // We want to create an individual layer
                oldMapLayers[mapLayerKey] = {
                  tileDefinitions: tileDefinitions,
                  iconUrl: `${baseUrl}${locationType.iconUrl}`,
                  renderMode: 'PRIMITIVE_FEATURES',
                  zIndex: locationType.zIndex, // ToDo: MOVE THIS TO A SETTINGS FILE! <------------- (!) -----<<<
                  selectable: true,
                  featureFilter: getFilterIfSales(locationType)
                }
                this.createdMapLayerKeys.add(mapLayerKey)
              }
            }

            function asGroup () {
              for (let filter of this.state.locationFilters) {
                if (filter.checked) {
                  // Location type is visible
                  var mapLayerKey = `${locationType.key}_${filter.name}_${selectedLocationLibrary.identifier}`
                  var pointTransform = getPointTransformForLayer(+locationType.aggregateZoomThreshold)
                  var tileDefinitions = []
                  locationType.tileDefinitions.forEach((rawTileDefinition) => {
                    var tileDefinition = angular.copy(rawTileDefinition)
                    objectKeyReplace(tileDefinition, '${tilePointTransform}', pointTransform)
                    objectKeyReplace(tileDefinition, '${libraryId}', selectedLocationLibrary.identifier)
                    objectKeyReplace(tileDefinition, '${locationType}', filter.name)
                    tileDefinitions.push(tileDefinition)
                  })
                  if (pointTransform === 'aggregate') {
                    // For aggregated locations (all types - businesses, households, celltowers) we want to merge them into one layer
                    mergedLayerDefinitions = mergedLayerDefinitions.concat(tileDefinitions)
                  } else {
                    // We want to create an individual layer
                    oldMapLayers[mapLayerKey] = {
                      tileDefinitions: tileDefinitions,
                      iconUrl: `${baseUrl}${filter.iconUrl}`, // NOTE that we are using the icon for the filter, not the location category
                      renderMode: 'PRIMITIVE_FEATURES',
                      zIndex: locationType.zIndex,
                      selectable: true,
                      featureFilter: getFilterIfSales(locationType, filter.name)
                    }
                    this.createdMapLayerKeys.add(mapLayerKey)
                  }
                }
              }
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
        aggregateMode: 'FLATTEN'
      }
      this.createdMapLayerKeys.add(mapLayerKey)
    }
    // "oldMapLayers" now contains the new layers. Set it in the state
    this.state.mapLayers.next(oldMapLayers)
  }

  handleFiltersChanged () {
    // When filters change, we want to turn on/off the Tier checkboxes
    var isMinOneFilterChecked = false
    this.state.locationFilters.forEach((filter) => isMinOneFilterChecked |= (filter.checked))
    const locationTypesToChange = ['Tier 1', 'Tier 2', 'Tier 3']
    this.locationLayers.toJS().forEach((locationType, index) => {
      if (locationTypesToChange.indexOf(locationType.key) >= 0) {
        this.locationLayers.set(index, this.locationLayers.get(index).checked = isMinOneFilterChecked)
      }
    })
    this.updateMapLayers()
  }

  // Update old and new map layers when data sources change
  onSelectedDataSourcesChanged () {
    this.updateMapLayers()
  }

  mapStateToThis (state) {
    return {
      locationLayers: getLocationLayersList(state)
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      updateLayerVisibility: (layer, isVisible, allLocationLayers) => {
        // First set the visibility of the current layer
        dispatch(MapLayerActions.setLayerVisibility(layer, isVisible))

        // Then check if other layers are in a different group
        allLocationLayers.forEach(locLayer => {
          if (locLayer.group !== layer.group) {
            dispatch(MapLayerActions.setLayerVisibility(locLayer, false))
          }
        })
      }
    }
  }

  mergeToTarget (nextState, actions) {
    const currentLocationLayers = this.locationLayers

    // merge state and actions onto controller
    Object.assign(this, nextState)
    Object.assign(this, actions)

    if (currentLocationLayers !== nextState.locationLayers) {
      this.updateMapLayers()
    }
  }
}

LocationsController.$inject = ['$rootScope', '$location', '$timeout', '$ngRedux', 'map_tools', 'optimization', 'state']

let locations = {
  templateUrl: '/components/views/locations.html',
  bindings: {},
  controller: LocationsController
}

export default locations