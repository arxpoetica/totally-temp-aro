class ToolBarController {

  constructor($scope, $compile, state, map_tools) {
    this.state = state
    this.map_tools = map_tools
    this.state.showGlobalSettings
    .subscribe((newValue) => {})

    $scope.showDropDown = false
    $scope.timeout = 500
    state.splitterObj
      .subscribe((splitterObj) => {
        setTimeout(function () {
          refreshToolbar()
          $scope.timeout = 0
        }, $scope.timeout);
      })

    function refreshToolbar() {
      var logowidth = $("#tool-bar-logo-new").width() + 20//padding
      var toolbarstartpoint = $('.tool-bar').offset().left
      var networkplanstartpoint = $('.network-plan').offset().left
      var availableSpace = networkplanstartpoint - toolbarstartpoint - logowidth
      var totalbarButtonWidth = [50, 10, 50, 50, 50, 10, 50, 50] //Each toolbar tab size
      var totalToolbarSize = 320
      
      var horizontalTool = ""
      var dropdownTool = ""
      var consumedSpace = 0

      consumedSpace = (availableSpace < totalToolbarSize) ? $(".dropdown-toolbar").width() : 0

      for (var i = 0; i < totalbarButtonWidth.length; i++) {
        consumedSpace += totalbarButtonWidth[i]
        if(availableSpace > consumedSpace) {
          horizontalTool += $("#tool-bar-template").children()[i].outerHTML
        } else {
          dropdownTool += $("#tool-bar-template").children()[i].outerHTML
        }
      }
      $(".horizontal-toolbar").html(horizontalTool)
      $(".dropdown-toolbar .dropdown-menu").html(dropdownTool)

      $compile($(".horizontal-toolbar"))($scope)
      $compile($(".dropdown-toolbar .dropdown-menu"))($scope)
      
      $scope.showDropDown = dropdownTool ? true : false
      $scope.$apply()
      
      var dropdownbutton = (availableSpace < totalToolbarSize) ? $(".dropdown-toolbar").width() : 0
      var toolbarendpoint = dropdownbutton + $('.tool-bar').offset().left + $('.tool-bar').width()

      $('#tool-bar-logo-new').css('left', (toolbarendpoint + ((networkplanstartpoint - toolbarendpoint) / 2)) - (logowidth / 2));
    }

    //Toolbar button icons
    this.openImage = 'fa fa-2x fa-th'
    this.createImage = 'fa fa-2x fa-file'
    this.saveImage = 'fa fa-2x fa-floppy-o'
    this.showImage = 'fa fa-2x fa-folder-open'
    this.toggleImage = 'fa fa-2x fa-arrows-h'
    this.downImage = 'fa fa-2x fa-caret-down'
    this.eyeImage = 'fa fa-2x fa-eye'

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

  toggleViewSettings() {
    var viewSettingConfig = {
      id: 'map_settings',
      name: 'View Settings',
      short_name: 'V',
      icon: 'fa fa-eye fa-2x'
    }
    this.map_tools.toggle(viewSettingConfig)
  }

}

ToolBarController.$inject = ['$scope','$compile','state','map_tools']

app.component('toolBar', {
  templateUrl: '/components/header/tool-bar-component.html',
  bindings: {},
  controller: ToolBarController
})

