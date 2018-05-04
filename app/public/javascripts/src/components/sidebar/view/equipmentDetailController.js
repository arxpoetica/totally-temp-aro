import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
import EquipmentFeature from '../../../service-typegen/dist/EquipmentFeature'

class EquipmentDetailController {

	constructor($http, $timeout, state) {
    this.$http = $http
    this.state = state
    this.selectedEquipmentInfo = {}
    this.selectedEquipmentInfoChanges = {}
    this.selectedEquipmentInfoDispProps = {}
    
    this.isEdit = false
    // ToDo: get all this dynamically 
    this.headerIcon = "/images/map_icons/aro/remote_terminal.png"
    /*
    this.treeData = {
      "General": {
        "summary": {
          "Site Name": "Fenske Rd", 
          "Site CLLI": "PCVLWIAC", 
          "Site Type": "Remote Terminal", 
          "Site HSI Deployment Date": "10/2013", 
          "Latitude": "43.60396", 
          "Longitude": "-89.23765", 
          "Fiber Availability": "Not Available" 
        }, 
        "Location": "0.15 MI N/ ROSS RD ON FENSKE RD, PARDEEVILLE, 53954", 
        "Is Physically Linked": "Yes", 
        "CAF Phase": "Phase I - Part I", 
        "DPI Environment": "CW", 
        "HSI Office Code": "VSFEN", 
        "T1": "No", 
        "Notes": "Bonded"
      }, 
      "Equipment": {
        "summary": {
          "Equipment Count": "2", 
          "Technology 1": "ADSL (32.416 Mbps max speed)", 
          "Technology 2": "ADSL2+ (32.416 Mbps max speed)", 
          "Technology 3": "ADSL2+P (32.416 Mbps max speed)", 
          "Technology 4": "ADSL-B (32.416 Mbps max speed)"
        },
        "Equipment 1": {
          "summary": {
            "Equipment CLLI": "PDVLWIACRL0", 
            "Technology": "", 
            "HSI Deployment Date": "10/2013", 
          }, 
          "Equipment Type": "SIEMENS MLC24/DLC", 
          "Deployment Cost": "", 
          "Quantity": "1", 
          "Switch Type": "Pair Gain", 
          "Max Speed": "Unrestricted", 
          "Latency": "Unknown", 
          "Uplink Speed": "Unknown", 
          "Subject To Site Boundaries": "Yes", 
          "Marketable Technologies": "", 
          "Congestion": ""
        }, 
        "Equipment 2": {
          "summary": {
            "Equipment CLLI": "PDVLWIACH00", 
            "Technology": "", 
            "HSI Deployment Date": "10/2013", 
          }, 
          "Equipment Type": "ADTRAN TA 1148A IP/HSI - FIBER", 
          "Deployment Cost": "", 
          "Quantity": "1", 
          "Switch Type": "DSLAM", 
          "Max Speed": "32.416", 
          "Latency": "Unknown", 
          "Uplink Speed": "Unknown", 
          "Subject To Site Boundaries": "Yes", 
          "Marketable Technologies": {
            "1": "ADSL", 
            "2": "ADSL2+", 
            "3": "ADSL2+P", 
            "4": "ADSL-B"
          }, 
          "Congestion": ""
        } 
      }
    }
    this.treeState = angular.copy(this.treeData)
    
    this.rowsData = [
      {
        "equipmentCLLI": "PDVLWIACRL0", 
        "pathBand": "none", 
        "uplinkSpeed": "unknown", 
        "topology": "none", 
        "pathHops": 2
      }, 
      {
        "equipmentCLLI": "PDVLWIACH00", 
        "pathBand": "high", 
        "uplinkSpeed": "unknown", 
        "topology": "path", 
        "pathHops": 3
      }, 
      {
        "equipmentCLLI": "null test", 
        "pathHops": 4
      } 
    ]
    this.rowsState = angular.copy(this.rowsData)
    
    this.tableViewStructure = {
        "title": "Congestion", 
        "editSwitch": "isEdit", 
        "canAdd": true,  
        "cols": [
          {
            "label": "Equipment CLLI", 
            "property": "equipmentCLLI", 
            "defaultVal": "default CLLI", 
            "editType": "false"
          }, 
          {
            "label": "Path Band", 
            "property": "pathBand", 
            "defaultVal": "none", 
            "editType": "select", 
            "editorData": ['none', 'high', 'option 2']
          }, 
          {
            "label": "Uplink Speed", 
            "property": "uplinkSpeed", 
            "editType": "text"
          }, 
          {
            "label": "Topology", 
            "property": "topology", 
            "defaultVal": "", 
            "editType": "text"
          }, 
          {
            "label": "Path Hops", 
            "property": "pathHops", 
            "defaultVal": 2, 
            "editType": "number"
          }
        ],
        "rows": this.rowsState
    }
    */
    
    
    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      // most of this funcltion is assuring the properties we need exist. 
      // ToDo: the feature selection system could use some refactoring 
      if (!options.hasOwnProperty('equipmentFeatures')) return
      if (0 == options.equipmentFeatures.length) return
      
      var plan = state.plan.getValue()
      if (!plan || !plan.hasOwnProperty('id')) return
      
      
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
        console.log(selectedFeature)
        this.updateSelectedState(selectedFeature, featureId)
        this.displayEquipment(plan.id, selectedFeature.object_id)
      }
    })
    
    
    
    state.clearViewMode.subscribe((clear) => {
      if(clear){
        this.selectedEquipmentInfo = {}
        this.selectedEquipmentInfoChanges = {}
        this.selectedEquipmentInfoDispProps = {}
      }
    })
  }
	
	
	
	getEquipmentInfo(planId, objectId){
	  return this.$http.get('/service/plan-feature/'+planId+'/equipment/'+objectId).then((response) => {
      return response.data
    })
	}
	
	/*
  getEquipmentInfo(equipmentId) {
    return this.$http.get('/network/nodes/' + equipmentId + '/details').then((response) => {
      return response.data
    })
  }
  */
	
	/*
  showDetailEquipmentInfo() {
    this.selectedEquipmentInfo.id = +this.selectedEquipmentInfo.id   
    this.state.showDetailedEquipmentInfo.next(this.selectedEquipmentInfo)
  }
  */
  
	updateSelectedState(selectedFeature, featureId){
	  // tell state
    var selectedViewFeaturesByType = this.state.selectedViewFeaturesByType.getValue()
    selectedViewFeaturesByType.equipment = {}
    selectedViewFeaturesByType.equipment[ featureId ] = selectedFeature
    this.state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
	}
	
	displayEquipment(planId, objectId){
	  console.log(planId)
	  console.log(objectId)
	  return this.getEquipmentInfo(planId, objectId).then((equipmentInfo) => {
      console.log(equipmentInfo)
      if (equipmentInfo.hasOwnProperty('dataType') && equipmentInfo.hasOwnProperty('objectId')){
        this.selectedEquipmentInfo = equipmentInfo
        this.selectedEquipmentInfoDispProps = AroFeatureFactory.createObject(equipmentInfo).getDisplayProperties()
        
        
        //this.selectedEquipmentInfo = AroFeatureFactory.createObject(equipmentInfo)
        //this.selectedEquipmentInfoDispProps = this.selectedEquipmentInfo.getDisplayProperties()
        
        angular.copy(this.selectedEquipmentInfo, this.selectedEquipmentInfoChanges)
        
        console.log('=== DISP INFO ===')
        console.log(this.selectedEquipmentInfo)
        console.log(this.selectedEquipmentInfoDispProps)
        
        this.state.activeViewModePanel = this.state.viewModePanels.EQUIPMENT_INFO
        $timeout()
      }
      //return equipmentInfo
    })
	}
	
  //ToDo: these perhaps get moved to the UI component 
  beginEdit(){
    // set up listeners etc
    this.isEdit = true
  }
  
  cancelEdit(){
    // return the object to init state
    //angular.copy(this.treeData, this.treeState)
    //angular.copy(this.rowsData, this.rowsState)
    angular.copy(this.selectedEquipmentInfo, this.selectedEquipmentInfoChanges)
    this.isEdit = false
  }
  
  commitEdit(){
    // set the object to the edited object and tell the DB
    // may need to compare to check for deletes and creates 
    //angular.copy(this.treeState, this.treeData)
    //angular.copy(this.rowsState, this.rowsData)
    angular.copy(this.selectedEquipmentInfoChanges, this.selectedEquipmentInfo)
    this.isEdit = false
    console.log('send changed data to DB:')
    console.log(this.selectedEquipmentInfo)
  }

  viewSelectedEquipment(selectedEquipment) {
    console.log(selectedEquipment)
    
    var plan = this.state.plan.getValue()
    //if (!plan || !plan.hasOwnProperty('id')) return
    this.updateSelectedState(selectedEquipment, selectedEquipment.id)
    console.log(map)
    this.displayEquipment(plan.id, selectedEquipment.objectId)
    .then(() => map.setCenter({ lat: this.selectedEquipmentInfo.geog.coordinates[1], lng: this.selectedEquipmentInfo.geog.coordinates[0] }))
    
    
  }
  
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state']

export default EquipmentDetailController