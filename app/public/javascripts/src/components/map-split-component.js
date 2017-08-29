class MapSplitController {
  
  constructor($document, state) {
    this.state = state
    this.splitterObj = null

    $document.ready(() => {
      if (!this.splitterObj) {
        this.splitterObj = Split(['#map-canvas', '#sidebar'], {
          sizes: [75, 25],
          onDragEnd: () => {
            // Trigger a resize so that any tiles that have been uncovered will be loaded
            if (map) {
              google.maps.event.trigger(map, "resize")
            }
          }
        })
        // setTimeout(() => test.collapse(1), 5000)
      }
    })
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
    </style>
    <div style="position:absolute; top: 0px; left: 0px; bottom: 0px; right: 0px">
      <div id="map-canvas" style="float:left; height: 100%; width: 100%"></div>
      <div id="sidebar" style="float:left; background-color:#fff; height: 100%"></div>
    </div>
  `,
  bindings: { },
  controller: MapSplitController
})

