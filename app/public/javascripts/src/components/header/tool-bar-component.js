class ToolBarController {

  constructor($scope, state) {
    this.state = state
    this.state.showGlobalSettings
    .subscribe((newValue) => {})

    this.latestOverlay = null
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: false
    })

    this.drawingManager.addListener('overlaycomplete', (e) => {
      this.removeLatestOverlay()
      this.latestOverlay = e.overlay
  
      var points = e.overlay.getPath()
      var total = 0
      var prev = null
      points.forEach((point) => {
        if (prev) {
          total += google.maps.geometry.spherical.computeDistanceBetween(prev, point)
        }
        prev = point
      })
      this.measuredDistance = total
      swal({ title: 'Measured Distance', text: `${total * 0.000621371} mi` })
      if (!$scope.$$phase) { $scope.$apply() } // refresh UI
    })
  }

  openGlobalSettings() {
    this.state.showGlobalSettings.next(true)
  }

  setSelectionMode(selectionMode) {
    this.state.activeSelectionMode.next(selectionMode)
  }

  showPlanModal() {
    this.state.networkPlanModal.next(true)
  }

  createEphemeralPlan() {
    this.state.createEphemeralPlan()
    .then((ephemeralPlan) => {
      this.state.setPlan(ephemeralPlan)
    })
    .catch((err) => console.error(err))
  }

  savePlanAs() {
    var swalOptions = {
      title: 'Plan name required',
      text: 'Enter a name for saving the plan',
      type: 'input',
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Create Plan'
    }

    var currentPlan = this.state.plan.getValue()
    if (currentPlan.ephemeral) {
      // This is an ephemeral plan
      swal(swalOptions,
      (planName) => {
        if (planName) {
          this.state.makeCurrentPlanNonEphemeral(planName)
        }
      })
    } else {
      // Copy the plan
      swal(swalOptions,
      (planName) => {
        if (planName) {
          this.state.copyCurrentPlanTo(planName)
        }
      })
    }
  }

  removeLatestOverlay () {
    this.latestOverlay && this.latestOverlay.setMap(null)
    this.latestOverlay = null
  }

  toggleMeasuringStick() {
    var current = this.drawingManager.getMap()
    this.drawingManager.setMap(current ? null : map)
    this.removeLatestOverlay()
    if (current) this.measuredDistance = null
  }

}

ToolBarController.$inject = ['$scope','state']

app.component('toolBar', {
  templateUrl: '/components/header/tool-bar-component.html',
  bindings: {},
  controller: ToolBarController
})

