class ViewModeRoadSegmentController {

  constructor(state, $timeout, configuration) {
    this.state = state
    this.$timeout = $timeout
    this.selectedEdgeInfo = null
    this.singleRoad

    state.showViewModeInfo
    .subscribe((options) => {
      if (options.roadSegments && options.roadSegments.length > 0) {
        this.singleRoad = (options.roadSegments.length == 1) ? true : false
        this.selectedEdgeInfo = this.generateRoadSegmentsInfo(options.roadSegments)
      } else {
        this.selectedEdgeInfo = null
      }
      this.$timeout() // Will safely call $scope.$apply()
    })

  }

  generateRoadSegmentsInfo(roadSegments) {

    var roadSegmentsInfo = {
    }

    if(roadSegments.length == 1) {
      roadSegmentsInfo.gid = roadSegments[0].gid
      roadSegmentsInfo.edge_length = roadSegments[0].edge_length.toFixed(2)
    } else {
      roadSegmentsInfo.totalLength = roadSegments.reduce((total, item) => { return total + item.edge_length }, 0).toFixed(2)
      roadSegmentsInfo.count = roadSegments.length
    }

    //Temp values
    //Later we have to load it from response
    var constructionTypes = {
      aerial: Math.floor(roadSegments.length/2),
      buried: Math.floor(roadSegments.length/2)
    }

    var roadTypes = {
      highWay: roadSegments.length
    }

    roadSegmentsInfo.constructionTypes = constructionTypes
    roadSegmentsInfo.roadTypes = roadTypes
    
    return roadSegmentsInfo
  }
}

ViewModeRoadSegmentController.$inject = ['state', '$timeout', 'configuration']

app.component('roadSegmentDetail', {
  template: `
  <style>
    .plan-settings-container {
      position: absolute;
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
    }
    .road-info > div {
      margin-top: 10px;
    }    
  </style>
  <div class="plan-settings-container" ng-if="$ctrl.selectedEdgeInfo">
    <accordion style="position: relative; flex: 1 1 auto;" initial-expanded-panel="'ROAD_SEGMENT_INFO'">
      <accordion-panel-title title="'Road Segment Info'" panel-id="'ROAD_SEGMENT_INFO'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'ROAD_SEGMENT_INFO'">
        <div class="road-info" ng-if="$ctrl.singleRoad">
          <div>Road Segment Id: {{$ctrl.selectedEdgeInfo.gid}}</div>
          <div>Length: {{$ctrl.selectedEdgeInfo.edge_length}}m</div>
        </div>
        <div class="road-info" ng-if="!$ctrl.singleRoad">
          <div>Total Length: {{$ctrl.selectedEdgeInfo.totalLength}}m</div>
          <div>Count: {{$ctrl.selectedEdgeInfo.count}}</div>
        </div>
      </accordion-panel-contents>

      <accordion-panel-title title="'Construction Type'" panel-id="'CONSTRUCTION_TYPE'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'CONSTRUCTION_TYPE'">
        <table class="table table-condensed table-striped">
          <tr ng-repeat="(x, y) in $ctrl.selectedEdgeInfo.constructionTypes">
            <td>{{x}}</td>
            <td>{{y}}</td>  
          </tr>
        </table>
      </accordion-panel-contents>

      <accordion-panel-title title="'Road Type'" panel-id="'ROAD_TYPE'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'ROAD_TYPE'">
        <table class="table table-condensed table-striped">
          <tr ng-repeat="(x, y) in $ctrl.selectedEdgeInfo.roadTypes">
            <td>{{x}}</td>
            <td>{{y}}</td>  
          </tr>
        </table>
      </accordion-panel-contents>
    </accordion>
  </div>
  `,
  bindings: {},
  controller: ViewModeRoadSegmentController
})