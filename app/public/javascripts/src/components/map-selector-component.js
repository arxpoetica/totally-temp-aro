class MapSelectorController {
  constructor($document, state) {
    this.state = state
    this.mapRef = null

    $document.ready(() => {
      // We should have a map variable at this point
      this.mapRef = window[this.mapGlobalObjectName]
    })

  }

  $onInit() {
    if (!this.mapGlobalObjectName) {
      console.error('ERROR: You must specify the name of the global variable that contains the map object.')
    }
  }
}

MapSelectorController.$inject = ['$document', 'state']

app.component('mapSelector', {
  template: '', // No markup for this component. It interacts with the map directly.
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: MapSelectorController
})

