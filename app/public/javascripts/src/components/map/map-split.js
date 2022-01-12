import PuppeteerMessages from '../common/puppeteer-messages'
import ToolBarActions from '../../react/components/header/tool-bar-actions'

class MapSplitController {
  constructor ($document, $timeout, $scope, state, $compile, $ngRedux) {
    this.$timeout = $timeout
    this.state = state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)
    this.splitterObj = null
    this.isCollapsed = false
    this.sizesBeforeCollapse = null
    this.transitionTimeMsec = 100
    this.transitionCSS = `width ${this.transitionTimeMsec}ms` // This must be the same for the map and sidebar, otherwise animations don't work correctly

    $document.ready(() => {
      if (!this.splitterObj) {
        this.splitterObj = Split(['#map-canvas-container', '#sidebar'], {
          sizes: [window.GLOBAL_MAP_SPLITTER_INITIAL_WIDTH || 75, window.GLOBAL_SIDEBAR_INITIAL_WIDTH || 25],
          minSize: [680, 310],
          onDragEnd: () => {
            // Trigger a resize so that any tiles that have been uncovered will be loaded
            if (map) {
              google.maps.event.trigger(map, 'resize')
            }
            if (map.getStreetView().getVisible()) {
              google.maps.event.trigger(panorama, 'resize')
            }
            const getSidebarWidth = this.splitterObj.getSizes()[1]
            this.state.sidebarWidth = getSidebarWidth
            this.setSidebarWidth(getSidebarWidth)
            // After dragging, if the size is non-zero, it means we have expanded the sidebar
            if (this.splitterObj.getSizes()[1] > 0) {

              // To Trigger refreshToolbar() in tool-bar.jsx by creating the custom event when sidebar resized
              //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
              var event = new CustomEvent('toolBarResized');
              window.dispatchEvent(event);

              this.isCollapsed = false
              this.sizesBeforeCollapse = null
              $scope.$apply()
            }
          }
        })
      }
      let element = $compile('<map-toggle-component user-perspective="$ctrl.state.loggedInUser.perspective" map-global-object-name="map"></map-toggle-component>')($scope)
      element[0].index = 3
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(element[0])
    })
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $doCheck () {
    // When we are in "Report Mode", destroy the splitter as it does a "width: calc(100% - 5px)" for the map container.
    // The sidebar is ng-if'ed and wont show up. The map will take up 100% of the window.
    if (this.state.isReportMode && this.splitterObj) {
      this.splitterObj.destroy()
      this.splitterObj = null
    }
  }

  toggleCollapseSideBar () {
    if (this.isCollapsed) {
      // The sidebar is already collapsed. Un-collapse it by restoring the saved sizes
      this.splitterObj.setSizes(this.sizesBeforeCollapse)
      this.sizesBeforeCollapse = null

      // To Trigger refreshToolbar() in tool-bar.jsx by creating the custom event when sidebar expand
      //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
      var event = new CustomEvent('toolBarResized');
      this.$timeout(() => window.dispatchEvent(event), this.transitionTimeMsec + 50)
    } else {
      // Save the current sizes and then collapse the sidebar
      this.sizesBeforeCollapse = this.splitterObj.getSizes()
      this.splitterObj.setSizes([99.5, 0.5])

      // To Trigger refreshToolbar() in tool-bar.jsx by creating the custom event when sidebar collapse
      //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
      var event = new CustomEvent('toolBarResized');
      this.$timeout(() => window.dispatchEvent(event), this.transitionTimeMsec + 50)
    }
    this.isCollapsed = !this.isCollapsed
    // Trigger a resize so that any tiles that have been uncovered will be loaded
    if (map) {
      // Call the resize a litle bit after animations finish, so that the right width is loaded
      this.$timeout(() => google.maps.event.trigger(map, 'resize'), this.transitionTimeMsec + 50)
    }
    if (map.getStreetView().getVisible()) {
      this.$timeout(() => google.maps.event.trigger(panorama, 'resize'), this.transitionTimeMsec + 50)
    }
  }

  mapStateToThis (reduxState) {
    return {
      disableMap: reduxState.planEditor.isCalculatingSubnets ||
        reduxState.planEditor.isCreatingObject ||
        reduxState.planEditor.isModifyingObject ||
        reduxState.planEditor.isCommittingTransaction ||
        reduxState.planEditor.isEnteringTransaction,
      showToolBox: reduxState.tool.showToolBox,
      rSelectedDisplayMode: reduxState.toolbar.rSelectedDisplayMode,
      rSelectedToolBarAction: reduxState.toolbar.selectedToolBarAction,
      rIsRulerEnabled: reduxState.toolbar.isRulerEnabled,
      rPlan: reduxState.plan.activePlan,
      rSelectedTargetSelectionMode: reduxState.toolbar.selectedTargetSelectionMode,
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      setSidebarWidth: sidebarWidth => dispatch(ToolBarActions.setSidebarWidth(sidebarWidth)),
    }
  }
}

