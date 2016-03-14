/* global app google map _ encodeURIComponent config */
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
      this.style_options = options.style_options
      this.data_layer = new google.maps.Data()
      this.metadata = {}
      this.data_loaded = false
      this.visible = false
      this.data = options.data
      this.type = options.type
      this.always_show_selected = false
      this.single_selection = options.single_selection
      this.reset_style_on_click = !!options.reset_style_on_click
      this.highlighteable = !!options.highlighteable
      this.features = []
      this.set_style('normal')
      this.threshold = options.threshold
      this.minzoom = options.minzoom || 0
      this.reload = options.reload
      this.denisty_hue_from = options.denisty_hue_from
      this.denisty_hue_to = options.denisty_hue_to

      var collection
      if (this.type === 'locations') {
        collection = selection.targets
      } else if (this.type === 'network_nodes') {
        collection = selection.sources
      }
      this.collection = collection

      var data_layer = this.data_layer

      var feature_dragged

      data_layer.addListener('click', (event) => {
        $rootScope.$broadcast('map_layer_clicked_feature', event, this)
        if (!selection.is_enabled()) return
        var changes
        if (this.single_selection) {
          changes = create_empty_changes(this)
          this.data_layer.forEach((feature) => {
            if (feature.selected) {
              this.set_feature_selected(feature, false, changes)
            }
          })
          if (this.reset_style_on_click) {
            this.data_this.overrideStyle(event.feature, this.style_options.normal)
          } else {
            this.set_feature_selected(event.feature, true, changes)
          }
          broadcast_changes(this, changes)
        } else {
          if (!event.feature.getProperty('id') || event.feature.getProperty('unselectable')) return
          changes = create_empty_changes(this)
          this.toggle_feature(event.feature, changes)
          broadcast_changes(this, changes)
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

      if (options.heatmap) {
        var gradient = [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 0, 1)',
          'rgba(255, 255, 0, 1)',
          'rgba(255, 170, 0, 1)',
          'rgba(255, 85, 0, 1)',
          'rgba(255, 0, 0, 1)'
        ]
        this.heatmap_layer = new google.maps.visualization.HeatmapLayer({ opacity: 0.8, gradient: gradient })
        this.heatmap_layer.set('radius', 10)
        $rootScope.$on('map_zoom_changed', () => {
          this.configure_visibility()
        })
      }

      $rootScope.$on('map_idle', () => {
        this.reload_if_dirty()
      })

      ;['dragend', 'zoom_changed'].forEach((event_name) => {
        $rootScope.$on('map_' + event_name, () => {
          if (this.reload === 'dynamic') {
            var reload_on = map.getZoom() > this.threshold ? 'dragend' : 'zoom_changed'
            if (reload_on === event_name || (this.reload_on && this.reload_on !== reload_on)) {
              this.mark_as_dirty()
            }
            this.reload_on = reload_on
          } else if (this.reload === 'always') {
            this.mark_as_dirty()
          }
        })
      })
    }

    mark_as_dirty () {
      this.dirty = true
    }

    reload_if_dirty () {
      if (this.dirty && this.visible) {
        this.reload_data(true)
        this.dirty = false
      }
    }

    set_highlighteable (highlighteable) {
      if (!highlighteable) {
        this.data_layer.revertStyle()
      }
      this.highlighteable = highlighteable
    }

    set_always_show_selected (show) {
      this.always_show_selected = show
      this.configure_visibility()
      this.load_data()
    }

    select_feature (feature) {
      feature.selected = true
      if (this.style_options.selected) {
        this.data_layer.add(feature)
        this.data_layer.overrideStyle(feature, this.style_options.selected)
      }
    }

    deselect_feature (feature) {
      feature.selected = false
      if (this.style_options.selected) {
        this.data_layer.overrideStyle(feature, this.style_options.normal)
      }
    }

    set_feature_selected (feature, select, changes) {
      if (feature.selected === select) return

      var id = feature.getProperty('id')

      if (!select) {
        this.deselect_feature(feature)
        if (this.collection) {
          this.collection.remove(id)
        }
        changes.deletions[this.type].push(id)
      } else {
        this.select_feature(feature)
        if (this.collection) {
          this.collection.add(id)
        }
        changes.insertions[this.type].push(id)
      }
      // This is needed because if the event is triggered from a google maps event
      // then we need angular to do its stuff. Otherwise couters for sources and targets
      // won't be updated. And if angular is already doing its stuff we cannot call $rootScope.$apply()
      // directly because it will throw an error
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }

    toggle_feature (feature, changes) {
      this.set_feature_selected(feature, !feature.selected, changes)
    }

    select_random_features () {
      var self = this
      var i = 0
      var changes = create_empty_changes(self)
      self.data_layer.forEach((feature) => {
        if (i < 3 && !feature.selected) {
          self.toggle_feature(feature, changes)
          i++
        }
      })
      broadcast_changes(self, changes)
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
      this.apply_filter()
    }

    set_filter (filter) {
      this.filter = filter
      this.apply_filter()
    }

    apply_filter () {
      var self = this
      var filter = self.filter || (() => true)
      this.features.forEach((feature) => {
        if (!filter(feature)) {
          self.data_layer.remove(feature)
        } else {
          self.data_layer.add(feature)
        }
      })
    }

    // Load GeoJSON data into the layer if it's not already loaded
    load_data () {
      var layer = this
      if (!layer.data_loaded) {
        if (layer.data) {
          this.addGeoJson(layer.data)
          load_heatmap_layer()
          layer.data_loaded = true
          $rootScope.$broadcast('map_layer_loaded_data', layer)
          this.configure_feature_styles()
        } else if (this.api_endpoint) {
          var params = {
            nelat: map.getBounds().getNorthEast().lat(),
            nelon: map.getBounds().getNorthEast().lng(),
            swlat: map.getBounds().getSouthWest().lat(),
            swlon: map.getBounds().getSouthWest().lng(),
            zoom: map.getZoom(),
            threshold: layer.threshold
          }
          _.extend(params, this.http_params || {})
          layer.is_loading = true
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
            layer.is_loading = false
            var data = response
            // hide layer to change styles "in background"
            var visible = layer.visible
            layer.hide()
            layer.clear_data()
            layer.addGeoJson(data.feature_collection)
            layer.metadata = data.metadata
            layer.data_loaded = true
            $rootScope.$broadcast('map_layer_loaded_data', layer)
            layer.configure_feature_styles()
            layer.sync_selection()
            load_heatmap_layer()
            // set the layer visible or not again
            layer.set_visible(visible)
          })
        }
      }

      function load_heatmap_layer () {
        if (!layer.heatmap_layer) return
        var arr = []
        layer.features.forEach((feature) => {
          var density = feature.getProperty('density')
          var geom = feature.getGeometry()
          if (geom && geom.get) {
            if (typeof density !== 'undefined') {
              arr.push({ location: geom.get(), weight: density })
            } else {
              arr.push(geom.get())
            }
          }
        })
        layer.heatmap_layer.setData(new google.maps.MVCArray(arr))
      }
    }

    set_api_endpoint (api_endpoint, params) {
      if (this.api_endpoint === api_endpoint && !params) return
      this.api_endpoint = api_endpoint
      if (params) {
        this.http_params = params
      }
      this.data_loaded = false
      this.clear_data()
      if (this.visible) {
        this.load_data()
      }
    }

    reload_data (lazy_clean) {
      if (!lazy_clean) {
        this.clear_data()
      } else {
        this.data_loaded = false
      }
      this.load_data()
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
        var density = feature.getProperty('density')
        maxdensity = Math.max(density, maxdensity)
        mindensity = Math.min(density, mindensity)
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
            // console.log('%c'+color, 'color: '+color, density);
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

    sync_selection () {
      var layer = this
      var collection = this.collection

      if (collection) {
        layer.features.forEach((feature) => {
          var id = feature.getProperty('id')
          if (collection.contains(id)) {
            layer.select_feature(feature)
          }
        })
      }

      this.apply_filter()
    }

    set_visible (visible) {
      visible ? this.show() : this.hide()
    }

    show () {
      if (this.visible) return
      this.load_data()
      this.visible = true
      this.configure_visibility()
      $rootScope.$broadcast('map_layer_changed_visibility', this)
    }

    hide () {
      if (!this.visible) return
      this.visible = false
      this.configure_visibility()
      $rootScope.$broadcast('map_layer_changed_visibility', this)
    }

    set_style (type) {
      if (this.current_style === type) return // this avoids repainting things when no needed
      this.current_style = type

      if (type === 'normal') {
        this.data_layer.setStyle(this.style_options.normal)
        this.set_filter(null)
        this.configure_feature_styles()
      } else if (type === 'highlight') {
        this.data_layer.setStyle(this.style_options.highlight)
      } else if (type === 'hidden') {
        this.data_layer.setStyle(this.style_options.normal)
        this.set_filter((feature) => feature.selected)
      }
    }

    configure_visibility () {
      if (this.visible) {
        if (this.heatmap_layer) {
          if (map.getZoom() > 16) {
            this.heatmap_layer.setMap(null)
            this.data_layer.setMap(map)
            this.set_style('normal')
          } else {
            this.heatmap_layer.setMap(map)
            this.set_style('hidden')
            this.data_layer.setMap(this.always_show_selected ? map : null)
          }
        } else {
          this.set_style('normal')
          this.data_layer.setMap(map)
        }
      } else {
        if (this.always_show_selected) {
          this.set_style('hidden')
          this.data_layer.setMap(map)
        } else {
          this.data_layer.setMap(null)
          this.set_style('normal')
        }
        if (this.heatmap_layer) {
          this.heatmap_layer.setMap(null)
        }
      }
    }

    toggle_visibility () {
      this.visible ? this.hide() : this.show()
    }

    clear_data () {
      var data = this.data_layer
      data.forEach((feature) => data.remove(feature))
      this.data_loaded = false
      this.metadata = {}
      this.features.splice(0)
      delete this.data
    }

    revert_styles () {
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

    change_selection_for_features_matching (select, func) {
      var layer = this
      if (!layer.visible) return
      var data = this.data_layer
      var changes = create_empty_changes(layer)

      data.forEach((feature) => {
        if (func(feature)) {
          layer.set_feature_selected(feature, select, changes)
        }
      })
      broadcast_changes(layer, changes)
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

  function create_empty_changes (layer) {
    var type = layer.type
    var changes = { insertions: {}, deletions: {} }
    changes.insertions[type] = []
    changes.deletions[type] = []
    return changes
  }

  function broadcast_changes (layer, changes) {
    $rootScope.$broadcast('map_layer_changed_selection', layer, changes)
  }
})
