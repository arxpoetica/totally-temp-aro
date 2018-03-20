class ViewSettingsController {

  constructor(state, $rootScope) {
    this.state = state
    this.$rootScope = $rootScope

    this.state.viewSetting.selectedFiberOption = this.state.viewFiberOptions[0]
    this.mapTileOptions

    // Map tile settings used for debugging
    this.state.mapTileOptions
      .subscribe((mapTileOptions) => this.mapTileOptions = angular.copy(mapTileOptions))
  }

  fiberOptionChanged() {
    this.$rootScope.$broadcast("map_setting_changed", { type: "fiber_option", setting: this.state.viewSetting.selectedFiberOption });
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