import ToolBarActions from '../../../react/components/header/tool-bar-actions'
import { toUTCDate } from '../../../react/common/view-utils.js'

class PlanSearchController {
  constructor ($http, $timeout, $ngRedux, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.search_text = ''
    this.searchText = []
    this.searchList = []
    this.allPlans = false
    this.systemUsers = []
    this.planOptions = {
      url: '/service/v1/plan',
      method: 'GET',
      params: {}
    }
    this.idToServiceAreaCode = {}
    this.creatorsSearchList = []
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
    this.planSortingOptions = [
      { sortType: 'updatedDate', description: 'Date Modified' },
      { sortType: 'createdDate', description: 'Date Created' },
    ]
    this.selectedPlanSortType = this.planSortingOptions[0]
    this.sortByField = this.planSortingOptions[0].sortType
  }

  $onInit () {
    this.loadPlans(1)
  }

  $onChanges (changesObj) {
    if (changesObj && changesObj.systemActors) {
      const arrayOfSystemActors = []
      Object.keys(this.systemActors).forEach(actorId => arrayOfSystemActors.push(this.systemActors[actorId]))
      this.systemUsers = arrayOfSystemActors
        .filter((item) => item.type === 'user')
        .map(item => {
          var user = angular.copy(item)
          user.type = 'created_by' // Just a lot of legacy stuff that depends upon this
          return user
        })
    }
  }

