class ToolBarController {

  constructor($element, $timeout,$document ,state, map_tools) {
    this.state = state
    this.$element = $element
    this.$timeout = $timeout
    this.$document = $document
    this.marginPixels = 10  // Margin between the container and the div containing the buttons
    this.dropdownWidthPixels = 36 // The width of the dropdown button
    this.numPreviousCollapsedButtons = 0
    this.map_tools = map_tools
    this.showDropDown = false
    this.heatMapOption = true

    this.latestOverlay = null
    this.step = 100000
    // Map tile settings used for debugging
    this.state.mapTileOptions
      .subscribe((mapTileOptions) => this.mapTileOptions = angular.copy(mapTileOptions))

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

    this.rangeValues = []
    const initial = 1000
    const final = 5000000
    var incrementby = 1000
    for(var i=initial;i<=final;i=i+incrementby){
      this.rangeValues.push(i)
      if(i < 5000) incrementby=1000
      else if(i < 30000) incrementby = 5000
      else if(i < 100000) incrementby = 10000
      else if(i < 200000) incrementby = 25000
      else if(i < 500000) incrementby = 50000
      else if(i < 1000000) incrementby = 100000
      else if(i < 2000000) incrementby = 250000
      else incrementby=500000
    }

    const list = this.$document[0].getElementById('tickmarks')
    
    this.rangeValues.forEach(item => {
      let option = this.$document[0].createElement('option')
      option.value = item;   
      list.appendChild(option);
    });

    //toggle view settings dropdown
    $('.myDropdown1').on('show.bs.dropdown', function (e) {
        $(this).find('.view-dropdown').toggle()
        e.stopPropagation();
        e.preventDefault();
    })

    //toggle toolbar dropdown
    $('.dropdown').on('show.bs.dropdown', function (e) {
      $(this).find('.tool-bar-dropdown').toggle()
      e.stopPropagation();
      e.preventDefault();
    })

    // hide toolbar dropdown 
    // $(document).on('click',function(){
    //   if($('.tool-bar-dropdown').is(":visible"))
    //     $('.tool-bar-dropdown').hide()
    // })
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
      this.state.loadPlan(ephemeralPlan.id)
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

  refreshToolbar() {
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
          if (cumulativeWidth > toolbarWidth && toolbarButton.className.indexOf('no-collapse') < 0) {
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
      if (this.numPreviousCollapsedButtons !== collapsedButtons) {
        this.$timeout() // Trigger a digest cycle as the toolbar state has changed
      }
      this.numPreviousCollapsedButtons = collapsedButtons

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

  $doCheck() {
    // Call refreshToolbar() after a timeout, to allow the browser layout/rendering to catch up with splitter changes.
    setTimeout(() => this.refreshToolbar(), 0)
  }

  // Take the mapTileOptions defined and set it on the state
  toggleHeatMapOptions() {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    this.heatMapOption = !this.heatMapOption
    newMapTileOptions.selectedHeatmapOption = this.heatMapOption ? this.state.viewSetting.heatmapOptions[0] : this.state.viewSetting.heatmapOptions[2]
    this.state.mapTileOptions.next(newMapTileOptions)
  }

  changeHeatMapOptions() {
    var newMapTileOptions = angular.copy(this.mapTileOptions)

    if(newMapTileOptions.heatMap.worldMaxValue > this.state.mapTileOptions.value.heatMap.worldMaxValue) {
      if(newMapTileOptions.heatMap.worldMaxValue < 5000) this.step=1000
      else if(newMapTileOptions.heatMap.worldMaxValue < 30000) this.step = 5000
      else if(newMapTileOptions.heatMap.worldMaxValue < 100000) this.step = 10000
      else if(newMapTileOptions.heatMap.worldMaxValue < 200000) this.step = 25000
      else if(newMapTileOptions.heatMap.worldMaxValue < 500000) this.step = 50000
      else if(newMapTileOptions.heatMap.worldMaxValue < 1000000) this.step = 100000
      else if(newMapTileOptions.heatMap.worldMaxValue < 2000000) this.step = 250000
      else this.step=500000
    } else {
      if(newMapTileOptions.heatMap.worldMaxValue <= 5000) this.step=1000
      else if(newMapTileOptions.heatMap.worldMaxValue <= 30000) this.step = 5000
      else if(newMapTileOptions.heatMap.worldMaxValue <= 100000) this.step = 10000
      else if(newMapTileOptions.heatMap.worldMaxValue <= 200000) this.step = 25000
      else if(newMapTileOptions.heatMap.worldMaxValue <= 500000) this.step = 50000
      else if(newMapTileOptions.heatMap.worldMaxValue <= 1000000) this.step = 100000
      else if(newMapTileOptions.heatMap.worldMaxValue <= 2000000) this.step = 250000
    }

    this.state.mapTileOptions.next(newMapTileOptions)
  }
}

ToolBarController.$inject = ['$element', '$timeout', '$document', 'state', 'map_tools']

app.component('toolBar', {
  templateUrl: '/components/header/tool-bar-component.html',
  bindings: {},
  controller: ToolBarController
})

