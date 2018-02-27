class ViewModeLocationController {

  constructor() {
    this.addLocationData = {
      types: [
        'Business',
        'Household',
        'Cell tower'
      ],
      selectedType: 'Business',
      numberOfLocations: 1
    }
  }
}

// ViewModeLocationController.$inject = []

app.component('locationEditor', {
  templateUrl: '/components/sidebar/view/location-editor-component.html',
  bindings: {},
  controller: ViewModeLocationController
})