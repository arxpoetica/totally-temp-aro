class MapSplitController {
  
  constructor($document, $timeout, $scope, state) {
    this.$timeout = $timeout
    this.state = state
    this.displayModes = state.displayModes
    state.selectedDisplayMode.subscribe((selectedDisplayMode) => this.selectedDisplayMode = selectedDisplayMode)
    this.splitterObj = null
    this.isCollapsed = false
    this.sizesBeforeCollapse = null
    this.transitionTimeMsec = 100
    this.transitionCSS = `width ${this.transitionTimeMsec}ms`  // This must be the same for the map and sidebar, otherwise animations don't work correctly

    $document.ready(() => {
      if (!this.splitterObj) {
        this.splitterObj = Split(['#map-canvas-container', '#sidebar'], {
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
            state.splitterObj.next(this.splitterObj)
          }
        })
        state.splitterObj.next(this.splitterObj)
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

MapSplitController.$inject = ['$document', '$timeout', '$scope', 'state']

app.component('mapSplit', {
  templateUrl: '/components/map/map-split-component.html',
  bindings: { },
  controller: MapSplitController
})

