/* global app google config */
app.service('selection', ($rootScope, map_layers) => {
  var selection = {}
  var enabled = false

  selection.clearSelection = () => {
    var feature_layers = map_layers.feature_layers
    for (var key in feature_layers) {
      if (feature_layers.hasOwnProperty(key)) {
        feature_layers[key].revertStyles()
      }
    }
  }

  selection.setEnabled = (_enabled) => {
    enabled = _enabled && config.route_planning.length > 0
  }

  selection.isEnabled = () => {
    return enabled
  }

  $rootScope.$on('selection_tool_rectangle', (e, overlay, deselect_mode) => {
    var bounds = overlay.getBounds()
    map_layers.getFeatureLayer('locations').changeSelectionForFeaturesMatching(!deselect_mode, (feature) => {
      var latLng = feature.getGeometry().get()
      return bounds.contains(latLng)
    })
  })

  $rootScope.$on('selection_tool_polygon', (e, overlay, deselect_mode, selectBoundaries) => {
    if (selectBoundaries) {
      Object.keys(map_layers.feature_layers).forEach(function (key) {
        var feat = map_layers.feature_layers[key]

        if (feat.isBoundaryLayer) {
          map_layers.getFeatureLayer(feat.type).changeSelectionForFeaturesMatching(!deselect_mode, (feature) => {
            var doesContain = true
            feature.getGeometry().forEachLatLng((l) => {
              if (!google.maps.geometry.poly.containsLocation(l, overlay)) {
                doesContain = false
              }
            })
            return doesContain
          })
        }
      })
    } else {
      map_layers.getFeatureLayer('locations').changeSelectionForFeaturesMatching(!deselect_mode, (feature) => {
        var latLng = feature.getGeometry().get()
        return google.maps.geometry.poly.containsLocation(latLng, overlay)
      })
    }
  })

  return selection
})
