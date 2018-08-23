class ViewModeController {
  
  constructor($scope, state, configuration) {
    this.state = state
    this.currentUser = state.loggedInUser
    $scope.configuration = configuration
  }
}

ViewModeController.$inject = ['$scope', 'state', 'configuration']

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
                                && (configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.LOCATION_INFO].show)">
        </location-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Equipment Info'" panel-id="$ctrl.state.viewModePanels.EQUIPMENT_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.EQUIPMENT_INFO].show"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.EQUIPMENT_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.EQUIPMENT_INFO].show">
        <equipment-detail></equipment-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Boundaries Info'" panel-id="$ctrl.state.viewModePanels.BOUNDARIES_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.BOUNDARIES_INFO].show"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.BOUNDARIES_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.BOUNDARIES_INFO].show">
        <boundary-detail></boundary-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Road Segment Info'" panel-id="$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO].show"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.ROAD_SEGMENT_INFO].show">
        <road-segment-detail></road-segment-detail>
      </accordion-panel-contents>

      <accordion-panel-title title="'Plan Info'" panel-id="$ctrl.state.viewModePanels.PLAN_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.PLAN_INFO].show"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.PLAN_INFO" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.PLAN_INFO].show">
        <network-plan-manage ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.PLAN_INFO"></network-plan-manage>
      </accordion-panel-contents>
      <accordion-panel-title title="'Plan Summary'" panel-id="$ctrl.state.viewModePanels.PLAN_SUMMARY_REPORTS" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.PLAN_SUMMARY_REPORTS].show"></accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.PLAN_SUMMARY_REPORTS" ng-if="configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.PLAN_SUMMARY_REPORTS].show">
        <summary-reports ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.PLAN_SUMMARY_REPORTS"></summary-reports>
      </accordion-panel-contents>
      <!-- Planner coverage is a little different. Show it only if we are in COVERAGE_BOUNDARY mode. -->
      <accordion-panel-title title="'Coverage Boundary'"
                             panel-id="$ctrl.state.viewModePanels.COVERAGE_BOUNDARY"
                             ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.COVERAGE_BOUNDARY
                                    && $ctrl.state.selectedTargetSelectionMode === $ctrl.state.targetSelectionModes.COVERAGE_BOUNDARY 
                                    && configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.COVERAGE_BOUNDARY].show">
      </accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.COVERAGE_BOUNDARY"
                                ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.COVERAGE_BOUNDARY
                                       && $ctrl.state.selectedTargetSelectionMode === $ctrl.state.targetSelectionModes.COVERAGE_BOUNDARY
                                       && configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.COVERAGE_BOUNDARY].show">
        <coverage-boundary map-global-object-name="map"></coverage-boundary>
      </accordion-panel-contents>
      <!-- Edit Locations is a little different. Show it only if we are in EDIT_LOCATION mode. -->
      <accordion-panel-title title="'Edit Locations'"
                             panel-id="$ctrl.state.viewModePanels.EDIT_LOCATIONS"
                             ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.EDIT_LOCATIONS 
                             && configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.EDIT_LOCATIONS].show">
      </accordion-panel-title>
      <accordion-panel-contents panel-id="$ctrl.state.viewModePanels.EDIT_LOCATIONS"
                                ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.EDIT_LOCATIONS
                                       && configuration.perspective.viewModePanels[$ctrl.state.viewModePanels.EDIT_LOCATIONS].show">
        <location-editor map-global-object-name="map"></location-editor>
      </accordion-panel-contents>
    </accordion>
  </div>
  `,
  controller: ViewModeController
}

export default viewMode