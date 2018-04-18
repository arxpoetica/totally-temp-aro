class PlanInfoController {
  constructor($http,state) {
    this.$http = $http
    this.state = state
    this.generalPlanTags = []
    this.saPlanTags = []
    this.isEditMode = false
    this.addGeneralTags = false
    this.addSATags = false

    state.plan
    .subscribe((plan) => {
      this.currentPlanInfo = plan
      this.getPlanTagDetails()
    })  
  }

  editCurrentPlan() {
    this.isEditMode = true
  }

  commitUpdatestoPlan() {
    this.updatePlanTags()
    this.getPlanTagDetails()
    this.isEditMode = false
    this.addGeneralTags = false
    this.addSATags = false
  }

  getPlanTagDetails() {
    this.generalPlanTags = this.getTagDetails && this.getTagDetails({tagObject:this.currentPlanInfo.tagMapping.global})
    this.saPlanTags = this.getSaTagDetails && this.getSaTagDetails({tagObject:this.currentPlanInfo.tagMapping.linkTags.serviceAreaIds})
  }

  removeTag(type,tag) {
    this.updateTag({plan:this.currentPlanInfo,removeTag:{type:type,tag:tag}})
    .then(() => {
      this.state.loadPlan(this.currentPlanInfo.id)
    })
  }

  updatePlanTags() {
    var updatePlan = this.currentPlanInfo
    updatePlan.tagMapping.linkTags.serviceAreaIds = _.map(this.saPlanTags, (tag) => tag.id)
    updatePlan.tagMapping.global = _.map(this.generalPlanTags, (tag) => tag.id)


    this.$http.put(`/service/v1/plan?user_id=${this.currentUser.id}`, updatePlan)
      .then((response) => {
        this.state.loadPlan(this.currentPlanInfo.id)
        this.loadPlans()
      })
  }

  delete() {
    if(!this.currentPlanInfo.ephemeral) {
      this.deletePlan({plan:this.currentPlanInfo})
    } else {
      this.state.createEphemeralPlan()
      .then((ephemeralPlan) => {
        this.state.loadPlan(ephemeralPlan.id)
      })
    }

  }

  $onInit() {
    this.getPlanTagDetails()
  }

  $onDestroy() {
    this.commitUpdatestoPlan()
  }
}

PlanInfoController.$inject = ['$http','state']

let planInfo = {
  templateUrl: '/components/sidebar/view/plan-info.html',
  bindings: {
    currentUser: '<',
    getTagDetails: '&',
    getSaTagDetails: '&',
    updateTag: '&',
    deletePlan: '&',
    loadPlans: '&'
  },
  controller: PlanInfoController
}

export default planInfo