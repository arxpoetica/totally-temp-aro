class MapSplitController {
  
  constructor($document, $timeout, $scope) {
    this.$timeout = $timeout
    this.splitterObj = null
    this.isCollapsed = false
    this.sizesBeforeCollapse = null
    this.transitionTimeMsec = 100
    this.transitionCSS = `width ${this.transitionTimeMsec}ms`  // This must be the same for the map and sidebar, otherwise animations don't work correctly

    $document.ready(() => {
      if (!this.splitterObj) {
        this.splitterObj = Split(['#map-canvas', '#sidebar'], {
          sizes: [75, 25],
          minSize: 250,
          onDragEnd: () => {
            // Trigger a resize so that any tiles that have been uncovered will be loaded
            if (map) {
              google.maps.event.trigger(map, "resize")
            }
            // After dragging, if the size is non-zero, it means we have expanded the sidebar
            if (this.splitterObj.getSizes()[1] > 0) {
              this.isCollapsed = false
              this.sizesBeforeCollapse = null
              $scope.$apply()
            }
          }
        })
      }
    })
  }

  toggleCollapseSideBar() {
    if (this.isCollapsed) {
      // The sidebar is already collapsed. Un-collapse it by restoring the saved sizes
      this.splitterObj.setSizes(this.sizesBeforeCollapse)
      this.sizesBeforeCollapse = null
    } else {
      // Save the current sizes and then collapse the sidebar
      this.sizesBeforeCollapse = this.splitterObj.getSizes()
      this.splitterObj.setSizes([99, 1])
    }
    this.isCollapsed = !this.isCollapsed
    // Trigger a resize so that any tiles that have been uncovered will be loaded
    if (map) {
      // Call the resize a litle bit after animations finish, so that the right width is loaded
      this.$timeout(() => google.maps.event.trigger(map, "resize"), this.transitionTimeMsec + 50)
    }
  }
}

MapSplitController.$inject = ['$document', '$timeout', '$scope']

app.component('mapSplit', {
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
      .split.split-horizontal, .gutter.gutter-horizontal {
        height: 100%;
        float: left;
      }
      .expander {
        position: relative;
        left: -49px;
        top: -10px;
        width: 40px;
        height: 44px;
        background-color: #fff;
        border-radius: 0px 0px 0px 5px;
        border: #bbb solid 1px;
        border-top: none;
        border-right: none;
        padding: 8px;
        color: #aaa;
        cursor: pointer;
        box-shadow: #888 -4px 4px 6px;
        z-index: 2;
      }
      .expander :hover {
        color: #1a79db;
      }
      #map-canvas:before {
        box-shadow: -4px 0px 6px #888 inset;
        content: "";
        height: 100%;
        right: 0;
        position: absolute;
        width: 9px;
        z-index: 1;
      }
    </style>
    <!-- First define the container for both the map and the sidebar. -->
    <div style="position:absolute; top: 0px; left: 0px; bottom: 0px; right: 0px">

      <!-- Define the canvas that will hold the map. -->
      <div id="map-canvas" ng-style="{ float: 'left', height: '100%', width: '100%', transition: $ctrl.transitionCSS }"></div>

      <!-- Define the sidebar -->
      <div id="sidebar" ng-style="{ float: 'left', 'background-color': '#fff', height: '100%', padding: '10px', 'padding-left': '0px', transition: $ctrl.transitionCSS}">
        <!-- Define the "expander widget" that can be clicked to collapse/uncollapse the sidebar -->
        <div class="expander">
          <i ng-click="$ctrl.toggleCollapseSideBar()" ng-class="{'fa fa-2x': true, 'fa-arrow-circle-left': $ctrl.isCollapsed, 'fa-arrow-circle-right': !$ctrl.isCollapsed}"></i>
          <network-plan><network-plan/>
        </div>
        <div ng-show="!$ctrl.isCollapsed">
          <display-mode-buttons></display-mode-buttons>
        </div>
      </div>
    </div>
  `,
  bindings: { },
  controller: MapSplitController
})

