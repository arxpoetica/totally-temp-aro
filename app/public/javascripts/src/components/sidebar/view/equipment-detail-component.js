class EquipmentDetailController {

  constructor($http,$timeout,state) {
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
}

EquipmentDetailController.$inject = ['$http','$timeout','state']

app.component('equipmentDetail', {
  template: `
  <style scoped>
    .equipment-detail {
      position: relative; /* This will require the parent to have position: relative or absolute */
    }
    .equipment-detail > div {
      margin-top: 10px;
    }
  </style>
  <div class="equipment-detail" ng-if="$ctrl.selectedEquipmentInfo !== null">
    <div>id: {{$ctrl.selectedEquipmentInfo.id}}</div>
    <div>Type: {{$ctrl.selectedEquipmentInfo.description}}</div>
    <div>location: {{$ctrl.selectedEquipmentInfo.geog.coordinates}}</div>
  </div>
  `,
  bindings: {},
  controller: EquipmentDetailController
})