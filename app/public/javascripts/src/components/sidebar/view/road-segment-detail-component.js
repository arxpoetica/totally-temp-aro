class ViewModeRoadSegmentController {

  constructor(state, $timeout, configuration) {
    this.state = state
    this.$timeout = $timeout
    this.selectedEdgeInfo = null
    this.singleRoad

    state.showViewModeInfo
    .subscribe((options) => {
      if (options.roadSegments && options.roadSegments.length > 0) {
        if(options.roadSegments.length > 1) {
          this.singleRoad = false
          this.selectedEdgeInfo = this.generateRoadSegmentsInfo(options.roadSegments)
        } else {
          this.singleRoad = true
          this.selectedEdgeInfo = options.roadSegments[0]
        }
      } else {
        this.selectedEdgeInfo = null
      }
      this.$timeout() // Will safely call $scope.$apply()
    })

  }

  generateRoadSegmentsInfo(roadSegments) {
    var roadSegmentsInfo = {
      totalLength: roadSegments.reduce((total, item) => { return total + item.edge_length }, 0),
      count: roadSegments.length
    }
    return roadSegmentsInfo
  }
}

ViewModeRoadSegmentController.$inject = ['state', '$timeout', 'configuration']

app.component('roadSegmentDetail', {
  template: `
  <style>
    .view-mode-container {
      position: relative; /* This will require the parent to have position: relative or absolute */
      height: 100%;
    }
    .title-info {
      background: gray;
      text-align: center;
      line-height: 30px;
    }
  </style>
  <div class="view-mode-container">
    <br>

    <div ng-if="$ctrl.selectedEdgeInfo && $ctrl.singleRoad">
      <div class="title-info">Road Segment Info</div>
      <div>Road Segment Id: {{$ctrl.selectedEdgeInfo.gid}}</div>
      <div>Length: {{$ctrl.selectedEdgeInfo.edge_length}}m</div>
      <div>Construction type: aerial, buried, etc.</div>
      <div>Road type: highway</div>
    </div>

    <div ng-if="$ctrl.selectedEdgeInfo && !$ctrl.singleRoad">
      <div class="title-info">Road Segment Info</div>
      <div>Total Length: {{$ctrl.selectedEdgeInfo.totalLength}}m</div>
      <div>Count: {{$ctrl.selectedEdgeInfo.count}}</div>
      <div>Construction type: aerial, buried, etc.</div>
      <div>Road type: highway</div>
    </div>
  </div>
  `,
  bindings: {},
  controller: ViewModeRoadSegmentController
})