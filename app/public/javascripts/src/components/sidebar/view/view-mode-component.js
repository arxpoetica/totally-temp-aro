class ViewModeController {
  
  constructor(state) {
    this.state = state
    this.initialPanel

    this.state.showViewModeInfo
      .subscribe((options) => {
        if (options.locations && options.locations.length > 0) {
          this.initialPanel = 'LOCATION_INFO'
        } else if (options.roadSegments && options.roadSegments.length > 0) {
          this.initialPanel = 'ROAD_SEGMENT_INFO'
        }
      })
  }
}

ViewModeController.$inject = ['state']

app.component('viewMode', {
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
      margin-top: 10px; /*Line  break for each div*/
    }
  </style>

  <div class="plan-settings-container">
    <accordion style="position: relative; flex: 1 1 auto;" initial-expanded-panel="$ctrl.initialPanel">
      <accordion-panel-title title="'Location Info'" panel-id="'LOCATION_INFO'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'LOCATION_INFO'">
        <location-detail></road-segment-detail>
      </accordion-panel-contents>
      <accordion-panel-title title="'Road Segment Info'" panel-id="'ROAD_SEGMENT_INFO'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'ROAD_SEGMENT_INFO'">
        <road-segment-detail></road-segment-detail>
      </accordion-panel-contents>
    </accordion>
  </div>
  `,
  controller: ViewModeController
})