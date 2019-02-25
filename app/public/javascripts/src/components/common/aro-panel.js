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
  }
}

AroPanelController.$inject = ['state', '$timeout']

let aroPanel = {
  template: `
  <div class="map-tool panel panel-primary" id="measuring-stick-result" ng-show="$ctrl.showPanel">
    <div class="panel-heading">
      {{ $ctrl.panelInfo }} {{ $ctrl.measuredDistance * 3.28084 | number: 0 }} ft
    </div>
  </div>
  `,
  controller: AroPanelController
}

export default aroPanel
