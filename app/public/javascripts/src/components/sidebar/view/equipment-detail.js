import EquipmentDetailController from './equipmentDetailController';

let equipmentDetail = {
  /*
  template: `
  <style scoped>
    .equipment-detail {
      position: relative; /* This will require the parent to have position: relative or absolute 
    }
    .equipment-detail > div {
      margin-top: 10px;
    }
  </style>
  <div class="equipment-detail" ng-if="$ctrl.selectedEquipmentInfo !== null">
    <div>id: {{$ctrl.selectedEquipmentInfo.id}}</div>
    <div>Type: {{$ctrl.selectedEquipmentInfo.description}}</div>
    <div>Latitude: {{$ctrl.selectedEquipmentInfo.geog.coordinates[1] | number:5}}</div>
    <div>Longitude: {{$ctrl.selectedEquipmentInfo.geog.coordinates[0] | number:5}}</div>
    <div>
      <button class="btn btn-primary" ng-click="$ctrl.showDetailEquipmentInfo()">More Information</button>
    </div>
  </div>
  `,
  */
  templateUrl: '/components/sidebar/view/equipment-detail.html',
  bindings: {},
  controller: EquipmentDetailController
}

export default equipmentDetail