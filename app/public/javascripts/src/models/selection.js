/* global app _ google config */
app.service('selection', ($rootScope, map_layers) => {
  var selection = {}
  var collectionNames = []
  var enabled = false

  function add_selection_collection (name) {
    collectionNames.push(name)
    var arr = []
    var collection = {}
    collection.add = (id, feature) => {
      arr.push(id)
      arr = _.uniq(arr)
    }
    collection.remove = (id, feature) => {
      var i = _.indexOf(arr, id)
      if (i >= 0) {
        arr.splice(i, 1)
      }
    }
    collection.removeAll = () => {
      arr.splice(0, arr.length)
    }
    collection.length = () => {
      return arr.length
    }
    collection.contains = (id) => {
      return arr.indexOf(id) >= 0
    }
    selection[name] = collection
  }

  add_selection_collection('sources')
  add_selection_collection('targets')

  selection.clear_selection = () => {
    collectionNames.forEach((name) => {
      selection[name].removeAll()
    })

    var feature_layers = map_layers.feature_layers
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].revert_styles()
        feature_layers[key].apply_filter()
      }
    }
  }

  selection.sync_selection = () => {
    var feature_layers = map_layers.feature_layers
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].sync_selection()
      }
    }
  }

  selection.set_enabled = (_enabled) => {
    enabled = _enabled && config.route_planning.length > 0
  }

  selection.is_enabled = () => {
    return enabled
  }

  $rootScope.$on('selection_tool_rectangle', (e, overlay, deselect_mode) => {
    var bounds = overlay.getBounds()
    map_layers.getFeatureLayer('locations').change_selection_for_features_matching(!deselect_mode, (feature) => {
      var latLng = feature.getGeometry().get()
      return bounds.contains(latLng)
    })
  })

  $rootScope.$on('selection_tool_polygon', (e, overlay, deselect_mode) => {
    map_layers.getFeatureLayer('locations').change_selection_for_features_matching(!deselect_mode, (feature) => {
      var latLng = feature.getGeometry().get()
      return google.maps.geometry.poly.containsLocation(latLng, overlay)
    })
  })

  return selection
})