MapSplitController.$inject = ['$document', '$timeout', '$scope', 'state', '$compile', '$ngRedux']

let mapSplit = {
  // NOTE: Cannot use a templateUrl for this component, as there is code in index.html that depends upon the "map-canvas"
  // element being present on document.ready(). With a templateUrl, the element is not present on document.ready() and
  // the map is never initialized.
  template: `
    <style scoped>
    .split {
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .gutter {
      background-color: #fff;
    }

    .gutter.gutter-horizontal {
      cursor: ew-resize;
      border-left: #bbb solid 1px;
    }

    .gutter:hover {
      background-color: #ccc;
    }

    .split.split-horizontal,
    .gutter.gutter-horizontal {
      height: 100%;
      float: left;
    }

    .expander-position {
      float: left;
      position: relative;
      left: -49px;
      top: -10px;
      width: 0px;
      height: 0px;
      z-index: 2;
    }

    .expander-content {
      width: 40px;
      height: 60px;
      background-color: #fff;
      border-radius: 0px 0px 0px 5px;
      border: #bbb solid 1px;
      border-top: none;
      border-right: none;
      padding: 8px;
      color: #aaa;
      cursor: pointer;
      box-shadow: #888 -4px 4px 6px;
      line-height: 55px;
      /* To vertically center the icon */
    }

    .expander-content :hover {
      color: #1a79db;
    }

    .map-canvas-drop-shadow:before {
      box-shadow: -4px 0px 6px #888 inset;
      content: "";
      height: 100%;
      right: 0;
      position: absolute;
      width: 9px;
      z-index: 1;
    }

    .ui-note-notes-contain{
      text-shadow: #ffffff -1px 1px;
      position: absolute;
      left: 25px;
      bottom: 0px;
      overflow: visible;
      font-weight: bold;
    }

    .ui-note-noteline{
      white-space: nowrap;
    }

    .ui-note-persistent{
      display: inline-block;
      background: rgba(250, 250, 250, 0.7);
      padding-left: 0.5em;
      border: solid 1px #c0c0c0;
    }

    .ui-note-button{
      pointer-events: all;
      margin-left: 0.5em;
      cursor: pointer;
    }

  </style>
  <!-- First define the container for both the map and the sidebar. -->
  <div class="app_wrapper_container {{($ctrl.state.configuration.ARO_CLIENT === 'frontier') ? 'footer' : ''}}">

    <!-- Define the canvas that will hold the map. -->
    <div id="map-canvas-container" ng-style="{ position: 'relative', float: 'left', height: '100%', transition: $ctrl.transitionCSS }">
      <div id="map-canvas" ng-class="{ 'map-canvas': true, 'map-canvas-drop-shadow': !$ctrl.state.isReportMode }" style="position: relative; overflow: hidden;"></div>
      <!-- Technically the toolbar, etc should be a child of the map canvas, but putting these elements in the map canvas
          causes the map to not show up -->
      <div id="header-bar-container" style="position: absolute; top: 0px; width: 100%; height: 55px; display: flex; flex-direction: row;">
        <div style="flex: 0 0 70px;"></div>
        <!-- Created a 'reactCompClass' to get the <r-too-bar> component elements in tool-bar.jsx -->
        <r-tool-bar map-global-object-name="map" class="reactCompClass" style="flex: 1 1 auto; position: relative;"></r-tool-bar>
        <network-plan style="flex: 0 0 auto; margin: auto;"></network-plan>
        <div id="spacerForIconOnSidebar" style="flex: 0 0 40px;"></div>
        <r-tool-box ng-if="$ctrl.showToolBox"></r-tool-box>
      </div>
      <!-- Plan target map selector should be active only if we are in analysis mode -->
      <map-selector-plan-target map-global-object-name="map"
        ng-if="(!$ctrl.state.selectedToolBarAction || $ctrl.state.selectedToolBarAction === $ctrl.state.toolbarActions.POLYGON_SELECT || !$ctrl.rSelectedToolBarAction || $ctrl.rSelectedToolBarAction === $ctrl.state.toolbarActions.POLYGON_SELECT)
               && $ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.ANALYSIS
               && (!$ctrl.state.isRulerEnabled || !$ctrl.rIsRulerEnabled)">
      </map-selector-plan-target>
      <r-map-selector-export-locations 
        ng-if="$ctrl.selectedDisplayMode === $ctrl.displayModes.VIEW
          && $ctrl.rSelectedTargetSelectionMode === $ctrl.state.targetSelectionModes.POLYGON_EXPORT_TARGET"
      />
      <r-toast-container></r-toast-container>
      <!-- A div that overlays on the map to denote disabled state. When shown, it will prevent any keyboard/mouse interactions with the map.
           Useful when you have made a slow-ish request to service and want to prevent further map interactions till you get a response. -->
      <div ng-if="$ctrl.disableMap" style="background-color: white; opacity: 0.5; position: absolute; left: 0px; top: 0px; right: 0px; bottom: 0px;">
        <div class="d-flex" style="height: 100%; text-align: center; align-items: center;">
          <i class="fa fa-5x fa-spinner fa-spin" style="width: 100%;"></i>
        </div>
      </div>
      <r-equipment-drop-target></r-equipment-drop-target>
      <r-context-menu></r-context-menu>
    </div>

    <!-- Define the sidebar -->
    <div ng-if="!$ctrl.state.isReportMode" id="sidebar" ng-style="{ float: 'left', 'background-color': '#fff', height: '100%', padding: '10px 0px', transition: $ctrl.transitionCSS}">
      <!-- Define the "expander widget" that can be clicked to collapse/uncollapse the sidebar. Note that putting
              the expander in one div affects the flow of elements in the sidebar, so we create a 0px by 0px div, and
              use this div to position the contents of the expander. This makes sure we don't affect flow. -->
      <div class="expander-position">
        <div class="expander-content" ng-click="$ctrl.toggleCollapseSideBar()" ng-mouseenter="$ctrl.hovering = true" ng-mouseleave="$ctrl.hovering = false">
          <!-- Why so complicated? The use case is:
                    1. When expanded, it should show an arrow pointing right
                    2. When collapsed and not hovering, it should show the display mode that is currently active
                    3. When collapsed and hovering, it should show an arrow pointing left -->
          <i ng-class="{'fa fa-2x': true,
                            'fa-eye': !$ctrl.hovering && $ctrl.isCollapsed && $ctrl.selectedDisplayMode === $ctrl.displayModes.VIEW,
                            'fa-wrench': !$ctrl.hovering && $ctrl.isCollapsed && $ctrl.selectedDisplayMode === $ctrl.displayModes.ANALYSIS,
                            'fa-cog': !$ctrl.hovering && $ctrl.isCollapsed && $ctrl.selectedDisplayMode === $ctrl.displayModes.PLAN_SETTINGS,
                            'fa-arrow-circle-right': !$ctrl.isCollapsed,
                            'fa-arrow-circle-left': $ctrl.hovering && $ctrl.isCollapsed }">
              </i>
        </div>
      </div>
      <!-- Add a wrapping div because the expander changes the layout even though it is outside the panel -->
      <div ng-show="!$ctrl.isCollapsed" style="display: flex; flex-direction: column; height: 100%; padding-right: 10px;">
        <div style="overflow: auto; flex: 0 0 auto">
          <!-- this is necessary to make the display-mode-buttons flow correctly -->
          <display-mode-buttons></display-mode-buttons>
        </div>
        <div style="flex: 1 1 auto; position: relative;">
          <!-- ng-if is important here because the plan settings components implement $onDestroy() to show a messagebox
              when destroyed to ask if settings should be saved -->
          <view-mode ng-if="$ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.VIEW || $ctrl.rSelectedDisplayMode === 'VIEW'"></view-mode>
          <r-analysis-mode ng-if="$ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.ANALYSIS && $ctrl.state.plan.planType != 'RING' && $ctrl.rSelectedDisplayMode !== 'VIEW'" && $ctrl.rPlan.planType != 'RING'"></r-analysis-mode>
          <r-ring-editor ng-if="$ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.EDIT_RINGS && $ctrl.rSelectedDisplayMode !== 'VIEW'"></r-ring-editor>
          <r-plan-settings ng-if="$ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.PLAN_SETTINGS && $ctrl.rSelectedDisplayMode !== 'VIEW'"></r-plan-settings>
          <plan-editor-container ng-if="$ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.EDIT_PLAN && $ctrl.rSelectedDisplayMode !== 'VIEW'">
          </plan-editor-container>
          <r-aro-debug ng-if="$ctrl.state.selectedDisplayMode.getValue() === $ctrl.state.displayModes.DEBUG && $ctrl.rSelectedDisplayMode !== 'VIEW'"></r-aro-debug>
        </div>
      </div>
    </div>
  </div>
  <div class="ui-note" style="pointer-events: none; position: absolute; left: 0px; bottom: 25px;" >
    <!-- There used to be a "spinner" icon here, which has been removed. On profiling, we found that the
        spinning animation caused the tile rendering to be two times slower (e.g. 200ms with spinner vs 100 ms without)
        Do NOT add any kind of animated element in this control unless you suppress it when tiles are rendering -->
    <div class="ui-note-notes-contain">
      <div class="ui-note-noteline" ng-if="$ctrl.state.areTilesRendering">Rendering Tiles</div>
      <r-ui-notifications></r-ui-notifications>
    </div>
  </div>
  <r-frontier-footer />
  `,
  bindings: { },
  controller: MapSplitController
}

export default mapSplit
