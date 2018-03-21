import ViewModeRoadSegmentController from './viewModeRoadSegmentController'

let roadSegmentDetail = {
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
}

export default roadSegmentDetail