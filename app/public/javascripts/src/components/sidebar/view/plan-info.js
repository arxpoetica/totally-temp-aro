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

    state.plan
    .subscribe((plan) => {
      this.currentPlanInfo = plan
      this.getPlanTagDetails()
    })
  }

  registerSaveAccessCallback(saveResourceAccess) {
    // We will call this function in resource-permissions-editor when we want to save the access settings for a plan.
    this.saveResourceAccess = saveResourceAccess
  }

  editCurrentPlan() {
    this.isEditMode = true
    this.setPlanLocation()
  }

  commitUpdatestoPlan() {
    this.updatePlanTags()
    this.getPlanTagDetails()
    // This will call a function into the resource permissions editor that will do the actual save
    this.saveResourceAccess && this.saveResourceAccess()
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

  setPlanLocation() {
    if(!this.currentPlanInfo.ephemeral) {

      var default_location = this.currentPlanInfo.areaName
      var ids = 0
      var search = $('.plan-details-container .select2')
      search.select2({
        placeholder: 'Set an address, city, state or CLLI code',
        initSelection: function (select, callback) {
          callback({"id": 0, "text":default_location})
        },
        ajax: {
          url: '/search/addresses',
          dataType: 'json',
          delay: 250,
          data: (term) => ({ text: term }),
          results: (data, params) => {
            var items = data.map((location) => {
              return {
                id: 'id-' + (++ids),
                text: location.name,
                bounds: location.bounds,
                centroid: location.centroid
              }
            })
            this.search_results = items
            this.setLocation = true
            return {
              results: items,
              pagination: {
                more: false
              }
            }
          },
          cache: true
        }
      }).on('change', (e) => {
        var selected = e.added
        if (selected && this.setLocation) {
          this.currentPlanInfo.areaName = selected.text
          this.currentPlanInfo.latitude = selected.centroid.coordinates[1]
          this.currentPlanInfo.longitude = selected.centroid.coordinates[0]
          this.$http.put(`/service/v1/plan?user_id=${this.state.loggedInUser.id}`, this.currentPlanInfo)
          console.log(selected)
        }
      })
  
      search.select2("val", default_location, true)
    }
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