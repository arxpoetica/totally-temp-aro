class AroPanelController {
  constructor (state, $timeout) {
    this.state = state
    this.$timeout = $timeout

    this.showPanel = true
    this.measuredDistance = 0
    this.state.measuredDistance.subscribe((measuredDistance) => {
      this.showPanel = !!measuredDistance
      this.panelInfo = 'Measured distance:'
      this.measuredDistance = measuredDistance
      this.$timeout()
    })

    window.addEventListener('measuredDistance', (measuredDistance) => { 
      this.showPanel = !!measuredDistance.detail
      this.panelInfo = 'Measured distance:'
      this.measuredDistance = measuredDistance.detail
      this.$timeout()
    });
  }
}

AroPanelController.$inject = ['state', '$timeout']

let aroPanel = {
  template: `
  <div class="map-tool panel panel-primary" id="measuring-stick-result" ng-show="$ctrl.showPanel">
    <div class="panel-heading">
      {{ $ctrl.panelInfo }} {{ $ctrl.measuredDistance * $ctrl.state.configuration.units.meters_to_length_units | number: 0 }}
      {{ $ctrl.state.configuration.units.length_units }}
    </div>
  </div>
  `,
  controller: AroPanelController
}

export default aroPanel
