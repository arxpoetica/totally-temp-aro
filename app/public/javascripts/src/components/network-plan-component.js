app.component('networkPlan', {
  template: `
  <style scoped>

    .network-plan {
      top: 0px;
      white-space: nowrap;
      right: 0px;
      position: absolute;
      background: #1a79db;
      padding: 7px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }

    .network-plan-load {
      font-size: 25px;
      padding-left: 10px;
      padding-right: 10px;
      line-height: 46px;
      cursor: pointer;
    }

    .network-plan:hover, .network-plan-load:hover, .network-plan span:hover {
      color: #ccc
    }
    
  </style>

  <div class="network-plan">
    <div class="network-plan-load" ng-click="showNetworkPlanModal()">
      <span ng-if="state.planName">{{state.planName}}</span>
      <span ng-if="!state.planName"><i class="fa fa-plus f-select-plan" style="font-size: 12px"></i> Select a plan</span>
    </div>
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