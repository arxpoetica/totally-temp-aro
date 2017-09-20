class NetworkPlanController {

  constructor($timeout, state)  {
    this.plan = null
    state.plan.subscribe((newValue) => {
      this.plan = newValue
    })
  }

}

NetworkPlanController.inject = ['$timeout', 'state']

app.component('networkPlan', {
  templateUrl: '/components/header/network-plan-component.html',
  bindings: {},
  controller: NetworkPlanController
})