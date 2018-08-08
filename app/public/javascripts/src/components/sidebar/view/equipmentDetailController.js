import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'


class EquipmentDetailController {

	constructor($http, $timeout, state, configuration) {
    this.angular = angular
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.configuration = configuration
    this.networkNodeType = ''
    this.selectedEquipmentInfo = {}
    this.selectedEquipment = ''
    
    this.headerIcon = ''
    this.networkNodeLabel = ''
    
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

      // TODO - Parag: Keeping this code here very temporarily. Delete it after getting confirmation on object ids.
      //   var selectedFeature = null
      //   var featureId = null
      //   for (var featureI = 0; featureI < equipmentList.length; featureI++){
      //     var feature = equipmentList[featureI]
      //     if (feature.hasOwnProperty('object_id')){
          
      //       if ( feature.hasOwnProperty('id') ){
      //         featureId = feature.id
      //       }else if ( feature.hasOwnProperty('location_id') ){
      //         featureId = feature.location_id
      //       }
            
      //       if (null != featureId){
      //         selectedFeature = feature
      //         break
      //       }
      //     }
      //   }
        
      //   if (null != selectedFeature){
      //     this.updateSelectedState(selectedFeature, featureId)
      //     this.displayEquipment(plan.id, selectedFeature.object_id)
      //   }
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
  }
 
	updateSelectedState(selectedFeature){
	  // tell state
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.equipment = {}
    selectedViewFeaturesByType.equipment[selectedFeature.object_id] = selectedFeature
    this.state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
	}
	
	displayEquipment(planId, objectId){
    return this.$http.get(`/service/plan-feature/${planId}/equipment/${objectId}?userId=${this.state.loggedInUser.id}`)
    .then((result) => {
      const equipmentInfo = result.data
      //console.log(equipmentInfo)
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
	
  // ---
  
  viewSelectedEquipment(selectedEquipment) {
    var plan = this.state.plan.getValue()
<<<<<<< HEAD
    this.updateSelectedState(selectedEquipment)
=======
    //console.log(selectedEquipment)
    this.updateSelectedState(selectedEquipment, selectedEquipment.id)
>>>>>>> master
    this.displayEquipment(plan.id, selectedEquipment.objectId).then((equipmentInfo) => {
      if ("undefined" != typeof equipmentInfo){
        map.setCenter({ lat: this.selectedEquipmentGeog[1], lng: this.selectedEquipmentGeog[0] })
      }
    })
  }

  $onDestroy() {
    // Cleanup subscriptions
    this.mapFeatureSelectedSubscriber.unsubscribe()
    this.clearViewModeSubscription.unsubscribe()
  }

}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state', 'configuration']

export default EquipmentDetailController