class ViewModeController {
  
  constructor(state) {
    this.state = state
    this.togglePanel = 'LOCATION_INFO'
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
    <accordion style="position: relative; flex: 1 1 auto;" toggle-expanded-panel="$ctrl.togglePanel">
      <accordion-panel-title title="'Location Info'" panel-id="'LOCATION_INFO'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'LOCATION_INFO'">
        <location-detail></location-detail>
      </accordion-panel-contents>
      <accordion-panel-title title="'Road Segment Info'" panel-id="'ROAD_SEGMENT_INFO'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'ROAD_SEGMENT_INFO'">
        <road-segment-detail></road-segment-detail>
      </accordion-panel-contents>
      <accordion-panel-title title="'Edit Locations'" panel-id="'EDIT_LOCATIONS'"></accordion-panel-title>
      <accordion-panel-contents panel-id="'EDIT_LOCATIONS'">
        <location-editor></location-editor>
      </accordion-panel-contents>
    </accordion>
  </div>
  `,
  controller: ViewModeController
})