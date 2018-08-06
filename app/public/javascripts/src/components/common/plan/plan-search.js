class PlanSearchController {

  constructor($http, state) {
    this.$http = $http
    this.state = state

    this.search_text = ''
    this.searchText = []
    this.searchList = []
    this.allPlans  = false
    this.planOptions = {
      url: '/service/v1/plan',
      method: 'GET',
      params: {}
    }

    this.isAdministrator = false
  }

  $onInit() {
    this.loadPlans(1)
    this.getLoggedInUserRole()
  }

  getLoggedInUserRole() {
    var userAdminPermissions = null
    this.$http.get('/service/auth/permissions')
      .then((result) => {
        // Get the permissions for the name USER_ADMIN
        userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
        return this.$http.get(`/service/auth/acl/SYSTEM/1`)
      })
      .then((result) => {
        // Get the acl entry corresponding to the currently logged in user
        var userAcl = result.data.resourcePermissions.filter((item) => item.systemActorId === this.state.loggedInUser.id)[0]
        // The userAcl.rolePermissions is a bit field. If it contains the bit for "userAdminPermissions" then
        // the logged in user is an administrator.
        this.isAdministrator = (userAcl && (userAcl.rolePermissions & userAdminPermissions)) > 0
      })
      .catch((err) => console.error(err))
  }

  loadPlans(page, callback) {
    this.constructSearch()
    this.currentPage = page || 1
    this.maxResults = 10
    if (page > 1) {
      var start = this.maxResults * (page - 1);
      var end = start + this.maxResults;
      this.plans = this.allPlans.slice(start, end);
      return;
    }

    var load = (callback) => {

      this.planOptions.params.user_id = this.state.loggedInUser.id
      this.planOptions.params.search = this.search_text
      this.planOptions.params.project_template_id = this.state.loggedInUser.projectId

      this.$http(this.planOptions)
        .then((response) => {
          this.planOptions.params = {}
          this.$http.get('/optimization/processes').then((running) => {
            response.data.forEach((plan) => {
              var info = running.data.find((status) => status.planId === +plan.id)
              if (info) {
                var diff = (Date.now() - new Date(info.startDate).getTime()) / 1000
                var min = Math.floor(diff / 60)
                var sec = Math.ceil(diff % 60)
                plan.progressString = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`
                plan.progress = info.progress
                plan.startDate = info.startDate
                plan.optimizationState = info.optimizationState
              }
            })
            this.allPlans = _.sortBy(response.data, 'name');
            this.plans = this.allPlans.slice(0, this.maxResults);
            this.pages = [];
            var pageSize = Math.floor(response.data.length / this.maxResults) + (response.data.length % this.maxResults > 0 ? 1 : 0);
            for (var i = 1; i <= pageSize; i++) {
              this.pages.push(i);
            }

            callback && callback()
          })
        })
    }
    load(callback)
  }

  constructSearch() {
    this.search_text = ''
    var selectedFilterPlans = _.filter(this.searchText,(plan) => {
      if(_.isString(plan)) return plan
    })
    var selectedFilters = _.map(_.filter(this.searchText,(filter) => !_.isString(filter)) ,(tag) => tag.type.concat(":").concat("\"").concat(tag.name || tag.code || tag.fullName).concat("\""))
    if(selectedFilterPlans.length > 0) selectedFilters = selectedFilters.concat(`"${selectedFilterPlans.join(' ')}"`)
    this.search_text = selectedFilters.join(' ')
  }

  onPlanClicked(plan) {
    this.onPlanSelected && this.onPlanSelected({ plan: plan })
  }

  onPlanDeleteClicked(plan) {
    if (this.onPlanDeleteRequested) {
      this.onPlanDeleteRequested({ plan: plan })
        .then(() => {
          this.loadPlans()
        })
        .catch((err) => {
          console.error(err)
          this.loadPlans()
        })
    }
  }

  getTagCategories(currentPlanTags) {
    return this.state.listOfTags.filter(tag => _.contains(currentPlanTags,tag.id))
  }

  getSATagCategories(currentPlanTags) {
    return this.state.listOfServiceAreaTags.filter(tag => _.contains(currentPlanTags,tag.id))
  }
  
  applyOwnerSearchFilter(selectedFilters) {
    var filters = _.map(selectedFilters, (tag) => { 
      tag.type = 'created_by'
      return tag
    })
    this.applySearch(filters)
  }

  applyTagSearchFilter(selectedFilters) {
    var filters = _.map(selectedFilters, (tag) => { 
      tag.type = 'tag'
      return tag
    }) 
    this.applySearch(filters)
  }

  applySaSearchFilter(selectedFilters) {
    var filters = _.map(selectedFilters, (tag) => { 
      tag.type = 'svc'
      return tag
    }) 
    this.applySearch(filters)
  }

  applySearch(filters) {
    this.searchText = _.uniq(this.searchText.concat(filters))
    this.searchList = _.uniq(this.searchList.concat(filters))
    this.loadPlans()
  }

  sortBy(key, descending) {
    this.sortField = key
    this.descending = descending
  }

  loadSortBy(key, descending) {
    this.planOptions.params.$orderby = key + " " + descending
    this.loadPlans()
  }

  updateTag(plan,removeTag) {
    var updatePlan = plan
    if(removeTag.type == 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = _.without(updatePlan.tagMapping.linkTags.serviceAreaIds, removeTag.tag.id)
    } else {
      updatePlan.tagMapping.global = _.without(updatePlan.tagMapping.global, removeTag.tag.id)
    }
    
    return this.$http.put(`/service/v1/plan?user_id=${this.state.loggedInUser.id}`,updatePlan)
    .then((response) => {
      this.loadPlans()
    })
  }

  openReport() {
    this.state.networkPlanModal.next(false)
    //This previous modal will show after close the report
    this.state.previousModal = this.state.networkPlanModal
    this.state.reportModal.next(true)
  }

  getPlanCreatorName(createdBy) {
    var creator = this.state.listOfCreatorTags.filter((creator) => creator.id === createdBy)[0]
    return creator && creator.fullName
  }
}

PlanSearchController.$inject = ['$http', 'state']

let planSearch = {
  templateUrl: '/components/common/plan/plan-search.html',
  bindings: {
    showPlanDeleteButton: '<',
    showRefreshPlansOnMapMove: '<',
    onPlanSelected: '&',
    onPlanDeleteRequested: '&'
  },
  controller: PlanSearchController
}

export default planSearch