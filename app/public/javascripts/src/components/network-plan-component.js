app.component('networkPlan', {
  template: `
  <style scoped>

    .network-plan {
      top: 0px;
      white-space: nowrap;
      right: 40px;
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
    
    .expander .network-plan:hover, .expander .network-plan-load:hover, .expander .network-plan span:hover {
      color: #ccc
    }
    
  </style>

  <div class="network-plan">
    <div class="network-plan-load" ng-click="showCombo()">
      <span ng-if="plan.name">{{plan.name}}</span>
      <span ng-if="!plan.name"><i class="fa fa-plus f-select-plan" style="font-size: 12px"></i> Select a plan</span>
    </div>
  </div>
  `,
  bindings: {},
  controller: function($scope, state) {
    this.state = state;

    $scope.showCombo = () => {
      console.log(this.state.planId);
    }
  }
})