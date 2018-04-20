class EquipmentDetailController {

	constructor($http, $timeout, state) {
    this.$http = $http
    this.state = state
    this.selectedEquipmentInfo = null
    this.debug_testObj = {
      "General": {
        "Site Name": "Fenske Rd", 
        "Site CLLI": "PCVLWIAC", 
        "Site Type": "Remote Terminal", 
        "Site Deployment Date": "10/2013", 
        "Latitude": "43.60396", 
        "Longitude": "-89.23765", 
        "Fiber Availability": "Not Available", 
        "": "0.15 MI N/ ROSS RD ON FENSKE RD, PARDEEVILLE, 53954", 
        "Is Physically Linked": "Yes", 
        "CAF Phase": "Phase I - Part I", 
        "DPI Environment": "CW", 
        "HSI Office Code": "VSFEN", 
        "T1": "No", 
        "Notes": "Bonded"
      }, 
      "Equipment": {
        "Equipment Count": "2", 
        "Technologies": {
          "": "ADSL (32.416 Mbps max speed)", 
          "": "ADSL2+ (32.416 Mbps max speed)", 
          "": "ADSL2+P (32.416 Mbps max speed)", 
          "": "ADSL-B (32.416 Mbps max speed)"
        }, 
        "Equipment 1": {
          "Equipment CLLI": "PDVLWIACRL0", 
          "Technology": "", 
          "Deployment Date": "10/2013", 
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
          "Equipment CLLI": "PDVLWIACH00", 
          "Technology": "", 
          "Deployment Date": "10/2013", 
          "Equipment Type": "ADTRAN TA 1148A IP/HSI - FIBER", 
          "Deployment Cost": "", 
          "Quantity": "1", 
          "Switch Type": "DSLAM", 
          "Max Speed": "32.416", 
          "Latency": "Unknown", 
          "Uplink Speed": "Unknown", 
          "Subject To Site Boundaries": "Yes", 
          "Marketable Technologies": {
            "": "ADSL", 
            "": "ADSL2+", 
            "": "ADSL2+P", 
            "": "ADSL-B"
          }, 
          "Congestion": ""
        } 
      }
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

}

EquipmentDetailController.$inject = ['$http', '$timeout', 'state']

export default EquipmentDetailController