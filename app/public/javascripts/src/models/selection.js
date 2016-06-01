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

  selection.set_enabled = (_enabled) => {
    enabled = _enabled && config.route_planning.length > 0
  }

  selection.is_enabled = () => {
    return enabled
  }

  $rootScope.$on('selection_tool_rectangle', (e, overlay, deselect_mode) => {
    var bounds = overlay.getBounds()
    map_layers.getFeatureLayer('locations').changeSelectionForFeaturesMatching(!deselect_mode, (feature) => {
      var latLng = feature.getGeometry().get()
      return bounds.contains(latLng)
    })
  })

  $rootScope.$on('selection_tool_polygon', (e, overlay, deselect_mode) => {
    map_layers.getFeatureLayer('locations').changeSelectionForFeaturesMatching(!deselect_mode, (feature) => {
      var latLng = feature.getGeometry().get()
      return google.maps.geometry.poly.containsLocation(latLng, overlay)
    })
  })

  return selection
})
