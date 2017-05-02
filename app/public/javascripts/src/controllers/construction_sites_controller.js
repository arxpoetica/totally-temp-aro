/* global app _ config user_id $ map google randomColor tinycolor Chart swal */
// Construction Sites Controller
app.controller('construction_sites_controller', ['$scope', '$rootScope', '$http', 'configuration', 'map_tools', 'map_layers', 'MapLayer', 'CustomOverlay', 'tracker', 'optimization', 'state', ($scope, $rootScope, $http, configuration, map_tools, map_layers, MapLayer, CustomOverlay, tracker, optimization, state) => {
  $scope.map_tools = map_tools
  $scope.selected_tool = null
  $scope.available_tools = [
    {
      key: 'commercial',
      name: 'Commercial'
    },
    {
      key: 'residential',
      name: 'Residential'
    },
    {
      key: 'combo',
      name: 'Combo'
    }
  ]

  $scope.available_tools = _.reject($scope.available_tools, (tool) => {
    return config.ui.map_tools.locations.build.indexOf(tool.key) === -1
  })

  // The state.locations object will be updated after the configuration is loaded
  $scope.planState = state;

  $scope.new_location_data = null

  $scope.changeLocationsLayer = (majorCategory) => {
    tracker.track('Locations / ' + $scope.overlay)

    // Select the business, household, celltower categories to show
    var businessCategories = []
    var householdCategories = []
    var showTowers = false
    $scope.planState.locationTypes.forEach((locationType) => {
      if ((locationType.type === 'business') && locationType.checked) {
        businessCategories.push(locationType.key)
      } else if ((locationType.type === 'household') && locationType.checked) {
        householdCategories.push('small')
        householdCategories.push('medium')
      } else if ((locationType.type === 'celltower') && locationType.checked) {
        showTowers = true
      }
    })
  }

}])
