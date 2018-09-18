class NetworkPlanController {

  constructor($timeout, state)  {
    this.plan = null
    this.currentUser = state.loggedInUser;
    this.showPlan = true;

    state.plan.subscribe((newValue) => {
      this.plan = newValue;
      this.showPlan = (this.plan && this.plan.ephemeral) && this.currentUser.perspective === 'admin'
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