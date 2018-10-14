class ViewSettingsController {

  constructor(state, $rootScope) {
    this.state = state
    this.$rootScope = $rootScope

    this.state.viewSetting.selectedFiberOption = this.state.viewFiberOptions[0]
    this.mapTileOptions

    this.equipmentPropertiesToRender = JSON.stringify(this.state.configuration.networkEquipment.labelDrawingOptions.properties)

    // Map tile settings used for debugging
    this.state.mapTileOptions
      .subscribe((mapTileOptions) => this.mapTileOptions = angular.copy(mapTileOptions))
  }

  fiberOptionChanged() {
    this.state.requestMapLayerRefresh.next(null)
  }

  saveEquipmentPropertiesToRender() {
    this.state.configuration.networkEquipment.labelDrawingOptions.properties = JSON.parse(this.equipmentPropertiesToRender)
    this.state.viewSettingsChanged.next()
    this.state.requestMapLayerRefresh.next(null)
  }

  // Take the mapTileOptions defined in $scope and set it on the state
  updateState() {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    this.state.mapTileOptions.next(newMapTileOptions)
  }
}

ViewSettingsController.$inject = ['state', '$rootScope']

let viewSettings = {
  templateUrl: '/components/sidebar/debug/view-settings.html',
  bindings: {},
  controller: ViewSettingsController
}

export default viewSettings