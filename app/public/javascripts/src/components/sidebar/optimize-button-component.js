class OptimizeButtonController {
  constructor(state) {
    this.state = state
  }

  areInputsComplete() {
    var isValid = false
    if ((this.state.selectedLocations.getValue().size > 0 ||
      this.state.selectedServiceAreas.getValue().size > 0) && (
        this.state.hasLocationType('business') ||
        this.state.hasLocationType('household') ||
        this.state.hasLocationType('celltower'))
    )
      isValid = true

    return isValid
  }
}

OptimizeButtonController.$inject = ['state']

app.component('optimizeButton', {
  templateUrl: '/components/sidebar/optimize-button-component.html',
  bindings: {},
  controller: OptimizeButtonController
})