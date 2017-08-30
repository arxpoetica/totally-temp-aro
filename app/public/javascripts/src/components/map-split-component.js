class MapSplitController {
  
  constructor($document, state) {
    this.state = state
    this.splitterObj = null
    this.isCollapsed = false
    this.sizesBeforeCollapse = null

    $document.ready(() => {
      if (!this.splitterObj) {
        this.splitterObj = Split(['#map-canvas', '#sidebar'], {
          sizes: [75, 25],
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
      this.splitterObj.collapse(1)
    }
    this.isCollapsed = !this.isCollapsed
    // Trigger a resize so that any tiles that have been uncovered will be loaded
    if (map) {
      google.maps.event.trigger(map, "resize")
    }
  }
}

MapSplitController.$inject = ['$document', 'state']

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
        background-repeat: no-repeat;
        background-position: 50%;
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
        top: 0px;
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
      }
      .expander :hover {
        color: #1a79db;
      }
    </style>
    <!-- First define the container for both the map and the sidebar. -->
    <div style="position:absolute; top: 0px; left: 0px; bottom: 0px; right: 0px">

      <!-- Define the canvas that will hold the map -->
      <div id="map-canvas" style="float:left; height: 100%; width: 100%"></div>

      <!-- Define the sidebar -->
      <div id="sidebar" style="float:left; background-color:#fff; height: 100%">
        <!-- Define the "expander widget" that can be clicked to collapse/uncollapse the sidebar -->
        <div class="expander" ng-click="$ctrl.toggleCollapseSideBar()">
          <i ng-class="{'fa fa-2x': true, 'fa-arrow-circle-left': $ctrl.isCollapsed, 'fa-arrow-circle-right': !$ctrl.isCollapsed}"></i>
        </div>
      </div>
    </div>
  `,
  bindings: { },
  controller: MapSplitController
})

