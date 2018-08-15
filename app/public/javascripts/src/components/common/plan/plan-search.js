class PlanSearchController {

  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
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
    this.idToServiceAreaCode = {}
    this.isAdministrator = false
  }

  $onInit() {
    this.loadPlans(1)
  }

  loadServiceAreaInfo(plans) {

    // Load service area ids for all service areas referenced by the plans
    // First determine which ids to fetch. We might already have a some or all of them
    var serviceAreaIdsToFetch = new Set()
    plans.forEach((plan) => {
      plan.tagMapping.linkTags.serviceAreaIds.forEach((serviceAreaId) => {
        if (!this.idToServiceAreaCode.hasOwnProperty(serviceAreaId)) {
          serviceAreaIdsToFetch.add(serviceAreaId)
        }
      })
    })
    if (serviceAreaIdsToFetch.size === 0) {
      return
    }

    // Get the ids from aro-service
    var filter = ''
    Array.from(serviceAreaIdsToFetch).forEach((serviceAreaId, index) => {
      if (index > 0) {
        filter += ' or '
      }
      filter += ` (id eq ${serviceAreaId})`
    })

    // Our $top is high, and should never be hit as we are getting service areas for a select few ids
    return this.$http.get(`/service/odata/servicearea?$select=id,code&$filter=${filter}&$orderby=id&$top=10000`)
      .then((results) => {
        results.data.forEach((serviceArea) => this.idToServiceAreaCode[serviceArea.id] = serviceArea.code)
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  loadCreatorsInfo(plans) {

    // Load creator ids for all creatorss referenced by the plans
    // First determine which ids to fetch. We might already have a some or all of them
    var creatorIdsToFetch = new Set()
    plans.forEach((plan) => {
      if (!this.state.listOfCreatorTags.some((creatorTag) => creatorTag.id === plan.createdBy)) {
        plan.createdBy && creatorIdsToFetch.add(plan.createdBy)
      }
    })
    if (creatorIdsToFetch.size === 0) {
      return
    }

    // Get the ids from aro-service
    var filter = ''
    Array.from(creatorIdsToFetch).forEach((createdById, index) => {
      if (index > 0) {
        filter += ' or '
      }
      filter += ` (id eq ${createdById})`
    })

    // Our $top is high, and should never be hit as we are getting createdBy for a select few ids
    return this.state.loadListOfCreatorTagsById(filter)
      .then((results) => {
        this.$timeout()
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
      this.loadServiceAreaInfo(this.plans)
      this.loadCreatorsInfo(this.plans)
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
            this.loadServiceAreaInfo(this.plans)
            this.loadCreatorsInfo(this.plans)
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

PlanSearchController.$inject = ['$http', '$timeout', 'state']

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