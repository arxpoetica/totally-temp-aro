class NetworkPlanController {

  constructor($timeout, state)  {
    this.plan = null
    state.plan.subscribe((newValue) => {
      this.plan = newValue
    })
  }

}

NetworkPlanController.$inject = ['$timeout', 'state']

let networkPlan = {
  templateUrl: '/components/header/network-plan.html',
  bindings: {},
  controller: NetworkPlanController
}

export default networkPlan