/* global app user_id map */
// Route Controller
app.controller('route_controller', ['$rootScope', 'selection', 'map_tools', ($rootScope, selection, map_tools) => {
  $rootScope.$on('plan_selected', (e, plan) => {
    if (!plan) return
    selection.setEnabled(plan.owner_id === user_id)
  })

  $rootScope.$on('plan_cleared', (e, plan) => {
    selection.clearSelection()
  })

  $rootScope.$on('map_zoom_changed', () => {
    if (map.getZoom() < 11) {
      map_tools.disable('locations')
      map_tools.disable('fiber_plant')
    } else {
      map_tools.enable('locations')
      map_tools.enable('fiber_plant')
    }
  })
}])
