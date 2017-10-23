class ToolBarController {

  constructor($element, state, map_tools) {
    this.state = state
    this.$element = $element
    this.marginPixels = 10  // Margin between the container and the div containing the buttons
    this.dropdownWidthPixels = 36 // The width of the dropdown button
    this.map_tools = map_tools
    this.showDropDown = false

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
    this.state.selectedTargetSelectionMode = selectionMode
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

  toggleViewSettings() {
    var viewSettingConfig = {
      id: 'map_settings',
      name: 'View Settings',
      short_name: 'V',
      icon: 'fa fa-eye fa-2x'
    }
    this.map_tools.toggle(viewSettingConfig)
  }

  $doCheck() {
    if (this.$element) {
      // Some of the buttons may be in the dropdown menu because the toolbar is collapsed.
      // Move them into the main toolbar before checking for button sizes.
      var toolbarRoot = this.$element.find('.tool-bar')[0]
      var dropdownRoot = this.$element.find('.tool-bar .dropdown')[0]
      // The width of the toolbar is the clientWidth minus the margins minus the width of the dropdown.
      // We assume that the dropdown is shown while computing which buttons to collapse.
      var toolbarWidth = this.$element[0].clientWidth - this.marginPixels * 2.0 - this.dropdownWidthPixels
      var dropdownUL = this.$element.find('.tool-bar .dropdown ul')[0]
      // Loop through all the <li> elements in the dropdown. These <li> elements contain the buttons.
      var dropdownItems = this.$element.find('.tool-bar .dropdown ul li')
      for (var i = 0; i < dropdownItems.length; ++i) {
        if (dropdownItems[i].childNodes.length > 0) {
          toolbarRoot.insertBefore(dropdownItems[i].childNodes[0], dropdownRoot)
        }
      }
      // Clear all <li> elements from the dropdown.
      while(dropdownUL.hasChildNodes()) {
        dropdownUL.removeChild(dropdownUL.lastChild)
      }

      // All buttons are in the toolbar. Go through all of them and mark the ones to be collapsed (if any).
      var cumulativeWidth = 0
      var collapsedButtons = 0  // Counted from the right side.
      var toolbarButtons = []   // A list of toolbar buttons
      toolbarRoot.childNodes.forEach((toolbarButton) => {
        // There may also be markup like newlines which show up as "text" elements that have a NaN scrollWidth.
        // Ignore these elements (also ignore the dropdown button itself - this may be shown or hidden).
        var isDropDown = toolbarButton.className && toolbarButton.className.indexOf('dropdown') >= 0
        if (!isDropDown && !isNaN(toolbarButton.scrollWidth)) {
          toolbarButtons.push(toolbarButton)
          cumulativeWidth += toolbarButton.scrollWidth
          if (cumulativeWidth > toolbarWidth) {
            ++collapsedButtons
          }
        }
      })
      // Our toolbar width was calculated assuming that the dropdown button is visible. If we are going
      // to collapse exactly one button, that is the dropdown. In this case don't collapse any buttons.
      // This is done so that the "number of buttons to collapse" is computed correctly, including separators, etc.
      if (collapsedButtons === 1) {
        collapsedButtons = 0
      }

      this.showDropDown = collapsedButtons > 0

      // If we have any collapsed buttons, then move them into the dropdown
      if (collapsedButtons > 0) {
        for (var i = toolbarButtons.length - collapsedButtons; i < toolbarButtons.length; ++i) {
          var li = document.createElement('li')
          li.appendChild(toolbarButtons[i])
          dropdownUL.appendChild(li)
        }
      }
    }
  }

}

ToolBarController.$inject = ['$element', 'state', 'map_tools']

app.component('toolBar', {
  templateUrl: '/components/header/tool-bar-component.html',
  bindings: {},
  controller: ToolBarController
})

