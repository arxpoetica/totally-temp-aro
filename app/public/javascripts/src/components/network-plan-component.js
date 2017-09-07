class NetworkPlanController {

  constructor($timeout, state)  {
    this.plan = null
    state.plan.subscribe((newValue) => {
      this.plan = newValue
    })
  }

  showNetworkPlanModal() {
      state.networkPlanModal.next(true)
  }
}

NetworkPlanController.inject = ['$timeout', 'state']

app.component('networkPlan', {
  template: `
  <style scoped>

    .network-plan {
      top: 0px;
      white-space: nowrap;
      right: 0px;
      text-align: center;
      position: absolute;
      background: rgba(50, 50, 50, 0.7);
      padding-left: 10px;
      padding-right: 10px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      cursor: pointer;
      color: white;
    }

    .network-plan:hover, .network-plan:hover, .network-plan div:hover {
      color: #ccc
    }
    
  </style>

  <div class="network-plan" ng-click="$ctrl.showNetworkPlanModal()">
    <!-- For ephemeral plans, the name has not been set by the user -->
    <div ng-if="$ctrl.plan && $ctrl.plan.ephemeral">
      <div style="font-size: 25px; line-height: 40px;">Unsaved Plan</div>
      <div style="font-size: 12px; line-height: 10px; padding-bottom: 10px;">ref: {{$ctrl.plan.name}}</div>
    </div>

    <!-- For saved plans, display the plan name only -->
    <div ng-if="$ctrl.plan && !$ctrl.plan.ephemeral" style="font-size: 25px; line-height: 55px">
      {{$ctrl.plan.name}}
    </div>
  </div>
  `,
  bindings: {},
  controller: NetworkPlanController
})