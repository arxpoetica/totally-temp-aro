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

    state.mapFeaturesSelectedEvent
    .subscribe((options) => {
      var locationId = null
      if (options.locations && options.locations.length > 0 && options.locations[0].location_id) {
        state.activeViewModePanel = state.viewModePanels.LOCATION_INFO
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
  <style scoped>
    .view-mode-container {
      position: relative; /* This will require the parent to have position: relative or absolute */
      height: 100%;
    }
    .view-mode-container > div {
      margin-top: 2px;
    }
    #subject:first-word {
      font-weight: bold;
    }
    #show-source{
      overflow: auto;
      max-height: 80px;
      padding-left: 30px !important;
    }
    #seperator {
      border-top: 1px solid #8c8b8b;
    }
  </style>
  <div class="view-mode-container" ng-if="$ctrl.selectedLocationInfo !== null">
    <img width="100%" ng-attr-src="{{$ctrl.map_url}}">
    <br>
    <div><b>Address:</b> {{$ctrl.selectedLocationInfo.address}}</div>
    <div><b>Latitude:</b> {{$ctrl.selectedLocationInfo.geog.coordinates[1]}}</div>
    <div><b>Longitude:</b> {{$ctrl.selectedLocationInfo.geog.coordinates[0]}}</div>
    <div><b>Census Block:</b> {{$ctrl.selectedLocationInfo.tabblock_id}}</div>
    
    <div id="seperator"><b>HouseHolds:</b> {{$ctrl.selectedLocationInfo.number_of_households}}</div>
    <span>
    <div id="show-source">
      <ul ng-if="$ctrl.selectedLocationInfo.locSourceIds.hhSourceIds.source_ids && 
        $ctrl.selectedLocationInfo.locSourceIds.hhSourceIds.source_ids.length > 0" style="list-style-type:none; padding:0; margin-bottom: 0px;">
        <li class="item" ng-repeat="target in $ctrl.selectedLocationInfo.locSourceIds.hhSourceIds.source_ids track by $index">
          {{ target }}
        </li>
      </ul>
    </div>
    <span>

    <div id="seperator"><b>Businesses:</b> {{$ctrl.selectedLocationInfo.number_of_businesses}}</div>
    <span>
    <div id="show-source">
      <ul ng-if="$ctrl.selectedLocationInfo.locSourceIds.bizSourceIds.source_ids && 
        $ctrl.selectedLocationInfo.locSourceIds.bizSourceIds.source_ids.length > 0" style="list-style-type:none; padding:0; margin-bottom: 0px;">
        <li class="item" ng-repeat="target in $ctrl.selectedLocationInfo.locSourceIds.bizSourceIds.source_ids track by $index">
          {{ target }}
        </li>
      </ul>
    </div>
    <span>

    <div id="seperator"><b>Towers:</b> {{$ctrl.selectedLocationInfo.number_of_towers}}</div>
    <span>
    <div id="show-source">
      <ul ng-if="$ctrl.selectedLocationInfo.locSourceIds.towerSourceIds.source_ids && 
        $ctrl.selectedLocationInfo.locSourceIds.towerSourceIds.source_ids.length > 0" style="list-style-type:none; padding:0; margin-bottom: 0px;">
        <li class="item" ng-repeat="target in $ctrl.selectedLocationInfo.locSourceIds.towerSourceIds.source_ids track by $index">
          {{ target }}
        </li>
      </ul>
    </div>
    <span>

    <div id="seperator"><b>Distance From Existing Network:</b> {{$ctrl.selectedLocationInfo.distance_to_client_fiber | number: 0}}m</div>
    <div><b>Distance From Planned Network:</b> {{$ctrl.selectedLocationInfo.distance_to_planned_network | number: 0}}m</div>
    

    <div>
      <button class="btn btn-primary" ng-click="$ctrl.showDetailLocationInfo()">More Information</button>
    </div>
  </div>
  `,
  bindings: {},
  controller: ViewModeLocationController
})