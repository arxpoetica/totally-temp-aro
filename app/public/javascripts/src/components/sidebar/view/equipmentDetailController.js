class EquipmentDetailController {

	constructor($http, $timeout, state) {
    this.$http = $http
    this.state = state
    this.selectedEquipmentInfo = null
    
    this.isEdit = false
    
    this.debug_testObj = {
      "General": {
        "summary": {
          "Site Name": "Fenske Rd", 
          "Site CLLI": "PCVLWIAC", 
          "Site Type": "Remote Terminal", 
          "Site Deployment Date": "10/2013", 
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
            "Deployment Date": "10/2013", 
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
            "Deployment Date": "10/2013", 
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
    
    this.testCongestion = [
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
    
    this.tableViewStructure = {
        "editSwitch": "isEdit", 
        "cols": [
          {
            "label": "Equipment CLLI", 
            "property": "equipmentCLLI", 
            "editType": "false"
          }, 
          {
            "label": "Path Band", 
            "property": "pathBand", 
            "editType": "select", 
            "selectOptions": ['none', 'high', 'option 2']
          }, 
          {
            "label": "Uplink Speed", 
            "property": "uplinkSpeed", 
            "editType": "text"
          }, 
          {
            "label": "Topology", 
            "property": "topology", 
            "editType": "text"
          }, 
          {
            "label": "Path Hops", 
            "property": "pathHops", 
            "editType": "number"
          }
        ],
        "rows": this.testCongestion
    }
    
    
    
    // Skip the first event as it will be the existing value of mapFeaturesSelectedEvent
    state.mapFeaturesSelectedEvent.skip(1).subscribe((options) => {
      var equipmentId = null
      if (options.equipmentFeatures && options.equipmentFeatures.length > 0 && options.equipmentFeatures[0].id) {
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
  
  
  //these perhaps get moved to the UI component 
  beginEdit(){
    // set up listeners etc
    this.isEdit = true
  }
  
  cancelEdit(){
    // retrun the object to init state
    this.isEdit = false
  }
  
  commitEdit(){
    // set the object to the edited object and tell the DB
    this.isEdit = false
    console.log(this.testCongestion)
  }
  
}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state']

export default EquipmentDetailController