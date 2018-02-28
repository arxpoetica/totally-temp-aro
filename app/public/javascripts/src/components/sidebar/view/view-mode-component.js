class ViewModeController {
  
  constructor(state) {
    this.state = state
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
    <accordion style="position: relative; flex: 1 1 auto;" toggle-expanded-panel="$ctrl.state.activeViewModePanel">
      <accordion-panel-title title="'Location Info'" panel-id="$ctrl.state.viewModePanels.LOCATION_INFO"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.LOCATION_INFO">
        <location-detail></location-detail>
      </accordion-panel-contents>
      <accordion-panel-title title="'Road Segment Info'" panel-id="$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO">
        <road-segment-detail></road-segment-detail>
      </accordion-panel-contents>
      <accordion-panel-title title="'Edit Locations'" panel-id="$ctrl.state.viewModePanels.EDIT_LOCATIONS"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.EDIT_LOCATIONS">
        <location-editor ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.EDIT_LOCATIONS" map-global-object-name="map"></location-editor>
      </accordion-panel-contents>
    </accordion>
  </div>
  `,
  controller: ViewModeController
})