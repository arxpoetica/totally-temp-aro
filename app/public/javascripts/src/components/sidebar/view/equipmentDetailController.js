class EquipmentDetailController {

	constructor($http, $timeout, state) {
    this.$http = $http
    this.state = state
    this.selectedEquipmentInfo = null
    
    this.isEdit = false
    // ToDo: get all this dynamically 
    this.headerIcon = "/images/map_icons/aro/remote_terminal.png"
    
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
    
    
    
    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      var equipmentList = []
      if (options.hasOwnProperty('equipmentFeatures')) equipmentList = options.equipmentFeatures
      
      var equipmentId = null
      
      if (options.equipmentFeatures && options.equipmentFeatures.length > 0 && options.equipmentFeatures[0].id) {
        var selectedViewFeaturesByType = state.selectedViewFeaturesByType.getValue()
        selectedViewFeaturesByType.equipment = equipmentList
        state.reloadSelectedViewFeaturesByType(selectedViewFeaturesByType)
        
        state.activeViewModePanel = state.viewModePanels.EQUIPMENT_INFO
        $timeout()
        equipmentId = options.equipmentFeatures[0].id;

        //this.selectedEquipmentInfo = options.equipmentFeatures[0]
        this.getEquipmentInfo(equipmentId)
          .then((equipmentInfo) => {
            //console.log(equipmentInfo)
            this.selectedEquipmentInfo = equipmentInfo
          })
      }
    })
  }

  getEquipmentInfo(equipmentId) {
    return this.$http.get('/network/nodes/' + equipmentId + '/details')
    .then((response) => {
      return response.data
    })
  }

  showDetailEquipmentInfo() {
    this.selectedEquipmentInfo.id = +this.selectedEquipmentInfo.id   
    this.state.showDetailedEquipmentInfo.next(this.selectedEquipmentInfo)
  }
  
  
  //ToDo: these perhaps get moved to the UI component 
  beginEdit(){
    // set up listeners etc
    this.isEdit = true
  }
  
  cancelEdit(){
    // return the object to init state
    angular.copy(this.treeData, this.treeState)
    angular.copy(this.rowsData, this.rowsState)
    this.isEdit = false
  }
  
  commitEdit(){
    // set the object to the edited object and tell the DB
    // may need to compare to check for deletes and creates 
    angular.copy(this.treeState, this.treeData)
    angular.copy(this.rowsState, this.rowsData)
    this.isEdit = false
    console.log('send changed data to DB:')
    console.log(this.treeData)
    console.log(this.rowsData)
  }
  
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state']

export default EquipmentDetailController