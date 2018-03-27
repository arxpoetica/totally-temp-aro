class EquipmentDetailController {

	constructor($http, $timeout, state) {
    this.$http = $http
    this.state = state
    this.selectedEquipmentInfo = null

    state.mapFeaturesSelectedEvent.subscribe((options) => {
      var equipmentId = null
      if (options.equipmentFeatures && options.equipmentFeatures.length > 0 && options.equipmentFeatures[0].id) {
        state.activeViewModePanel = state.viewModePanels.EQUIPMENT_INFO
        $timeout()
        equipmentId = options.equipmentFeatures[0].id;

        //this.selectedEquipmentInfo = options.equipmentFeatures[0]
        this.getEquipmentInfo(equipmentId)
          .then((equipmentInfo) => {
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