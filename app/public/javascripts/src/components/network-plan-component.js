app.component('networkPlan', {
  template: `
  <style scoped>

    .network-plan {
      top: 0px;
      white-space: nowrap;
      right: 0px;
      position: absolute;
      background: rgba(50, 50, 50, 0.7);
      font-size: 20px;
      padding-left: 10px;
      padding-right: 10px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      cursor: pointer;
      color: white;
    }

    .network-plan:hover, .network-plan:hover, .network-plan span:hover {
      color: #ccc
    }
    
  </style>

  <div class="network-plan" ng-click="showNetworkPlanModal()">
    <span ng-if="state.planName">{{state.planName}}</span>
    <span ng-if="!state.planName"><i class="fa fa-plus f-select-plan" style="font-size: 12px"></i> Select a plan</span>
  </div>
  `,
  bindings: {},
  controller: [ '$scope', 'state', ($scope, state) => {
    $scope.planName;

    $scope.showNetworkPlanModal = () => {
      state.networkPlanModal.next(true)
    }
  }]

})