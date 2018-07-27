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
    //this.selectedEquipmentInfoChanges = {}
    //this.selectedEquipmentInfoDispProps = []
    
    //this.isEdit = false
    this.headerIcon = '' //"/images/map_icons/aro/remote_terminal.png"
    this.networkNodeLabel = ''
    
    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      // most of this function is assuring the properties we need exist. 
      //In ruler mode click should not perform any view action's
      if(this.state.allowViewModeClickAction()) {  
        if (!options.hasOwnProperty('equipmentFeatures')) return
        if (0 == options.equipmentFeatures.length) return
        
        var plan = state.plan.getValue()
        if (!plan || !plan.hasOwnProperty('id')) return
        
        this.selectedEquipment = ''
        var equipmentList = options.equipmentFeatures
        var selectedFeature = null
        var featureId = null
        for (var featureI = 0; featureI < equipmentList.length; featureI++){
          var feature = equipmentList[featureI]
          if (feature.hasOwnProperty('object_id')){
          
            if ( feature.hasOwnProperty('id') ){
              featureId = feature.id
            }else if ( feature.hasOwnProperty('location_id') ){
              featureId = feature.location_id
            }
            
            if (null != featureId){
              selectedFeature = feature
              break
            }
          }
        }
        
        if (null != selectedFeature){
          this.updateSelectedState(selectedFeature, featureId)
          this.displayEquipment(plan.id, selectedFeature.object_id)
        }
      }
    })
    
    
    state.clearViewMode.subscribe((clear) => {
      if(clear){
        this.clearSelection()
      }
    })
  }
	
	
	// ----- //
	
	
	clearSelection(){
    this.networkNodeType = ''
    this.selectedEquipmentInfo = {}
    this.updateSelectedState()
  }
 
	updateSelectedState(selectedFeature, featureId){
	  // tell state
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.equipment = {}
    if ('undefined' != typeof selectedFeature && 'undefined' != typeof featureId){
      selectedViewFeaturesByType.equipment[ featureId ] = selectedFeature
    }
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
          
          try{ // because ANYTHING that goes wrong in an RX subscription will fail silently (ugggh) 
            this.selectedEquipmentInfo = AroFeatureFactory.createObject(equipmentInfo).networkNodeEquipment
          }catch(error) {
            console.error(error) 
            return
          }
          
          this.state.activeViewModePanel = this.state.viewModePanels.EQUIPMENT_INFO
          this.$timeout()
        }else{
          this.clearSelection()
        }
        return equipmentInfo
      })
	}
	
  // ---
  
  viewSelectedEquipment(selectedEquipment) {
    var plan = this.state.plan.getValue()
    this.updateSelectedState(selectedEquipment, selectedEquipment.id)
    this.displayEquipment(plan.id, selectedEquipment.objectId).then((equipmentInfo) => {
      if ("undefined" != typeof equipmentInfo){
        map.setCenter({ lat: this.selectedEquipmentGeog[1], lng: this.selectedEquipmentGeog[0] })
      }
    })
  }
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state', 'configuration']

export default EquipmentDetailController