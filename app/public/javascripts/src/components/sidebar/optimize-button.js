class OptimizeButtonController {
  constructor(state) {
    this.state = state
  }

  areInputsComplete() {
    var isValid = false
    if ((this.state.selectedLocations.getValue().size > 0 ||
      this.state.selectedServiceAreas.getValue().size > 0) && (
        this.state.locationInputSelected('business') ||
        this.state.locationInputSelected('household') ||
        this.state.locationInputSelected('celltower'))
    )
      isValid = true

    return isValid
  }

  saveExpertMode(){
    this.state.loadOptimizationOptionsFromJSON(JSON.parse(this.state.expertModeBody))
  }

}

OptimizeButtonController.$inject = ['state']

let optimizeButton = {
  templateUrl: '/components/sidebar/optimize-button.html',
  bindings: {},
  controller: OptimizeButtonController
}

export default optimizeButton