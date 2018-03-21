import EquipmentDetailController from './equipmentDetailController';

let equipmentDetail = {
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
}

export default equipmentDetail