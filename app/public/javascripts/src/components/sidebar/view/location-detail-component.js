class ViewModeLocationController {

  constructor($http,state,configuration) {
    this.state = state
    this.plan = null
    this.selectedLocationInfo = null
    this.map_url = null

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })

    state.showViewModeInfo
    .subscribe((options) => {
      var locationId = null
      if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
        locationId = options.locations[0].location_id;

        getLocationInfo(this.plan.id,locationId)
        .then((locationInfo) => {
          this.selectedLocationInfo = locationInfo
          
          var google_maps_key = configuration.google_maps_key
          var coordinates = locationInfo.geog.coordinates[1] + ',' + locationInfo.geog.coordinates[0]
          var params = {
            center: coordinates,
            zoom: 13,
            size: '325x110',
            scale: 2,
            maptype: 'roadmap',
            markers: 'color:red|label:L|' + coordinates,
            key: google_maps_key
          }
          this.map_url = 'https://maps.googleapis.com/maps/api/staticmap?' +
            _.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&')
        })
      } else {
        this.selectedLocationInfo = null
      }
    })

    // Get the location Information
    function getLocationInfo(planId, id, callback) {
      return $http.get('/locations/' + planId + '/' + id + '/show')
        .then((response) => {
          return response.data
        })
    }

    this.showDetailLocationInfo = () => {
      this.selectedLocationInfo.id = +this.selectedLocationInfo.location_id      
      state.showDetailedLocationInfo.next(this.selectedLocationInfo)
    }

  }  
}

ViewModeLocationController.$inject = ['$http','state','configuration']

app.component('locationDetail', {
  template: `
  <style>
    .view-mode-container {
      position: relative; /* This will require the parent to have position: relative or absolute */
      height: 100%;
    }
    .view-mode-container > div {
      margin-top: 10px;
    }
  </style>
  <div class="view-mode-container" ng-if="$ctrl.selectedLocationInfo !== null">
    <img width="100%" ng-attr-src="{{$ctrl.map_url}}">
    <br>
    <div>Address: {{$ctrl.selectedLocationInfo.address}}</div>
    <div>HouseHolds: {{$ctrl.selectedLocationInfo.number_of_households}}</div>
    <div>Businesses: {{$ctrl.selectedLocationInfo.number_of_businesses}}</div>
    <div>Towers: {{$ctrl.selectedLocationInfo.number_of_towers}}</div>
    <div>Distance From Existing Network: {{$ctrl.selectedLocationInfo.distance_to_client_fiber | number: 0}}m</div>
    <div>Distance From Planned Network: {{$ctrl.selectedLocationInfo.distance_to_planned_network | number: 0}}m</div>
    <div>
      <button class="btn btn-primary" ng-click="$ctrl.showDetailLocationInfo()">More Information</button>
    </div>
  </div>
  `,
  bindings: {},
  controller: ViewModeLocationController
})