class NetworkPlanModalController {
  constructor($http, state) {

    this.$http = $http
    this.state = state

    this.views = Object.freeze({
      Plan_Info: 0,
      Search_plans: 1,
      Recent_plans: 2
    })
    this.currentView = this.views.Search_plans
  }

  loadPlan(plan) {
    this.state.loadPlan(plan.id)
    this.state.networkPlanModal.next(false)
  }

  deletePlan(plan) {
    if (!plan) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      swal({
        title: 'Are you sure?',
        text: 'You will not be able to recover the deleted plan!',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        showCancelButton: true,
        closeOnConfirm: true
      }, (deletePlan) => {
        if (deletePlan) {
          this.$http.delete(`/service/v1/plan/${plan.id}?user_id=${this.state.loggedInUser.id}`)
          .then((response) => {
            resolve()
            return this.state.getOrCreateEphemeralPlan()
          })
          .then((ephemeralPlan) => this.state.setPlan(ephemeralPlan.data))
          .catch((err) => reject(err))
        } else {
          resolve()
        }
      })
    })
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
}

NetworkPlanModalController.$inject = ['$http', 'state']

let networkPlanManage = {
  templateUrl: '/components/header/network-plan-manage.html',
  controller: NetworkPlanModalController
}

export default networkPlanManage