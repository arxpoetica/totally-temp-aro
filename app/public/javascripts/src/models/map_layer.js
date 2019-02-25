/* global app google map _ encodeURIComponent document $ */
'use strict'

app.service('MapLayer', ($http, $rootScope, map_tools, $q, map_utils, Notification) => {
  var plan = null
  $rootScope.$on('plan_selected', (e, p) => {
    plan = p
  })

  var all = []

  return class MapLayer {
    // Keep all Z indices of map layers in one place.
    // This is the region (e.g. wirecenter boundary) that is *selected*. This was created so that the selected
    // wirecenter boundary always appears on top of other boundaries without z-fighting
    static get Z_INDEX_SELECTED_REGION () { return 2 }

    // Fiber strands have a higher z index because we want their events (e.g. mouseover) to fire even when
    // a wirecenter boundary is selected
    static get Z_INDEX_FIBER_STRANDS () { return 3 }

    // The "upward route" fiber strands have a higher z index because they should appear on top of the other fiber strands.
    static get Z_INDEX_UPWARD_FIBER_STRANDS () { return 4 }

    static isEquipmentVisible () {
      return all.some((layer) => {
        return layer.type === 'network_nodes' && layer.visible && layer.http_params
      })
    }

    static hideAllLayers () {
      var status = {}
      all.forEach((layer) => {
        status[layer.type] = layer.visible
        layer.hide()
      })
      return status
    }

    static recoverLayersVisibility (status) {
      all.forEach((layer) => {
        if (status[layer.type]) layer.show()
      })
      return status
    }

    constructor (options) {
      all.push(this)
      this.name = options.name
      this.short_name = options.short_name
      this.api_endpoint = options.api_endpoint
      this.http_params = options.http_params
      this.data_layer = new google.maps.Data()
      this.style_options = options.style_options
      this.data_layer.setStyle(this.style_options.normal)
      this.metadata = {}
      this.data_loaded = false
      this.visible = false
      this.data = options.data
      this.type = options.type
      this.changes = options.changes
      this.single_selection = options.single_selection
      this.reset_style_on_click = !!options.reset_style_on_click
      this.highlighteable = !!options.highlighteable
      this.features = []
      this.threshold = options.threshold
      this.minzoom = options.minzoom || 0
      this.reload = options.reload
      this.denisty_hue_from = options.denisty_hue_from
      this.denisty_hue_to = options.denisty_hue_to
      this.minZoom = options.minZoom
      this.heatmap = options.heatmap
      this.hoverField = options.hoverField
      this.clickField = options.clickField
      this.visibilityThreshold = options.visibilityThreshold || config.ui.map_tools.layerVisibilityThresh
      this.isBoundaryLayer = options.isBoundaryLayer || false
      this.scaleIcon = options.scaleIcon || false
      this.onDataLoaded = options.onDataLoaded || false

      this.setDeclarativeStyle(options.declarativeStyles)

      var data_layer = this.data_layer
      var feature_dragged

      data_layer.addListener('click', (event) => {
        $rootScope.$broadcast('map_layer_clicked_feature', event, this)
        // if (!selection.isEnabled()) return
        var changes
        if (this.single_selection) {
          changes = this.createEmptyChanges()
          this.data_layer.forEach((feature) => {
            if (feature.getProperty('selected')) {
              this.setFeatureSelected(feature, false, changes)
            }
          })
          if (this.reset_style_on_click) {
            this.data_layer.overrideStyle(event.feature, this.style_options.normal)
          } else {
            this.setFeatureSelected(event.feature, true, changes)
          }
          this.broadcastChanges(changes)
        } else {
          if (!map_tools.is_visible('target_builder') || !event.feature.getProperty('id') || event.feature.getProperty('unselectable')) return
          if (this.unselectable) return
          changes = this.createEmptyChanges()
          this.toggleFeature(event.feature, changes)
          this.broadcastChanges(changes)
        }
      })

      data_layer.addListener('mouseup', (event) => {
        if (feature_dragged) {
          $rootScope.$broadcast('map_layer_dragged_feature', event, feature_dragged)
        }
      })

      data_layer.addListener('mousedown', (event) => {
        feature_dragged = null
      })

      data_layer.addListener('setgeometry', (event) => {
        feature_dragged = event.feature
      })

      data_layer.addListener('mouseup', (event) => {
        $rootScope.$broadcast('map_layer_mouseup_feature', event, this)
      })

      data_layer.addListener('mouseover', (event) => {
        if (this.highlighteable && event.feature) {
          event.feature.setProperty('highlighted', true)
        }
        $rootScope.$broadcast('map_layer_mouseover_feature', event, this)
      })

      data_layer.addListener('mouseout', (event) => {
        if (this.highlighteable && event.feature) {
          event.feature.setProperty('highlighted', false)
        }
        $rootScope.$broadcast('map_layer_mouseout_feature', event, this)
      })

      data_layer.addListener('rightclick', (event) => {
        $rootScope.$broadcast('map_layer_rightclicked_feature', event, this)
      })

      $rootScope.$on('map_idle', () => {
        this.reloadIfDirty()
      })

      ;['dragend', 'zoom_changed'].forEach((event_name) => {
        $rootScope.$on('map_' + event_name, () => {
          if (this.reload === 'dynamic') {
            var reload_on = map.getZoom() > this.threshold ? 'dragend' : 'zoom_changed'
            if (reload_on === event_name || (this.reload_on && this.reload_on !== reload_on)) {
              this.markAsDirty()
            }
            this.reload_on = reload_on
          } else if (this.reload === 'always') {
            this.markAsDirty()
          }

          if (this.scaleIcon) {
            this.data_layer.revertStyle()
          }
        })
      })

      $rootScope.$on('map_zoom_changed', () => this._calculateDisabled())
      if (map) {
        map.ready(() => this._mapReady())
      } else {
        $(document).ready(() => {
          map.ready(() => this._mapReady())
        })
      }
    }

    setDeclarativeStyle (declarativeStyles) {
      this.declarativeStyles = declarativeStyles
      this.data_layer.setStyle((feature) => {
        var styles = Object.assign({}, feature.getProperty('selected')
          ? this.style_options.selected || this.style_options.normal
          : this.style_options.normal)
        if (this.highlighteable && feature.getProperty('highlighted')) {
          styles = Object.assign({}, this.style_options.highlight)
        }
        if (feature.getProperty('draggable')) {
          styles.draggable = true
        }
        var icon = !styles.icon && feature.getProperty('icon')
        if (icon) {
          styles.icon = icon
        }
        this.declarativeStyles && this.declarativeStyles(feature, styles)
        return styles
      })
    }

    _mapReady () {
      this._calculateDisabled()
      if (this.heatmap) {
        this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
          map: map,
          radius: 40
        })
      }
    }

    _calculateDisabled () {
      if (this.minZoom) {
        if (map.getZoom() < this.minZoom) {
          this.disable()
        } else {
          this.enable()
        }
      }
    }

    markAsDirty () {
      this.dirty = true
    }

    reloadIfDirty () {
      if (this.dirty && this.visible) {
        this.reloadData(true)
        this.dirty = false
      }
    }

    selectFeature (feature) {
      this.data_layer.add(feature)
      feature.setProperty('selected', true)
    }

    deselectFeature (feature) {
      feature.setProperty('selected', false)
    }

    setFeatureSelected (feature, select, changes) {
      if (feature.getProperty('selected') === select) return

      var id = feature.getProperty('id')
      var type = this.changes || this.type

      if (!select) {
        this.deselectFeature(feature)
        changes.deletions[type].push(id)
      } else {
        this.selectFeature(feature)
        changes.insertions[type].push(id)
      }
      // This is needed because if the event is triggered from a google maps event
      // then we need angular to do its stuff. Otherwise couters for sources and targets
      // won't be updated. And if angular is already doing its stuff we cannot call $rootScope.$apply()
      // directly because it will throw an error
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }

    toggleFeature (feature, changes) {
      this.setFeatureSelected(feature, !feature.getProperty('selected'), changes)
    }

    select_random_features () {
      var i = 0
      var changes = this.createEmptyChanges()
      this.data_layer.forEach((feature) => {
        if (i < 3 && !feature.getProperty('selected')) {
          this.toggleFeature(feature, changes)
          i++
        }
      })
      this.broadcastChanges(changes)
    }

    select_random_area () {
      var feature
      this.data_layer.forEach((f) => {
        if (f.getProperty('id') === 216835) feature = f
      })
      var event = {
        feature: feature
      }
      $rootScope.$broadcast('map_layer_clicked_feature', event, this)
    }

    addGeoJson (geo_json) {
      this.features = this.features.concat(this.data_layer.addGeoJson(geo_json))
    }

    // Load GeoJSON data into the layer if it's not already loaded
    loadData () {
      if (map && (map.getZoom() < this.visibilityThreshold) && ((this.heatmapLayer) && this.heatmapLayer.getData().length > 0 || this.features.length > 0)) {
        this.clearData()
        Notification.info({ message: 'Layers Hidden, Zoom threshold exceeded.', positionY: 'bottom', positionX: 'right' })
        return
      }

      if (this.type !== 'wirecenter' && (!this.data_loaded || this.dirty)) {
        this.dirty = false
        if (this.data) {
          this.addGeoJson(this.data)
          this.data_loaded = true
          $rootScope.$broadcast('map_layer_loaded_data', this)
          this.configureFeatureStyles()
        } else if (this.api_endpoint) {
          var bounds = map.getBounds()
          var params = {
            nelat: bounds.getNorthEast().lat(),
            nelon: bounds.getNorthEast().lng(),
            swlat: bounds.getSouthWest().lat(),
            swlon: bounds.getSouthWest().lng(),
            zoom: map.getZoom(),
            threshold: this.threshold,
            heatmap: this.heatmap
          }
          _.extend(params, this.http_params || {})
          this.is_loading = true
          var api_endpoint = this.api_endpoint
            .replace(/\:plan_id/g, (plan && plan.id) || '')

          if (this._canceler) {
            this._canceler.promise.canceled = true
            this._canceler.resolve()
            this._canceler = null
          }
          this._canceler = $q.defer()
          var spinner = $(`.map-layer-spinner-${this.type}`)
          spinner.addClass('spin')
          $http({
            url: api_endpoint,
            method: 'GET',
            params: params,
            timeout: this._canceler.promise
          })
            .then((response) => {
              if (response.status >= 200 && response.status <= 299) {
                spinner.removeClass('spin')
                this.is_loading = false
                var data = response.data
                // hide layer to change styles "in background"
                var visible = this.visible
                this.hide()
                this.clearData()
                if (this.heatmapLayer && params.zoom <= params.threshold) {
                  this.heatmapLayer.setData(
                    data.feature_collection.features.map((feature) => {
                      var coordinates = feature.geometry.coordinates
                      var density = feature.properties.density
                      return {
                        location: new google.maps.LatLng(coordinates[1], coordinates[0]),
                        weight: density
                      }
                    })
                  )
                  this.heatmapLayer.setMap(map)
                } else {
                  var covArr = []

                  var featureCollection = data.feature_collection
                  // handle coverage_geom in the api call if needed
                  if (this.is_coverage) {
                  // iterate through features
                    featureCollection.features.map((feature) => {
                      var temp = {}
                      // copy the actual data in case #passbyreference
                      angular.copy(feature, temp)

                      // extract the coverage_geom
                      var geom = temp.properties.coverage_geom
                      delete temp.properties.coverage_geom

                      if (geom) {
                        var _fet = {
                          geometry: geom,
                          properties: temp.properties,
                          type: 'Feature'
                        }
                        covArr.push(_fet)
                      }
                    })
                    // create a geoJSON for secondary geometry
                    featureCollection = { features: covArr, type: 'FeatureCollection' }
                  }
                  this.addGeoJson(featureCollection)
                  this.heatmapLayer && this.heatmapLayer.setMap(null)
                }
                this.metadata = data.metadata
                this.data_loaded = true
                this._createHovers()
                this._createClickListener()
                this.onDataLoaded && this.onDataLoaded(this)
                $rootScope.$broadcast('map_layer_loaded_data', this)
                this.configureFeatureStyles()
                // set the layer visible or not again
                this.setVisible(visible)
              } else {
                spinner.removeClass('spin')
              }
            })
        }
      }
    }

    _createHovers () {
      if (!this.hoverField) return
      var dataLayer = this.data_layer
      dataLayer.forEach((feature) => {
        var c = feature.getProperty('centroid')
        if (!c) {
          return console.warn('Feature missing centroid')
        }
        var p = c.coordinates
        var centroid = new google.maps.LatLng(p[1], p[0])
        var marker = map_utils.createCenteredMarker(dataLayer, feature, centroid, {})
        var text = feature.getProperty(this.hoverField)
        marker.setIcon('https://chart.googleapis.com/chart?chst=d_text_outline&chld=000000|16|h|FFFFFF|_|' + encodeURIComponent(text))
      })
    }

    _createClickListener () {
      if (!this.clickField) return
      var dataLayer = this.data_layer
      this.data_layer.addListener('click', (event) => {
        $rootScope.$broadcast('map_layer_census_block_click', event.feature)
      })
    }

    setApiEndpoint (api_endpoint, params) {
      if (this.api_endpoint === api_endpoint && _.isEqual(this.http_params, params)) return
      this.api_endpoint = api_endpoint
      if (params) {
        this.http_params = params
      }
      this.data_loaded = false
      this.clearData()
      if (this.visible) {
        this.loadData()
      }
    }

    reloadData (lazy_clean) {
      if (!lazy_clean) {
        this.clearData()
      } else {
        this.data_loaded = false
      }
      this.loadData()
    }

    configureFeatureStyles () {
      if (this.flat_color) return
      var data = this.data_layer
      var maxdensity = Number.MIN_VALUE
      var mindensity = Number.MAX_VALUE
      data.forEach((feature) => {
        if (feature.getGeometry()) {
          var density = feature.getProperty('density')
          maxdensity = Math.max(density, maxdensity)
          mindensity = Math.min(density, mindensity)
        }
      })
      var from = this.denisty_hue_from || 120
      var to = this.denisty_hue_to || 0
      if (maxdensity) {
        maxdensity -= mindensity
        data.forEach((feature) => {
          var density = feature.getProperty('density')
          if (+density == density) { // eslint-disable-line
            density -= mindensity
            var h
            if (from < to) {
              h = from + Math.round((density / maxdensity) * (to - from))
            } else {
              h = from - Math.round((density / maxdensity) * (from - to))
            }
            var color = 'hsl(' + h + ',100%,50%)'
            // console.log('%c' + color, 'color: ' + color, density)
            data.overrideStyle(feature, {
              fillOpacity: 0.5,
              fillColor: color,
              strokeWeight: 1,
              strokeColor: color
            })
          }
        })
      }
    }

    setVisible (visible) {
      visible ? this.show() : this.hide()
    }

    show () {
      if (this.visible) return
      this.visible = true
      this.configureVisibility()
    }

    hide () {
      if (!this.visible) return
      this.visible = false
      this.configureVisibility()
    }

    enable () {
      if (!this.disabled) return
      this.disabled = false
      this.configureVisibility()
    }

    disable () {
      if (this.disabled) return
      this.disabled = true
      this.configureVisibility()
    }

    configureVisibility () {
      var oldValue = this.data_layer.getMap()
      var _map = this.visible && !this.disabled ? map : null
      if (_map) {
        this.loadData()
      }
      this.data_layer.setMap(_map)
      if (this.heatmapLayer) {
        this.heatmapLayer.setMap(_map)
      }
      if (_map !== oldValue) {
        $rootScope.$broadcast('map_layer_changed_visibility', this)
      }
    }

    heatmapIsVisible () {
      return this.heatmapLayer && this.heatmapLayer.getMap()
    }

    toggleVisibility () {
      this.visible ? this.hide() : this.show()
    }

    clearData () {
      var data = this.data_layer
      data.forEach((feature) => data.remove(feature))
      this.data_loaded = false
      this.metadata = {}
      this.features.splice(0)
      delete this.data
      if (this.heatmapLayer) {
        this.heatmapLayer.setData([])
      }
    }

    revertStyles () {
      var data = this.data_layer
      data.revertStyle()
      data.forEach((feature) => {
        feature.removeProperty('selected')
        var icon = feature.getProperty('icon')
        if (icon) {
          data.overrideStyle(feature, { icon: icon })
        }
      })
    }

    changeSelectionForFeaturesMatching (select, func) {
      if (!this.visible) return
      var changes = this.createEmptyChanges()

      var matchingFeatures = []
      this.data_layer.forEach((feature) => {
        if (func(feature)) {
          this.setFeatureSelected(feature, select, changes)
          matchingFeatures.push(feature)
        }
      })
      this.broadcastChanges(changes)
      $rootScope.$broadcast('map_layer_selected_items', this, matchingFeatures)
    }

    remove () {
      this.data_layer.setMap(null)
      var i = all.indexOf(this)
      if (i >= 0) all.splice(i, 1)
    }

    number_of_features () {
      var i = 0
      this.data_layer.forEach((feature) => { i++ })
      return i
    }

    broadcastChanges (changes) {
      $rootScope.$broadcast('map_layer_changed_selection', this, changes)
    }

    createEmptyChanges () {
      var type = this.changes || this.type
      var changes = { insertions: {}, deletions: {} }
      changes.insertions[type] = []
      changes.deletions[type] = []
      return changes
    }

    setThreshold (threshold) {
      this.threshold = threshold || 0
      this.reloadData()
    }
  }
})
