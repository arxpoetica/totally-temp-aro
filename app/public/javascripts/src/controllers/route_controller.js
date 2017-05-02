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

}])
