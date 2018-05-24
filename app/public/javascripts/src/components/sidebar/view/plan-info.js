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

    this.systemActorTypes = Object.freeze({
      GROUP: 'GROUP',
      USER: 'USER'
    })

    state.plan
    .subscribe((plan) => {
      this.reloadPlanAccess()
      this.currentPlanInfo = plan
      this.getPlanTagDetails()
    })
  }

  reloadPlanAccess() {
    this.accessType = Object.freeze({
      RESOURCE_READ: { displayName: 'Read Access', permissionBits: null, actors: [] },
      RESOURCE_WRITE: { displayName: 'Write Access', permissionBits: null, actors: [] },
      RESOURCE_ADMIN: { displayName: 'Owner Access', permissionBits: null, actors: [] }
    })
    this.systemActors = []  // Groups and users
    this.$http.get('/service/auth/groups')
      .then((result) => {
        result.data.forEach((group) => {
          group.type = this.systemActorTypes.GROUP
          this.systemActors.push(group)
        })
        return this.$http.get('/service/auth/users')
      })
      .then((result) => {
        result.data.forEach((user) => {
          user.name = `${user.firstName} ${user.lastName}`  // So that it is easier to bind to a common property
          user.type = this.systemActorTypes.USER
          this.systemActors.push(user)
        })
        console.log(this.systemActors)
        // Get the permission bits for each access type
        return this.$http.get('/service/auth/permissions')
      })
      .then((result) => {
        result.data.forEach((authPermissionEntity) => {
          if (this.accessType.hasOwnProperty(authPermissionEntity.name)) {
            this.accessType[authPermissionEntity.name].permissionBits = authPermissionEntity.id
          }
        })
        // Get the actors that have access for this plan
        const planId = this.state.plan.getValue().id
        return this.$http.get(`/service/auth/acl/PLAN/${planId}`)
      })
      .then((result) => {
        var idToSystemActor = {}
        this.systemActors.forEach((systemActor) => idToSystemActor[systemActor.id] = systemActor)
        result.data.resourcePermissions.forEach((access) => {
          const systemActor = idToSystemActor[access.systemActorId]
          const permission = access.rolePermissions
          Object.keys(this.accessType).forEach((accessTypeKey) => {
            if ((permission & this.accessType[accessTypeKey].permissionBits) != 0) {
              this.accessType[accessTypeKey].actors.push(systemActor)
            }
          })
        })
        this.$timeout()
        console.log(this.accessType)
      })
      .catch((err) => console.error(err))
  }

  saveAccess() {
    const planId = this.state.plan.getValue().id
    this.$http.get(`/service/auth/acl/PLAN/${planId}`)
      .then((result) => {
        // Loop through all our access types
        var systemActorIdToPermissions = {}
        Object.keys(this.accessType).forEach((accessTypeKey) => {
          // Get the actors selected for this access type
          const selectedActors = this.accessType[accessTypeKey].actors
          selectedActors.forEach((selectedActor) => {
            if (!systemActorIdToPermissions.hasOwnProperty(selectedActor.id)) {
              systemActorIdToPermissions[selectedActor.id] = 0
            }
            // Set the permission bit
            systemActorIdToPermissions[selectedActor.id] |= this.accessType[accessTypeKey].permissionBits
          })
        })
        // Construct a put body with all the permissions we will send over to aro-service
        var putBody = { resourcePermissions: [] }
        Object.keys(systemActorIdToPermissions).forEach((actorId) => {
          putBody.resourcePermissions.push({
            systemActorId: actorId,
            rolePermissions: systemActorIdToPermissions[actorId]
          })
        })
        return this.$http.put(`/service/auth/acl/PLAN/${planId}`, putBody)
      })
      .then(() => this.reloadPlanAccess())
      .catch((err) => console.error(err))
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