/* global app google map _ encodeURIComponent config document $ */
'use strict'

app.service('MapLayer', ($http, $rootScope, selection) => {
  var plan = null
  $rootScope.$on('plan_selected', (e, p) => {
    plan = p
  })

  return class MapLayer {

    constructor (options) {
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

      var data_layer = this.data_layer

      var feature_dragged

      data_layer.addListener('click', (event) => {
        $rootScope.$broadcast('map_layer_clicked_feature', event, this)
        if (!selection.is_enabled()) return
        var changes
        if (this.single_selection) {
          changes = createEmptyChanges(this)
          this.data_layer.forEach((feature) => {
            if (feature.selected) {
              this.setFeatureSelected(feature, false, changes)
            }
          })
          if (this.reset_style_on_click) {
            this.data_layer.overrideStyle(event.feature, this.style_options.normal)
          } else {
            this.setFeatureSelected(event.feature, true, changes)
          }
          broadcastChanges(this, changes)
        } else {
          if (!event.feature.getProperty('id') || event.feature.getProperty('unselectable')) return
          changes = createEmptyChanges(this)
          this.toggleFeature(event.feature, changes)
          broadcastChanges(this, changes)
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
          this.data_layer.overrideStyle(event.feature, this.style_options.highlight)
        }
        $rootScope.$broadcast('map_layer_mouseover_feature', event, this)
      })

      data_layer.addListener('mouseout', (event) => {
        if (this.highlighteable && event.feature && !event.feature.selected) {
          this.data_layer.overrideStyle(event.feature, this.style_options.normal)
        }
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
      feature.selected = true
      if (this.style_options.selected) {
        this.data_layer.add(feature)
        this.data_layer.overrideStyle(feature, this.style_options.selected)
      }
    }

    deselectFeature (feature) {
      feature.selected = false
      if (this.style_options.selected) {
        this.data_layer.overrideStyle(feature, this.style_options.normal)
      }
    }

    setFeatureSelected (feature, select, changes) {
      if (feature.selected === select) return

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
      this.setFeatureSelected(feature, !feature.selected, changes)
    }

    select_random_features () {
      var self = this
      var i = 0
      var changes = createEmptyChanges(self)
      self.data_layer.forEach((feature) => {
        if (i < 3 && !feature.selected) {
          self.toggleFeature(feature, changes)
          i++
        }
      })
      broadcastChanges(self, changes)
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
      if (!this.data_loaded) {
        if (this.data) {
          this.addGeoJson(this.data)
          this.data_loaded = true
          $rootScope.$broadcast('map_layer_loaded_data', this)
          this.configure_feature_styles()
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
          var carrier = encodeURIComponent(config.client_carrier_name)
          var api_endpoint = this.api_endpoint
                                .replace(/\:plan_id/g, (plan && plan.id) || 'none')
                                .replace(/\:client_carrier_name/g, carrier)
          $http({
            url: api_endpoint,
            method: 'GET',
            params: params
          })
          .success((response) => {
            this.is_loading = false
            var data = response
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
            } else {
              this.addGeoJson(data.feature_collection)
            }
            this.metadata = data.metadata
            this.data_loaded = true
            $rootScope.$broadcast('map_layer_loaded_data', this)
            this.configure_feature_styles()
            // set the layer visible or not again
            this.setVisible(visible)
          })
        }
      }
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

    configure_feature_styles () {
      var data = this.data_layer
      var maxdensity = Number.MIN_VALUE
      var mindensity = Number.MAX_VALUE
      data.forEach((feature) => {
        var styles = {}
        var icon = feature.getProperty('icon')
        if (icon) {
          styles.icon = icon
        }
        var draggable = feature.getProperty('draggable')
        styles.draggable = draggable
        if (_.size(styles) > 0) {
          data.overrideStyle(feature, styles)
        }
        if (feature.getGeometry()) {
          var density = feature.getProperty('density')
          maxdensity = Math.max(density, maxdensity)
          mindensity = Math.min(density, mindensity)
        }
        if (feature.getProperty('selected') === true) {
          this.selectFeature(feature)
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
        delete feature.selected
        var icon = feature.getProperty('icon')
        if (icon) {
          data.overrideStyle(feature, { icon: icon })
        }
      })
    }

    changeSelectionForFeaturesMatching (select, func) {
      if (!this.visible) return
      var changes = createEmptyChanges(this)

      this.data_layer.forEach((feature) => {
        if (func(feature)) {
          this.setFeatureSelected(feature, select, changes)
        }
      })
      broadcastChanges(this, changes)
    }

    remove () {
      this.data_layer.setMap(null)
    }

    number_of_features () {
      var i = 0
      this.data_layer.forEach((feature) => { i++ })
      return i
    }

  }

  function createEmptyChanges (layer) {
    var type = layer.changes || layer.type
    var changes = { insertions: {}, deletions: {} }
    changes.insertions[type] = []
    changes.deletions[type] = []
    return changes
  }

  function broadcastChanges (layer, changes) {
    $rootScope.$broadcast('map_layer_changed_selection', layer, changes)
  }
})
