class PlanInfoController {
  constructor($http, state, $timeout) {
    this.$http = $http
    this.state = state
    this.$timeout = $timeout
    this.generalPlanTags = []
    this.saPlanTags = []
    this.isEditMode = false
    this.addGeneralTags = false
    this.addSATags = false
    this.RESOURCE_TYPE = 'PLAN'

    state.plan
    .subscribe((plan) => {
      this.reloadPlanAccess(plan.id)
      this.currentPlanInfo = plan
      this.getPlanTagDetails()
    })
  }

  reloadPlanAccess(planId) {
    this.accessTypes = Object.freeze({
      RESOURCE_READ: { displayName: 'Read Access', permissionBits: null, actors: [] },
      RESOURCE_WRITE: { displayName: 'Write Access', permissionBits: null, actors: [] },
      RESOURCE_ADMIN: { displayName: 'Owner Access', permissionBits: null, actors: [] }
    })
    this.state.loadResourceAccess(this.RESOURCE_TYPE, planId, this.accessTypes, this.state.systemActors, this.$http)
  }

  editCurrentPlan() {
    this.isEditMode = true
  }

  commitUpdatestoPlan() {
    this.updatePlanTags()
    this.getPlanTagDetails()
    this.state.saveResourceAccess(this.RESOURCE_TYPE, this.state.plan.getValue().id, this.accessTypes)
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
        this.loadPlans()
      })
  }

  $onInit() {
    this.getPlanTagDetails()
  }

  $onDestroy() {
    this.commitUpdatestoPlan()
  }
}

PlanInfoController.$inject = ['$http', 'state', '$timeout']

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