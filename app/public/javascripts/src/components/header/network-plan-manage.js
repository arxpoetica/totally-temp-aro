class NetworkPlanModalController {
  constructor($http, $q, state, tracker) {
    this.state     = state
    this.$http     = $http
    this.$q        = $q
    this.tracker   = tracker
    
    this.user      = globalUser
    this.user_id   = user_id
    
    this.allPlans  = false
    this.projectId = globalUser.projectId

    this.plan      = null
    this.plans     = []

    this.ids       = 0
    this.customLoc = {};

    this.interval  = null
    this.search
    this.search_text = ''
    this.searchText = []
    this.searchList = []

    this.sortField
    this.descending

    this.views = Object.freeze({
      Plan_Info: 0,
      Search_plans: 1,
      Recent_plans: 2
    })

    this.currentView = this.views.Plan_Info

    this.planOptions = {
      //url: '/service/v1/plan-summary',
      url: '/service/v1/plan',
      method: 'GET',
      params: {}
    }
  }

  onTagSelectionChanged() {
    console.log(this.selectedTags)
  }
  updateTag(plan,removetag) {
    var updatePlan = plan
    updatePlan.tagMapping.global = _.without(updatePlan.tagMapping.global, removetag.id)
    
    this.$http.put(`/service/v1/plan?user_id=${this.user_id}`,updatePlan)
    .then((response) => {
      this.loadPlans()
    })
  }

  $onInit() {
    this.showCombo()
  }

  showCombo() {
    this.loadPlans(1, () => {
      //Load search value
      this.loadSearch()
      this.tracker.track('Open Analysis')

      this.reloadCurrentLocation();
    })
  }

  loadSearch() {
    this.search = $('#create-new-plan .select2')

    this.search.select2({
      placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
      ajax: {
        url: '/search/addresses',
        dataType: 'json',
        delay: 250,
        data: (term) => ({ text: term }),
        results: (data, params) => {
          var items = [];
          data.forEach((location) => {
            items.push(
              {
                id: 'id-' + (++this.ids),
                text: location.name,
                bounds: location.bounds,
                centroid: location.centroid
              }
            );
          })

          this.search_results = items
          return {
            results: items,
            pagination: {
              more: false
            }
          }
        },
        cache: true
      },
      initSelection: function (select, callback) {
        callback(this.customLoc)
      },
    }).on('change', (e) => {
      var selected = e.added
      if (selected) {
        this.new_plan_area_name = selected.text
        this.new_plan_area_bounds = selected.bounds
        this.new_plan_area_centroid = selected.centroid
      }
    })
  }

  loadPlans(page, callback) {
    clearInterval(this.interval)
    this.currentPage = page || 1
    this.maxResults = 10
    if (page > 1) {
      var start = this.maxResults * (page - 1);
      var end = start + this.maxResults;
      this.plans = this.allPlans.slice(start, end);
      return;
    }

    var load = (callback) => {

      // this.planOptions.params.user_id = this.user_id

      // if(!this.planOptions.params.$orderby)
      //   this.planOptions.params.$orderby = "name"

      // this.planOptions.params.$filter = "ephemeral ne true"
      // if (this.search_text) {
      //   if (this.planOptions.params.$filter) {
      //     this.planOptions.params.$filter += ' and substringof(name, \'' + this.search_text + '\')'
      //   } else {
      //     this.planOptions.params.$filter = 'substringof(name, \'' + this.search_text + '\')'
      //   }
      // }

      this.planOptions.params.user_id = this.user_id
      this.planOptions.params.search = this.search_text
      this.planOptions.params.project_id = this.projectId

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
            // this.pages = response.data.pages
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
    this.interval = setInterval(load, 100000)
  }

  openReport(plan) {
    this.state.networkPlanModal.next(false)
    //This previous modal will show after close the report
    this.state.previousModal = this.state.networkPlanModal
    this.state.reportModal.next(true)
  }

  deletePlan(plan) {
    if (!plan) return
    this.tracker.track('Manage Analyses / Delete Analysis')

    swal({
      title: 'Are you sure?',
      text: 'You will not be able to recover the deleted plan!',
      type: 'warning',
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Yes, delete it!',
      showCancelButton: true,
      closeOnConfirm: true
    }, () => {
      this.$http.delete(`/service/v1/plan/${plan.id}?user_id=${this.user_id}`).then((response) => {
        this.loadPlans()
      })
    })
  }

  sortBy(key, descending) {
    this.sortField = key
    this.descending = descending
  }

  loadSortBy(key, descending) {
    this.planOptions.params.$orderby = key + " " + descending
    this.loadPlans()
  }

  selectPlan(plan) {
    this.plan = plan
    this.state.loadPlan(plan.id)
    this.state.networkPlanModal.next(false)
  }

  reloadCurrentLocation() {
    var center = map.getCenter();
    this.geoCode(center).then((address) => {
      this.fetchLocation(address).then(function (location) {
        this.customLoc = location
        $(this.search[0]).select2('val', location, true);
      })
    })
  }

  geoCode(latlng) {
    var promise = this.$q.defer()

    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({ 'location': latlng }, function (results, status) {
      if (status === 'OK') {
        if (results[1]) {
          promise.resolve({ message: results[0].formatted_address });
        } else {
          promise.reject({ error: 'No results found' });
        }
      } else {
        promise.reject({ error: 'Geocoder failed due to: ' + status })
      }
    });

    return promise.promise;
  }

  fetchLocation(location) {
    return this.$http.get("/search/addresses", { params: { text: location.message } }).then(function (results) {

      var location = results.data[0];
      var loc = {
        id: 'id-' + (++this.ids),
        text: location.name,
        bounds: location.bounds,
        centroid: location.centroid,
        geocoded: true
      };

      return loc;

    });
  }

  getTagCategories(currentPlanTags) {
    return this.state.listOfTags.filter(tag => _.contains(currentPlanTags,tag.id))
  }

  applyTagSearchFilter(selectedFilters) {
    _.map(selectedFilters.selectedFilters, (tag) => { 
      tag.type = 'tag'
      return tag
    })       
    this.searchText = this.searchText.concat(selectedFilters.selectedFilters)
    this.searchList = this.searchList.concat(selectedFilters.selectedFilters)
  }
  applyOwnerSearchFilter(selectedFilters) {
    _.map(selectedFilters.selectedFilters, (tag) => { 
      tag.type = 'owner'
      return tag
    })       
    this.searchText = this.searchText.concat(selectedFilters.selectedFilters)
    this.searchList = this.searchList.concat(selectedFilters.selectedFilters)
  }

}

NetworkPlanModalController.$inject = ['$http', '$q', 'state', 'tracker']

let networkPlanManage = {
  templateUrl: '/components/header/network-plan-manage.html',
  controller: NetworkPlanModalController
}

export default networkPlanManage