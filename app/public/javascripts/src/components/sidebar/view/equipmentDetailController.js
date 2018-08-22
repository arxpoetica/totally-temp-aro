import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'
import MapUtilities from '../../common/plan/map-utilities';
import TileUtilities from '../../tiles/tile-utilities'

class EquipmentDetailController {

	constructor($http, $timeout, state, configuration, tileDataService, Utils) {
    this.angular = angular
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.configuration = configuration
    this.tileDataService = tileDataService
    this.Utils = Utils
    this.networkNodeType = ''
    this.selectedEquipmentInfo = {}
    this.clliToequipmentInfo = {}
    this.selectedEquipment = ''
    
    this.headerIcon = ''
    this.networkNodeLabel = ''

    this.EquipmentDetailView = Object.freeze({
      List: 0,
      Detail: 1
    })
    this.currentEquipmentDetailView = this.EquipmentDetailView.List
    
    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    this.mapFeatureSelectedSubscriber = state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      // most of this function is assuring the properties we need exist. 
      // In ruler mode click should not perform any view action's
      if (!this.state.allowViewModeClickAction()) return
      if (!options.hasOwnProperty('equipmentFeatures')) return
      if (0 == options.equipmentFeatures.length) return
      
      this.selectedEquipment = ''
      var equipmentList = options.equipmentFeatures
      if (equipmentList.length > 0) {
        const equipment = equipmentList[0]
        this.updateSelectedState(equipment)
        const plan = state.plan.getValue()
        this.displayEquipment(plan.id, equipment.object_id)
      }
    })
    
    this.clearViewModeSubscription = state.clearViewMode.subscribe((clear) => {
      if(clear){
        this.clearSelection()
      }
    })
  }

	clearSelection(){
    this.networkNodeType = ''
    this.selectedEquipmentInfo = {}
    this.updateSelectedState()
    this.currentEquipmentDetailView = this.EquipmentDetailView.List
  }
 
	updateSelectedState(selectedFeature){
	  // tell state
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.equipment = {}
	  if ('undefined' != typeof selectedFeature) selectedViewFeaturesByType.equipment[selectedFeature.object_id || selectedFeature.objectId] = selectedFeature
    this.state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
	}
	
	displayEquipment(planId, objectId){
	  return this.$http.get(`/service/plan-feature/${planId}/equipment/${objectId}?userId=${this.state.loggedInUser.id}`)
    .then((result) => {
      const equipmentInfo = result.data
      if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')){
        if (this.configuration.networkEquipment.equipments.hasOwnProperty(equipmentInfo.networkNodeType)){
          this.headerIcon = this.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].iconUrl
          this.networkNodeLabel = this.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].label
        }else{
          // no icon
          this.headerIcon = ''
          this.networkNodeLabel = equipmentInfo.networkNodeType
        }
        
        this.networkNodeType = equipmentInfo.networkNodeType
        this.selectedEquipmentGeog = equipmentInfo.geometry.coordinates
        
        this.selectedEquipmentInfo = AroFeatureFactory.createObject(equipmentInfo).networkNodeEquipment
        this.currentEquipmentDetailView = this.EquipmentDetailView.Detail
        
        this.state.activeViewModePanel = this.state.viewModePanels.EQUIPMENT_INFO
        this.$timeout()
      }else{
        this.clearSelection()
      }
      return equipmentInfo
    }).catch((err) => {
      console.error(err)
    })
	}

  viewSelectedEquipment(selectedEquipment) {
    var plan = this.state.plan.getValue()
    this.updateSelectedState(selectedEquipment)
    this.displayEquipment(plan.id, selectedEquipment.objectId).then((equipmentInfo) => {
      if ("undefined" != typeof equipmentInfo){
        map.setCenter({ lat: this.selectedEquipmentGeog[1], lng: this.selectedEquipmentGeog[0] })
      }
    })
  }

  getVisibleEquipmentIds() {
    this.getVisibleTileIds()
  }

  getVisibleTileIds() {
    // Use the code in tile to fetch visible tile id's, redendunt for now
    if (!this.mapRef || !this.mapRef.getBounds()) {
      return
    }
    var visibleTiles = []
    visibleTiles = MapUtilities.getVisibleTiles(this.mapRef)    

    visibleTiles.forEach((tile) => {
      var tileId = TileUtilities.getTileId(tile.zoom, tile.x, tile.y)
      var cachedTile = this.tileDataService.tileHtmlCache[tileId]
      if (cachedTile) {
        var coord = { x: tile.x, y: tile.y }
        //fetch tile data
        this.getVisibleTileData(tile.zoom, coord)
      }
    })
  }

  getVisibleTileData(zoom, coord) {
    var renderingData = {}, globalIndexToLayer = {}, globalIndexToIndex = {}
    var singleTilePromises = []
    var mapLayers = TileUtilities.getOrderedKeys(this.tileDataService.mapLayers, 'zIndex', 0)
    mapLayers.forEach((mapLayerKey, index) => {
      // Initialize rendering data for this layer
      var mapLayer = this.tileDataService.mapLayers[mapLayerKey]
      var numNeighbors = 1
      renderingData[mapLayerKey] = {
      //   numNeighbors: numNeighbors,
         dataPromises: [],
         data: [],
      //   entityImages: [],
      //   dataOffsets: []
      }

      for (var deltaY = -numNeighbors; deltaY <= numNeighbors; ++deltaY) {
        for (var deltaX = -numNeighbors; deltaX <= numNeighbors; ++deltaX) {
          // renderingData[mapLayerKey].dataOffsets.push({
          //   x: deltaX * this.tileSize.width,
          //   y: deltaY * this.tileSize.height
          // })
          var xTile = coord.x + deltaX
          var yTile = coord.y + deltaY
          var singleTilePromise = this.tileDataService.getTileData(mapLayer, zoom, xTile, yTile)
          singleTilePromises.push(singleTilePromise)
          renderingData[mapLayerKey].dataPromises.push(singleTilePromise)
          var globalIndex = singleTilePromises.length - 1
          var localIndex = renderingData[mapLayerKey].dataPromises.length - 1
          globalIndexToIndex[globalIndex] = localIndex
          globalIndexToLayer[globalIndex] = mapLayerKey
        }
      }
    })

    return Promise.all(singleTilePromises)
    .then((singleTileResults) => {
      var singleTile_visibleEqu = new Set()
      singleTileResults.forEach((singleTileResult, index) => {
        var mapLayerKey = globalIndexToLayer[index]
        var dataIndex = globalIndexToIndex[index]
        renderingData[mapLayerKey].data[dataIndex] = singleTileResult
      })

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

              if (feature.properties && feature.properties.object_id) {
                singleTile_visibleEqu.add(feature.properties.object_id)
              }
            } 

          })
        }
      })

      this.getVisibleEquipmentDetails(singleTile_visibleEqu)
    })
  }

  getVisibleEquipmentDetails(visibleEquipmentsInTile) {
    
    let visibleEquipmentObjectIdsInTile = [...visibleEquipmentsInTile];
    var promises = []
    while(visibleEquipmentObjectIdsInTile.length) {
      var filter = `(planId eq ${this.state.plan.getValue().id}) and (`
      visibleEquipmentObjectIdsInTile.splice(0,50).forEach((visibleEquipmentObjectIdInTile, index) => {
        if (index > 0) {
          filter += ' or '
        }
        filter += ` (objectId eq guid'${visibleEquipmentObjectIdInTile}')`
      })

      filter += `)`
      //Dont request if UI is displaying 100 equipments
      if (this.Utils.getObjectSize(this.clliToequipmentInfo) <= 100) {
        promises.push(this.$http.get(`/service/odata/NetworkEquipmentEntity?$select=id,clli,objectId,networkNodeType&$filter=${filter}&$top=100`))
      }
    }

    return Promise.all(promises)
    .then((results) => {
      results.forEach((result) => {
        result.data.forEach((equipmentInfo) => {
          if (this.Utils.getObjectSize(this.clliToequipmentInfo) <= 100) {
            this.clliToequipmentInfo[equipmentInfo.objectId] = equipmentInfo
          }
        })
        //console.log(this.clliToequipmentInfo)
      })
      this.$timeout()
    })
  }

  addMapListeners() {
    if (this.mapRef) {
      this.mapRef.addListener('center_changed', () => {
        //refresh only in equipment list view
        if(this.currentEquipmentDetailView === this.EquipmentDetailView.List) {
          this.clliToequipmentInfo = {}
          this.getVisibleEquipmentIds()
        } 
      })
      this.mapRef.addListener('zoom_changed', () => {
        //refresh only in equipment list view
        if(this.currentEquipmentDetailView === this.EquipmentDetailView.List) {
          this.clliToequipmentInfo = {}
          this.getVisibleEquipmentIds()
        }
      })
    }
  }

  removeMapListeners() {
    //google.maps.event.clearListeners(this.mapRef, 'center_changed');
    //google.maps.event.clearListeners(this.mapRef, 'zoom_changed');    
  }

  $onInit() {
    this.mapRef = window["map"]
    this.getVisibleEquipmentIds()
    this.addMapListeners()
    this.visibleEquipmentIds = new Set()
  }

  $onDestroy() {
    // Cleanup subscriptions
    this.visibleEquipmentIds = new Set()
    this.mapFeatureSelectedSubscriber.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
    this.removeMapListeners()
  }
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state', 'configuration', 'tileDataService', 'Utils']

export default EquipmentDetailController