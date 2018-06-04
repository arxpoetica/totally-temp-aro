class ViewModeController {
  
  constructor(state) {
    this.state = state
  }
}

ViewModeController.$inject = ['state']

let viewMode = {
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
        <location-detail ng-if="($ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.VIEW)
                                && ($ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.LOCATION_INFO)">
        </location-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Equipment Info'" panel-id="$ctrl.state.viewModePanels.EQUIPMENT_INFO"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.EQUIPMENT_INFO">
        <equipment-detail></equipment-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Boundaries Info'" panel-id="$ctrl.state.viewModePanels.BOUNDARIES_INFO"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.BOUNDARIES_INFO">
        <boundary-detail></boundary-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Road Segment Info'" panel-id="$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO" ng-if="$ctrl.state.loggedInUser.rol === 'admin'"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO" ng-if="$ctrl.state.loggedInUser.rol === 'admin'">
        <road-segment-detail></road-segment-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Plan Info'" panel-id="$ctrl.state.viewModePanels.PLAN_INFO" ng-if="$ctrl.state.loggedInUser.rol === 'admin'"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.PLAN_INFO" ng-if="$ctrl.state.loggedInUser.rol === 'admin'">
        <network-plan-manage ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.PLAN_INFO"></network-plan-manage>
      </accordion-panel-contents>
      <!-- Planner coverage is a little different. Show it only if we are in COVERAGE_BOUNDARY mode. -->
      <accordion-panel-title title="'Coverage Boundary'"
                             panel-id="$ctrl.state.viewModePanels.COVERAGE_BOUNDARY"
                             ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.COVERAGE_BOUNDARY
                                    && $ctrl.state.selectedTargetSelectionMode === $ctrl.state.targetSelectionModes.COVERAGE_BOUNDARY">
      </accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.COVERAGE_BOUNDARY"
                                ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.COVERAGE_BOUNDARY
                                       && $ctrl.state.selectedTargetSelectionMode === $ctrl.state.targetSelectionModes.COVERAGE_BOUNDARY">
        <coverage-boundary map-global-object-name="map"></coverage-boundary>
      </accordion-panel-contents>
      <!-- Edit Locations is a little different. Show it only if we are in EDIT_LOCATION mode. -->
      <accordion-panel-title title="'Edit Locations'"
                             panel-id="$ctrl.state.viewModePanels.EDIT_LOCATIONS"
                             ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.EDIT_LOCATIONS">
      </accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.EDIT_LOCATIONS"
                                ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.EDIT_LOCATIONS">
        <location-editor map-global-object-name="map"></location-editor>
      </accordion-panel-contents>
    </accordion>
  </div>
  `,
  controller: ViewModeController
}

export default viewMode