import ViewModeLocationController from './viewModeLocationController'

let locationDetail = {
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
    .loc_attributes_container h5{
        font-weight: bold;
    }
  </style>
  <div class="view-mode-container" ng-if="$ctrl.selectedLocationInfo !== null">
    <img width="100%" ng-attr-src="{{$ctrl.map_url}}">
    <br>
    <div><b>Address:</b> {{$ctrl.selectedLocationInfo.address}}</div>
    <div><b>Latitude:</b> {{$ctrl.selectedLocationInfo.geog.coordinates[1]}}</div>
    <div><b>Longitude:</b> {{$ctrl.selectedLocationInfo.geog.coordinates[0]}}</div>
    <div><b>Census Block:</b> {{$ctrl.selectedLocationInfo.tabblock_id}}</div>
    <div id="seperator"></div>
    <div class="loc_attributes_container" ng-if="$ctrl.showAttributes">
        <h5>Additional Attributes</h5>
        <div ng-repeat="(k,v) in $ctrl.selectedLocationInfo.attributes">
            <div class="attribute_table">
                <div class="attribute_row">
                    <div class="attribute_cell key">{{k + ':'}}</div>
                    <div class="attribute_cell value">{{v}}</div>
                </div>
            </div>
        </div>
    </div>
    
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
}

export default locationDetail