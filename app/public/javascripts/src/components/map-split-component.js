class MapSplitController {
  
  constructor($document, state) {
    this.state = state
    this.splitterObj = null

    $document.ready(() => {
      if (!this.splitterObj) {
        this.splitterObj = Split(['#map-canvas', '#sidebar'], {
          sizes: [75, 25]
        })
        // setTimeout(() => test.collapse(1), 5000)
      }
    })
  }
}

MapSplitController.$inject = ['$document', 'state']

app.component('mapSplit', {
  template: `
    <div style="position:absolute; top: 0px; left: 0px; bottom: 0px; right: 0px">
      <div id="map-canvas" style="float:left; height: 100%; width: 100%"></div>
      <div id="sidebar" style="float:left; background-color:#fff; height: 100%"></div>
    </div>
  `,
  bindings: { },
  controller: MapSplitController
})

