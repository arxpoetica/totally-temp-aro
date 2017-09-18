class ViewModeController {

  constructor(state,$http) {
    this.state = state
    this.plan = null
    this.selectedLocationInfo = null

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })

    state.showLocationInfo
    .subscribe((options) => {
      var locationId = null
      if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
        locationId = options.locations[0].location_id;

        getLocationInfo(this.plan.id,locationId,(locationInfo) => {
          this.selectedLocationInfo = locationInfo
        })

      }
    })

    // Get the location Information
    function getLocationInfo(planId, id, callback) {
      $http.get('/locations/' + planId + '/' + id + '/show')
        .then((response) => {
          callback(response.data)
        })
    }

  }  
}

ViewModeController.$inject = ['state','$http']

app.component('viewMode', {
  template: `
  <style>
    .view-mode-container {
      position: relative; /* This will require the parent to have position: relative or absolute */
      height: 100%;
    }
  </style>
  <div class="view-mode-container">
    HouseHolds: {{$ctrl.selectedLocationInfo.number_of_households}}
    Businesses: {{$ctrl.selectedLocationInfo.number_of_towers}}
    Towers: {{$ctrl.selectedLocationInfo.number_of_towers}}
    Distance From Existing Network: {{$ctrl.selectedLocationInfo.distance_to_client_fiber}}
    Distance From Planned Network: {{$ctrl.selectedLocationInfo.distance_to_planned_network}}
  </div>
  `,
  bindings: {},
  controller: ViewModeController
})