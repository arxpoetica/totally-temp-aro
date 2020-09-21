import MapUtilities from '../../common/plan/map-utilities'

class EquipmentDetailListController {
  constructor ($timeout, state, tileDataService) {
    this.$timeout = $timeout
    this.state = state
    this.tileDataService = tileDataService
    this.Object = Object

    this.clliToEquipmentInfo = {}
    this.MAX_EQUIPMENT_LIST = 100

    // Handles zoom or equipment layer selection
    this.mapLayersChangeSubscription = state.mapLayers.skip(1).debounceTime(120).subscribe((reload) => {
      reload && this.refreshEquipmentList()
    })
  }

  getVisibleEquipmentIds () {
    if (!this.mapRef || !this.mapRef.getBounds()) {
      return
    }
    // Get visible tiles
    var visibleTiles = MapUtilities.getVisibleTiles(this.mapRef)
    visibleTiles.forEach((tile) => {
      var coord = { x: tile.x, y: tile.y }
      this.getVisibleTileData(tile.zoom, coord) // fetch tile data
    })
  }

  getVisibleTileData (zoom, coord) {
    var singleTilePromises = []
    var mapLayers = Object.keys(this.state.mapLayers.getValue())

    mapLayers.forEach((mapLayerKey, index) => {
      var mapLayer = this.state.mapLayers.getValue()[mapLayerKey]
      var xTile = coord.x
      var yTile = coord.y
      var singleTilePromise = this.tileDataService.getTileData(mapLayer, zoom, xTile, yTile)
      singleTilePromises.push(singleTilePromise)
    })

    return Promise.all(singleTilePromises)
      .then((singleTileResults) => {
        singleTileResults.forEach((featureData, index) => {
          var features = []
          Object.keys(featureData.layerToFeatures).forEach((layerKey) => features = features.concat(featureData.layerToFeatures[layerKey]))
          for (var iFeature = 0; iFeature < features.length; ++iFeature) {
            // Parse the geometry out.
            var feature = features[iFeature]
            if (this.filterFeature(feature)) {
              this.clliToEquipmentInfo[feature.properties.object_id] = feature.properties
            }
          }
        })
        this.$timeout()
      })
  }

  filterFeature (feature) {
    return feature.properties &&
      feature.properties.object_id &&
      feature.properties._data_type &&
      feature.properties._data_type.split('.')[0] == 'equipment' &&
      feature.properties.is_deleted !== 'true' && // deleted planned sites
      !this.isExistingSiteDeleted(feature.properties.object_id) && // deleted exisiting sites
      Object.keys(this.clliToEquipmentInfo).length <= this.MAX_EQUIPMENT_LIST
  }

  isExistingSiteDeleted (objectId) {
    var isDeleted = false
    if (this.tileDataService.modifiedFeatures.hasOwnProperty(objectId)) {
      const modifiedFeature = this.tileDataService.modifiedFeatures[objectId]
      if (modifiedFeature.deleted) {
        isDeleted = true
      }
    }
    return isDeleted
  }

  refreshEquipmentList () {
    // refresh only in equipment list view
    if (this.state.activeViewModePanel === this.state.viewModePanels.EQUIPMENT_INFO) {
      this.clliToEquipmentInfo = {}
      this.$timeout(this.getVisibleEquipmentIds(), 500)
    }
  }

  addMapListeners () {
    if (this.mapRef) {
      this.mapRef.addListener('dragend', () => this.refreshEquipmentList())
    }
  }

  removeMapListeners () {
    google.maps.event.clearListeners(this.mapRef, 'dragend')
  }

  $onInit () {
    this.mapRef = window[this.mapGlobalObjectName]
    this.getVisibleEquipmentIds()
    this.addMapListeners()
  }

  $onDestroy () {
    // Cleanup subscriptions
    this.clliToEquipmentInfo = {}
    this.mapLayersChangeSubscription.unsubscribe()
    this.removeMapListeners()
  }
}

EquipmentDetailListController.$inject = ['$timeout', 'state', 'tileDataService']

let equipmentDetailList = {
  templateUrl: '/components/sidebar/view/equipment-detail-list.html',
  bindings: {
    mapGlobalObjectName: '@',
    onClickObject: '&'
  },
  controller: EquipmentDetailListController
}

export default equipmentDetailList