  loadServiceAreaInfo (plans) {
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
    let serviceAreaIds = [...serviceAreaIdsToFetch]
    var promises = []
    while (serviceAreaIds.length) {
      var filter = ''
      serviceAreaIds.splice(0, 100).forEach((serviceAreaId, index) => {
        if (index > 0) {
          filter += ' or '
        }
        filter += ` (id eq ${serviceAreaId})`
      })

      promises.push(this.$http.get(`/service/odata/servicearea?$select=id,code&$filter=${filter}&$orderby=id&$top=10000`))
    }
    // To set ServiceArea based on Plan Tags in redux
    this.loadListOfSAPlanTagsById(this.listOfServiceAreaTags, promises)
    return this.state.StateViewMode.loadListOfSAPlanTagsById(this.state, promises)
      .then((result) => {
        result.forEach((serviceArea) => this.idToServiceAreaCode[serviceArea.id] = serviceArea.code)
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  loadPlans (page, callback) {
    this.constructSearch()
    this.currentPage = page || 1
    this.maxResults = 10
    if (page > 1) {
      var start = this.maxResults * (page - 1)
      var end = start + this.maxResults
      this.plans = this.allPlans.slice(start, end)
      this.loadServiceAreaInfo(this.plans)
      return
    }

    var load = (callback) => {
      this.planOptions.params.user_id = this.state.loggedInUser.id
      this.planOptions.params.search = this.search_text
      this.planOptions.params.project_template_id = this.state.loggedInUser.projectId

      this.$http(this.planOptions)
        .then((response) => {
          this.planOptions.params = {}
          this.$http.get('/optimization/processes').then((running) => {
            this.totalData = []
            this.totalData = response.data.sort((a, b) => (a[this.sortByField] < b[this.sortByField]) ? 1 : -1)
            this.totalData.forEach((plan) => {
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
            // this.allPlans = _.sortBy(response.data, 'name')
            this.allPlans = response.data
            this.plans = this.allPlans.slice(0, this.maxResults)
            this.loadServiceAreaInfo(this.plans)
            this.pages = []
            var pageSize = Math.floor(response.data.length / this.maxResults) + (response.data.length % this.maxResults > 0 ? 1 : 0)
            for (var i = 1; i <= pageSize; i++) {
              this.pages.push(i)
            }

            callback && callback()
          })
        })
    }
    load(callback)
  }

  constructSearch () {
    const searchTextObject = {}
    this.searchText.forEach(planObj => {
      if (planObj.type === 'svc') searchTextObject.svc = planObj
      if (planObj.type === 'tag') searchTextObject.tag = planObj
      if (planObj.type === 'created_by') searchTextObject.created_by = planObj
    })
    this.searchText = Object.values(searchTextObject)
    
    this.search_text = ''
    var selectedFilterPlans = _.filter(this.searchText, (plan) => {
      if (_.isString(plan)) return plan
    })
    const typeToProperty = {
      svc: 'code',
      tag: 'name',
      created_by: 'fullName'
    }
    var selectedFilters = this.searchText
      .filter((item) => typeof item !== 'string')
      .map((item) => `${item.type}:\"${item[typeToProperty[item.type]]}\"`)
    if (selectedFilterPlans.length > 0) selectedFilters = selectedFilters.concat(`"${selectedFilterPlans.join(' ')}"`)
    this.search_text = selectedFilters.join(' ')
  }

  onPlanClicked (plan) {
    this.onPlanSelected && this.onPlanSelected({ plan: plan })
  }

  onPlanDeleteClicked (plan) {
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

  getTagCategories (currentPlanTags) {
    return this.state.listOfTags.filter(tag => _.contains(currentPlanTags, tag.id))
  }

  getSATagCategories (currentPlanTags) {
    return this.state.listOfServiceAreaTags.filter(tag => _.contains(currentPlanTags, tag.id))
  }

  applySearchFilter (selectedFilters, type) {
    const filters = selectedFilters.map(item => {
      item.type = type
      return item
    })
    this.applySearch(filters)
  }

  applySearch (filters) {
    this.searchText = _.uniq(this.searchText.concat(filters))
    this.searchList = _.uniq(this.searchList.concat(filters))
    this.loadPlans()
  }

  onChangeSortingType () {
    this.sortByField = this.selectedPlanSortType.sortType
    this.loadPlans()
  }

  sortBy (key, descending) {
    this.sortField = key
    this.descending = descending
  }

  loadSortBy (key, descending) {
    this.planOptions.params.$orderby = key + ' ' + descending
    this.loadPlans()
  }

  updateTag (plan, removeTag) {
    var updatePlan = plan
    if (removeTag.type == 'svc') {
      updatePlan.tagMapping.linkTags.serviceAreaIds = _.without(updatePlan.tagMapping.linkTags.serviceAreaIds, removeTag.tag.id)
    } else {
      updatePlan.tagMapping.global = _.without(updatePlan.tagMapping.global, removeTag.tag.id)
    }

    return this.$http.put(`/service/v1/plan`, updatePlan)
      .then((response) => {
        this.loadPlans()
      })
  }

  getPlanCreatorName (createdBy) {
    var creator = this.systemActors[createdBy]
    return creator && ((creator.type === 'group') ? creator.name : `${creator.firstName} ${creator.lastName}`)
  }

  searchCreatorsList (filter) {
    let MAX_CREATORS_FROM_ODATA = 10
    var url = `/service/odata/UserEntity?$select=firstName,lastName,fullName`
    if(filter) {
      url = url + `&$filter=substringof(fullName,'${filter}')`
    }
    url = url + `&$top=${MAX_CREATORS_FROM_ODATA}`
    return this.$http.get(url)
      .then((response) => {
        this.creatorsSearchList = response.data
      })
  }

  convertTimeStampToDate (timestamp) {
    const utcDate = toUTCDate(new Date(timestamp))
    return new Intl.DateTimeFormat('en-US').format(utcDate)
  }

  mapStateToThis (reduxState) {
    return {
      dataItems: reduxState.plan.dataItems,
      listOfServiceAreaTags: reduxState.toolbar.listOfServiceAreaTags,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      loadListOfSAPlanTagsById: (listOfServiceAreaTags, promises) => dispatch(ToolBarActions.loadListOfSAPlanTagsById(listOfServiceAreaTags, promises)),
     }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

PlanSearchController.$inject = ['$http', '$timeout', '$ngRedux', 'state']

let planSearch = {
  templateUrl: '/components/common/plan/plan-search.html',
  bindings: {
    showPlanDeleteButton: '<',
    showRefreshPlansOnMapMove: '<',
    systemActors: '<',
    onPlanSelected: '&',
    onPlanDeleteRequested: '&'
  },
  controller: PlanSearchController
}

export default planSearch
