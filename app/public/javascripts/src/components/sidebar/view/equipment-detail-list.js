import MapUtilities from '../../common/plan/map-utilities';

class EquipmentDetailListController {

  constructor($timeout, state, tileDataService, Utils) {
    this.$timeout = $timeout
    this.state = state
    this.utils = Utils
    this.tileDataService = tileDataService

    this.clliToequipmentInfo = {}
    this.MAX_Equipment_List = 100

    //Handles zoom or equipment layer selection
    this.mapLayersChangeSubscription = state.mapLayers.skip(1).debounceTime(120).subscribe((reload) => {
      reload && this.refreshEquipmentList()
    })
  }

  getVisibleEquipmentIds() {
    // Use the code in tile to fetch visible tile id's, redendunt for now
    if (!this.mapRef || !this.mapRef.getBounds()) {
      return
    }
    //Get visible tiles
    var visibleTiles = MapUtilities.getVisibleTiles(this.mapRef)
    visibleTiles.forEach((tile) => {
      var coord = { x: tile.x, y: tile.y }
      this.getVisibleTileData(tile.zoom, coord) //fetch tile data
    })
  }

  getVisibleTileData(zoom, coord) {
    var renderingData = {}, globalIndexToLayer = {}
    var singleTilePromises = []
    var mapLayers = Object.keys(this.state.mapLayers.getValue())

    mapLayers.forEach((mapLayerKey, index) => {
      // Initialize rendering data for this layer
      var mapLayer = this.state.mapLayers.getValue()[mapLayerKey]
      renderingData[mapLayerKey] = {
         data: []
      }
      var xTile = coord.x 
      var yTile = coord.y
      var singleTilePromise = this.tileDataService.getTileData(mapLayer, zoom, xTile, yTile)
      singleTilePromises.push(singleTilePromise)
      var globalIndex = singleTilePromises.length - 1
      globalIndexToLayer[globalIndex] = mapLayerKey
    })

    return Promise.all(singleTilePromises)
    .then((singleTileResults) => {
      singleTileResults.forEach((singleTileResult, index) => {
        var mapLayerKey = globalIndexToLayer[index]
        renderingData[mapLayerKey].data[index] = singleTileResult
      })
      //console.log(renderingData)      

      // all features
      Object.keys(renderingData).forEach((mapLayerKey) => {
        var mapLayer = this.tileDataService.mapLayers[mapLayerKey]
        if (mapLayer) {
          renderingData[mapLayerKey].data.forEach((featureData, index) => {
            var features = []
            Object.keys(featureData.layerToFeatures).forEach((layerKey) => features = features.concat(featureData.layerToFeatures[layerKey]))
            
            const filteredFeatures = mapLayer.featureFilter ? features.filter(mapLayer.featureFilter) : features

            for (var iFeature = 0; iFeature < filteredFeatures.length; ++iFeature) {
              // Parse the geometry out.
              var feature = filteredFeatures[iFeature]

              if (feature.properties &&
                feature.properties.object_id &&
                this.utils.getObjectSize(this.clliToequipmentInfo) <= this.MAX_Equipment_List) {
                this.clliToequipmentInfo[feature.properties.object_id] = feature.properties
              }
            }
          })
        }
      })
      this.$timeout()
    })
  }

  refreshEquipmentList() {
    //refresh only in equipment list view
    if(this.state.activeViewModePanel === this.state.viewModePanels.EQUIPMENT_INFO) {
      this.clliToequipmentInfo = {}
      this.$timeout(this.getVisibleEquipmentIds(),500)
    }
  }

  addMapListeners() {
    if (this.mapRef) {
      this.mapRef.addListener('dragend', () => this.refreshEquipmentList())
    }
  }

  removeMapListeners() {
    google.maps.event.clearListeners(this.mapRef, 'dragend');
  }

  $onInit() {
    this.mapRef = window[this.mapGlobalObjectName]
    this.getVisibleEquipmentIds()
    this.addMapListeners()
  }

  $onDestroy() {
    // Cleanup subscriptions
    this.clliToequipmentInfo = {}
    this.mapLayersChangeSubscription.unsubscribe()
    this.removeMapListeners()
  }
}

EquipmentDetailListController.$inject = ['$timeout', 'state', 'tileDataService', 'Utils']

let equipmentDetailList = {
  templateUrl: '/components/sidebar/view/equipment-detail-list.html',
  bindings: {
    mapGlobalObjectName: '@',
    viewSelectedDetails: '&'
  },
  controller: EquipmentDetailListController
}

export default equipmentDetailList