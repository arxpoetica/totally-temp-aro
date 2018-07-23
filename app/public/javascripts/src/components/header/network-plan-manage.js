class NetworkPlanModalController {
  constructor() {
    this.views = Object.freeze({
      Plan_Info: 0,
      Search_plans: 1,
      Recent_plans: 2
    })
    this.currentView = this.views.Plan_Info
  }
}

let networkPlanManage = {
  templateUrl: '/components/header/network-plan-manage.html',
  controller: NetworkPlanModalController
}

export default networkPlanManage