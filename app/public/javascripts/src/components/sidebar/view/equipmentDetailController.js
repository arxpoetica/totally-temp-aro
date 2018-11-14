import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'

class EquipmentDetailController {
  
	constructor($http, $timeout, state) {
    this.angular = angular
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.networkNodeType = ''
    this.selectedEquipmentInfo = {}
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
      if (!this.state.StateViewMode.allowViewModeClickAction(this.state)) return
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
    var newSelection = this.state.cloneSelection(this.state.selection)
    newSelection.editable.equipment = {}
	  if ('undefined' != typeof selectedFeature) {
      newSelection.editable.equipment[selectedFeature.object_id || selectedFeature.objectId] = selectedFeature
    }
    this.state.selection = newSelection
	}
	
	displayEquipment(planId, objectId){
	  return this.$http.get(`/service/plan-feature/${planId}/equipment/${objectId}?userId=${this.state.loggedInUser.id}`)
    .then((result) => {
      const equipmentInfo = result.data
      if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')){
        if (this.state.configuration.networkEquipment.equipments.hasOwnProperty(equipmentInfo.networkNodeType)){
          this.headerIcon = this.state.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].iconUrl
          this.networkNodeLabel = this.state.configuration.networkEquipment.equipments[equipmentInfo.networkNodeType].label
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

  viewSelectedEquipment(selectedEquipment,isZoom) {
    var plan = this.state.plan.getValue()
    var objectId = selectedEquipment.objectId || selectedEquipment.object_id
    this.updateSelectedState(selectedEquipment)
    this.displayEquipment(plan.id, objectId).then((equipmentInfo) => {
      if ("undefined" != typeof equipmentInfo){
        map.setCenter({ lat: this.selectedEquipmentGeog[1], lng: this.selectedEquipmentGeog[0] })
        const ZOOM_FOR_EQUIPMENT_SEARCH = 14
        isZoom && this.state.requestSetMapZoom.next(ZOOM_FOR_EQUIPMENT_SEARCH)
      }
    })
  }

  $onDestroy() {
    // Cleanup subscriptions
    this.mapFeatureSelectedSubscriber.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
  }
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state']

export default EquipmentDetailController