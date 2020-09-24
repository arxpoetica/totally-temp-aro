class ViewSettingsController {
  constructor (state, tileDataService, rState) {
    this.state = state
    this.tileDataService = tileDataService

    this.state.viewSetting.selectedFiberOption = this.state.viewFiberOptions[0]
    this.mapTileOptions

    this.equipmentPropertiesToRender = JSON.stringify(this.state.configuration.networkEquipment.labelDrawingOptions.properties)

    // Map tile settings used for debugging
    this.state.mapTileOptions
      .subscribe((mapTileOptions) => this.mapTileOptions = angular.copy(mapTileOptions))

    // Map tile settings used for debugging
    rState.mapTileOptions.getMessage().subscribe((mapTileOptions) => {
      this.mapTileOptions = angular.copy(mapTileOptions)
    }) 
  }

  fiberOptionChanged () {
    this.state.requestMapLayerRefresh.next(null)
  }

  onActiveTileFetcherChanged() {
    // If the tile fetcher changes, delete the tile cache and re-render everything
    this.tileDataService.clearDataCache()
    this.state.requestMapLayerRefresh.next(null)
  }

  saveEquipmentPropertiesToRender () {
    this.state.configuration.networkEquipment.labelDrawingOptions.properties = JSON.parse(this.equipmentPropertiesToRender)
    this.state.viewSettingsChanged.next()
    this.state.requestMapLayerRefresh.next(null)
  }

  // Take the mapTileOptions defined in $scope and set it on the state
  updateState () {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    this.state.mapTileOptions.next(newMapTileOptions)
  }
}

ViewSettingsController.$inject = ['state', 'tileDataService', 'rState']

let viewSettings = {
  templateUrl: '/components/sidebar/debug/view-settings.html',
  bindings: {},
  controller: ViewSettingsController
}

export default viewSettings
