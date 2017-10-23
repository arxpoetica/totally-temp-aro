class ToolBarController {

  constructor($scope, $element, $compile, $timeout, state, map_tools) {
    this.state = state
    this.$element = $element
    this.$timeout = $timeout
    this.map_tools = map_tools
    this.state.showGlobalSettings
    .subscribe((newValue) => {})

    this.showDropDown = false
    $scope.timeout = 200
    state.splitterObj
      .subscribe((splitterObj) => {
        setTimeout(function () {
          // refreshToolbar(state)
        }, $scope.timeout);
      })

    this.state.selectedDisplayMode.subscribe(() =>
      setTimeout(function () {
        // refreshToolbar(state)
      }, $scope.timeout)
    )

    function refreshToolbar(state) {
      var logowidth = $("#tool-bar-logo-new").width() + 20//padding
      var toolbarstartpoint = $('.tool-bar').offset().left
      var networkplanstartpoint = $('.network-plan').offset().left
      var availableSpace = networkplanstartpoint - toolbarstartpoint - logowidth
      var totalbarButtonWidth;
      var toolBarButtonWidth = 28
      var separatorWidth = 14
      
      if(state.selectedDisplayMode.getValue() !== state.displayModes.ANALYSIS) {
        totalbarButtonWidth = [28, 14, 28, 28, 28, 14, 28, 28]
      } else {
        totalbarButtonWidth = [28, 14, 28, 28, 28, 14, 28, 28, 14, 28, 28]
      }
      
      var analysisButtonWidth = []

      var totalToolbarSize = totalbarButtonWidth.reduce(function (total, num) {
        return total + num;
      })
      
      var horizontalTool = ""
      var dropdownTool = ""
      var consumedSpace = 0

      consumedSpace = (availableSpace < totalToolbarSize) ? 39 /*$(".dropdown-toolbar").width()*/ : 0

      for (var i = 0; i < totalbarButtonWidth.length; i++) {
        consumedSpace += totalbarButtonWidth[i]
        if (availableSpace > consumedSpace) {
          horizontalTool += $("#tool-bar-template").children()[i].outerHTML
        } else {
          //Skip to load the seperator in dropdown
          if (totalbarButtonWidth[i] != 14) {
            dropdownTool += $("#tool-bar-template").children()[i].outerHTML
          }
        }
      }

      $(".horizontal-toolbar").html(horizontalTool)
      $(".dropdown-toolbar .dropdown-menu").html(dropdownTool)

      $compile($(".horizontal-toolbar"))($scope)
      $compile($(".dropdown-toolbar .dropdown-menu"))($scope)
      
      //$scope.showDropDown = dropdownTool ? true : false
      $scope.$apply()
      
      var dropdownbutton = (availableSpace < totalToolbarSize) ? $(".dropdown-toolbar").width() : 0
      var toolbarendpoint = dropdownbutton + $('.tool-bar').offset().left + $('.tool-bar').width()

      $('#tool-bar-logo-new').css('left', (toolbarendpoint + ((networkplanstartpoint - toolbarendpoint) / 2)) - (logowidth / 2));
    }

    //Toolbar button icons
    this.openImage = 'fa fa-th'
    this.createImage = 'fa fa-file'
    this.saveImage = 'fa fa-floppy-o'
    this.showImage = 'fa fa-folder-open'
    this.toggleImage = 'fa fa-arrows-h'
    this.downImage = 'fa fa-caret-down'
    this.eyeImage = 'fa fa-eye'
    this.singleSelect = 'fa fa-mouse-pointer'
    this.polygonSelect = 'fa fa-bookmark-o fa-rotate-180'

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
      // console.log(`${this.$element[0].clientWidth}, ${this.$element[0].scrollWidth}`)

      var toolbarRoot = this.$element.find('.tool-bar')[0]
      var clientWidth = this.$element[0].clientWidth

      // First move any buttons in the dropdown into the main toolbar
      var dropdownRoot = this.$element.find('.tool-bar .dropdown')[0]
      var dropdownUL = this.$element.find('.tool-bar .dropdown ul')[0]
      var dropdownItems = this.$element.find('.tool-bar .dropdown ul li')
      for (var i = 0; i < dropdownItems.length; ++i) {
        if (dropdownItems[i].childNodes.length > 0) {
          toolbarRoot.insertBefore(dropdownItems[i].childNodes[0], dropdownRoot)
        }
      }
      while(dropdownUL.hasChildNodes()) {
        dropdownUL.removeChild(dropdownUL.lastChild)
      }

      var cumulativeWidth = 0
      var expandedButtons = 0, collapsedButtons = 0
      var toolbarButtons = []
      toolbarRoot.childNodes.forEach((toolbarButton) => {
        if (toolbarButton.scrollWidth && !isNaN(toolbarButton.scrollWidth)) {
          toolbarButtons.push(toolbarButton)
          cumulativeWidth += toolbarButton.scrollWidth
          if (cumulativeWidth < clientWidth) {
            ++expandedButtons
          } else {
            ++collapsedButtons
          }
        }
      })
      this.showDropDown = true
      // var oldShowDropDown = this.showDropDown
      // this.showDropDown = this.$element[0].scrollWidth > clientWidth
      // if (oldShowDropDown !== this.showDropDown) {
      //   this.$timeout()
      // }

      console.log(`${expandedButtons}, ${collapsedButtons}`)
      if (collapsedButtons > 0) {
        // Move the collapsed buttons onto the dropdown
        for (var i = toolbarButtons.length - collapsedButtons - 1; i < toolbarButtons.length - 1; ++i) {
          var li = document.createElement('li')
          li.appendChild(toolbarButtons[i])
          dropdownUL.appendChild(li)
        }
      }


    }
  }

}

ToolBarController.$inject = ['$scope', '$element', '$compile', '$timeout', 'state', 'map_tools']

app.component('toolBar', {
  templateUrl: '/components/header/tool-bar-component.html',
  bindings: {},
  controller: ToolBarController
})

