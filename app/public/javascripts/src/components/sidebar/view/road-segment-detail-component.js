class ViewModeRoadSegmentController {

  constructor(state, $timeout, configuration) {
    this.state = state
    this.$timeout = $timeout
    this.selectedEdgeInfo = null
    this.singleRoad

    state.selectedRoadSegments
    .subscribe((selectedRoadSegments) => {
      if (selectedRoadSegments.size > 0) {
        this.singleRoad = (selectedRoadSegments.size == 1) ? true : false
        this.selectedEdgeInfo = this.generateRoadSegmentsInfo(selectedRoadSegments)
      } else {
        this.selectedEdgeInfo = null
      }
      this.$timeout() // Will safely call $scope.$apply()
    })

  }

  generateRoadSegmentsInfo(roadSegments) {

    var roadSegmentsInfo = {
    }

    if(roadSegments.size == 1) {
      roadSegmentsInfo.gid = roadSegments[0].gid
      roadSegmentsInfo.edge_length = roadSegments[0].edge_length.toFixed(2)
    } else {
      roadSegmentsInfo.totalLength = [...roadSegments].reduce((total, item) => { return total + item.edge_length }, 0).toFixed(2)
      roadSegmentsInfo.count = roadSegments.length
    }

    //Temp values
    //Later we have to load it from response
    var constructionTypes = {
      aerial: Math.floor(roadSegments.size / 2),
      buried: Math.floor(roadSegments.size / 2)
    }

    var roadTypes = {
      highWay: roadSegments.size
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
    .road-info > div {
      margin-top: 10px; /*Line  break for each div*/
    }
  </style>
  
  <div class="plan-settings-container" ng-if="$ctrl.selectedEdgeInfo">
    <div class="road-info" ng-if="$ctrl.singleRoad">
      <div>Road Segment Id: {{$ctrl.selectedEdgeInfo.gid}}</div>
      <div>Length: {{$ctrl.selectedEdgeInfo.edge_length}}m</div>
    </div>
    <div class="road-info" ng-if="!$ctrl.singleRoad">
      <div>Total Length: {{$ctrl.selectedEdgeInfo.totalLength}}m</div>
      <div>Count: {{$ctrl.selectedEdgeInfo.count}}</div>
    </div>

    <div class="road-info">
      <div>Construction Type:</div>
      <table class="table table-condensed table-striped">
        <tr ng-repeat="(x, y) in $ctrl.selectedEdgeInfo.constructionTypes">
          <td>{{x}}</td>
          <td>{{y}}</td>  
        </tr>
      </table>

      <div>Road Type:</div>
      <table class="table table-condensed table-striped">
        <tr ng-repeat="(x, y) in $ctrl.selectedEdgeInfo.roadTypes">
          <td>{{x}}</td>
          <td>{{y}}</td>  
        </tr>
      </table>
    </div>
  </div>
  `,
  bindings: {},
  controller: ViewModeRoadSegmentController
})