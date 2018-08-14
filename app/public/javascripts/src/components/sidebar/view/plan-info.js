class PlanInfoController {
  constructor($http, state, $timeout, Utils) {
    this.$http = $http
    this.state = state
    this.$timeout = $timeout
    this.utils = Utils
    this.searchSessionToken = this.utils.getInsecureV4UUID()

    this.generalPlanTags = []
    this.saPlanTags = []
    this.isEditMode = false
    this.addGeneralTags = false
    this.addSATags = false

    this.planObserver = state.plan
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

  commitUpdatestoPlan(isDestroyingControl) {
    // This will call a function into the resource permissions editor that will do the actual save
    // DO NOT SAVE ON DESTROY. This may be causing all sorts of issues with threading on service.
    if (!isDestroyingControl) {
      this.saveResourceAccess && this.saveResourceAccess()
      this.updatePlanTags()
      this.getPlanTagDetails()
    }
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
    this.currentPlanInfo.tagMapping.linkTags.serviceAreaIds = _.map(this.saPlanTags, (tag) => tag.id)
    this.currentPlanInfo.tagMapping.global = _.map(this.generalPlanTags, (tag) => tag.id)
    this.$http.put(`/service/v1/plan?user_id=${this.state.loggedInUser.id}`, this.currentPlanInfo)
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
          url: `/search/addresses`,
          dataType: 'json',
          quietMillis: 250,     // *** In newer versions of select2, this is called 'delay'. Remember this when upgrading select2
          data: (term) => ({
            text: term,
            sessionToken: this.searchSessionToken,
            biasLatitude: this.state.defaultPlanCoordinates.latitude,
            biasLongitude: this.state.defaultPlanCoordinates.longitude
          }),
          results: (data, params) => {
            var items = data.map((location) => {
              return {
                id: 'id-' + (++ids),
                text: location.displayText,
                type: location.type,
                value: location.value
              }
            })
            if (items.length === 0) {
              items.push({
                id: 'id-' + (++ids),
                text: 'Search an address, city, or state',
                type: 'placeholder'
              })
            }
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
        var selectedLocation = e.added
        if (selectedLocation) {
          this.searchSessionToken = this.utils.getInsecureV4UUID()
          if (selectedLocation.type === 'placeId') {
            // This is a google maps place_id. The actual latitude/longitude can be obtained by another call to the geocoder
            var geocoder = new google.maps.Geocoder;
            var self = this
            geocoder.geocode({'placeId': selectedLocation.value}, function(results, status) {
              if (status !== 'OK') {
                console.error('Geocoder failed: ' + status);
                return
              }
              self.currentPlanInfo.areaName = selectedLocation.text
              self.currentPlanInfo.latitude = results[0].geometry.location.lat()
              self.currentPlanInfo.longitude = results[0].geometry.location.lng()
              self.$http.put(`/service/v1/plan?user_id=${self.state.loggedInUser.id}`, self.currentPlanInfo)
            })
          } else {
            console.error(`Unsupported search result type ${selectedLocation.type}`)
          }
        }
      })
  
      search.select2("val", default_location, true)
    }
  }

  getPlanCreatorName(createdBy) {
    var creator = this.state.listOfCreatorTags.filter((creator) => creator.id === createdBy)[0]
    return creator && creator.fullName
  }
  
  $onInit() {
    this.getPlanTagDetails()
  }

  $onDestroy() {
    this.commitUpdatestoPlan(true)
    this.planObserver.unsubscribe()
  }
}

PlanInfoController.$inject = ['$http', 'state', '$timeout', 'Utils']

let planInfo = {
  templateUrl: '/components/sidebar/view/plan-info.html',
  bindings: {
    getTagDetails: '&',
    getSaTagDetails: '&',
    updateTag: '&',
    deletePlan: '&'
  },
  controller: PlanInfoController
}

export default planInfo