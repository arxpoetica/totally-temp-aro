class NetworkPlanController {
  constructor (state) {
    this.state = state
  }
}

NetworkPlanController.$inject = ['state']

let networkPlan = {
  templateUrl: '/components/header/network-plan.html',
  bindings: {},
  controller: NetworkPlanController
}

export default networkPlan
