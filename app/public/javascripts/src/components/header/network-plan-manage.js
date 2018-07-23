class NetworkPlanModalController {
  constructor($http, state) {

    this.$http = $http
    this.state = state

    this.views = Object.freeze({
      Plan_Info: 0,
      Search_plans: 1,
      Recent_plans: 2
    })
    this.currentView = this.views.Plan_Info
  }

  getTagCategories(currentPlanTags) {
    return this.state.listOfTags.filter(tag => _.contains(currentPlanTags,tag.id))
  }

  getSATagCategories(currentPlanTags) {
    return this.state.listOfServiceAreaTags.filter(tag => _.contains(currentPlanTags,tag.id))
  }

  updateTag(plan,removeTag) {
    var updatePlan = plan
    if(removeTag.type == 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = _.without(updatePlan.tagMapping.linkTags.serviceAreaIds, removeTag.tag.id)
    } else {
      updatePlan.tagMapping.global = _.without(updatePlan.tagMapping.global, removeTag.tag.id)
    }
    
    return this.$http.put(`/service/v1/plan?user_id=${this.state.loggedInUser.id}`,updatePlan)
  }

  deletePlan(plan) {
    if (!plan) return

    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted plan!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      this.$http.delete(`/service/v1/plan/${plan.id}?user_id=${this.state.loggedInUser.id}`).then((response) => {
        this.loadPlans()
        this.state.getOrCreateEphemeralPlan()
        .then((ephemeralPlan) => {
          this.state.setPlan(ephemeralPlan.data)
        })
      })
    })
  }

}

NetworkPlanModalController.$inject = ['$http', 'state']

let networkPlanManage = {
  templateUrl: '/components/header/network-plan-manage.html',
  controller: NetworkPlanModalController
}

export default networkPlanManage