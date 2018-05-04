class ToolBarController {

  constructor($element, $timeout,$document ,state, map_tools, $window, configuration) {
    this.state = state
    this.$element = $element
    this.$timeout = $timeout
    this.$document = $document
    this.$window = $window
    this.configuration = configuration
    this.marginPixels = 10  // Margin between the container and the div containing the buttons
    this.dropdownWidthPixels = 36 // The width of the dropdown button
    this.numPreviousCollapsedButtons = 0
    this.map_tools = map_tools
    this.showDropDown = false
    this.heatMapOption = true
    this.measuringStickEnabled = false
    this.currentUser = state.getUser()
    this.switchIcon = config.ARO_CLIENT === 'frontier'

    this.min = 0
    // Map tile settings used for debugging
    this.state.mapTileOptions
      .subscribe((mapTileOptions) => this.mapTileOptions = angular.copy(mapTileOptions))

    this.rulerSegments = []
    this.rulerPolyLine = null 

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
    this.rangeValues.reverse()
    this.max = this.rangeValues.length - 1
    this.sliderValue = this.rangeValues.indexOf(this.mapTileOptions.heatMap.worldMaxValue)

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
  }

  $onInit() {
    this.mapRef = this.$window[this.mapGlobalObjectName]
  } 

  openGlobalSettings() {
    this.state.showGlobalSettings.next(true)
  }

  setSelectionSingle() {
    if (this.state.selectedToolBarAction === this.state.toolbarActions.SINGLE_SELECT) {
      this.state.selectedToolBarAction= null
      return
    }
    this.state.selectedToolBarAction = this.state.toolbarActions.SINGLE_SELECT
    this.setSelectionMode(this.state.targetSelectionModes.SINGLE_PLAN_TARGET)
  }

  setSelectionPolygon() {
    if (this.state.selectedToolBarAction === this.state.toolbarActions.POLYGON_SELECT) {
      this.state.selectedToolBarAction= null
      return
    }
    this.state.selectedToolBarAction = this.state.toolbarActions.POLYGON_SELECT
    this.setSelectionMode(this.state.targetSelectionModes.POLYGON_PLAN_TARGET)
  }

  setSelectionExport(){
    if (this.state.selectedToolBarAction === this.state.toolbarActions.POLYGON_EXPORT) {
      this.state.selectedToolBarAction= null
      return
    }
    this.state.selectedToolBarAction = this.state.toolbarActions.POLYGON_EXPORT
    this.setSelectionMode(this.state.targetSelectionModes.POLYGON_EXPORT_TARGET)
  }

  setSelectionMode(selectionMode) {
    this.state.selectedTargetSelectionMode = selectionMode
  }

  showPlanModal() {
    this.state.activeViewModePanel = this.state.viewModePanels.PLAN_INFO
  }

  createEphemeralPlan() {
    this.state.createEphemeralPlan()
    .then((ephemeralPlan) => {
      this.state.loadPlan(ephemeralPlan.id)
    })
    .catch((err) => console.error(err))
  }

  savePlanAs() {
    this.state.planInputsModal.next(true)
  }

  toggleMeasuringStick() {
    this.measuringStickEnabled = !this.measuringStickEnabled
    this.clearRulers()
    if(this.measuringStickEnabled) {
      this.clickListener = google.maps.event.addListener(this.mapRef, 'click', (point) => {
        this.addToRulerSegments(point.latLng);
      }); 
    } else {
      google.maps.event.removeListener(this.clickListener)      
    }
    this.state.selectedToolBarAction = null
  }

  addToRulerSegments(latLng) {
    var ruler;

    //add a marker
    ruler = new google.maps.Marker({
      position: latLng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 2
      },
      map: this.mapRef,
      draggable: true,
      zIndex: 100
    });

    this.rulerSegments.push(ruler);

    //if this is the first marker, add a label and link it to the first marker
    if (this.rulerSegments.length === 1) {
      this.state.measuredDistance.next(0)
    } else {
      this.rulerDrawEvent();
    }

    google.maps.event.addListener(ruler, 'drag', () => {
      this.rulerDrawEvent();
    });
  }

  clearRulerMarker(ruler) {
    google.maps.event.clearListeners(ruler);
    ruler.setMap(null);
  }

  rulerDrawEvent() {
    this.drawRulerPolyline();
    this.updateLengthLabel();
  }

  drawRulerPolyline() {
    this.clearPolyLine();

    this.rulerPolyLine = new google.maps.Polyline({
      path: this.rulersToPositions(),
      strokeColor : '#4d99e5',
      strokeWeight: 3,
      clickable: false,
      map: this.mapRef
    });
  }

  updateLengthLabel() {
    var total;

    if (this.rulerSegments.length) {
      total = _(this.rulerSegments).reduce((length, ruler, index) => {
        var prev;
        //console.log( 'reduce', length, ruler,index )
        //ignore the first ruler.... work from current ruler to the previous ruler
        if (index) {
          prev = this.rulerSegments[index - 1];
          return length + google.maps.geometry.spherical.computeDistanceBetween(prev.getPosition(), ruler.getPosition())
        } else {
          return 0;
        }
      }, 0);

      this.state.measuredDistance.next(total)
    }
  }

  clearPolyLine() {
    if (this.rulerPolyLine) {
      this.rulerPolyLine.setMap(null);
      this.rulerPolyLine = null;
    }
  }

  rulersToPositions() {
    return _(this.rulerSegments).map(function (ruler) {
      return ruler.position;
    });
  }

  clearRulers() {
    this.clearPolyLine();

    _(this.rulerSegments).each((ruler) => {
      this.clearRulerMarker(ruler);
    });

    this.rulerSegments = null;
    this.rulerSegments = [];

    this.rulerDrawEvent();

    this.measuredDistance = null
    this.state.measuredDistance.next(this.measuredDistance)
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
    setTimeout(() => this.refreshSlidertrack(), 0)
  }

  // Take the mapTileOptions defined and set it on the state
  toggleHeatMapOptions() {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    //this.heatMapOption = !this.heatMapOption
    newMapTileOptions.selectedHeatmapOption = this.heatMapOption ? this.state.viewSetting.heatmapOptions[0] : this.state.viewSetting.heatmapOptions[2]
    this.state.mapTileOptions.next(newMapTileOptions)
  }

  changeHeatMapOptions() {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    newMapTileOptions.heatMap.worldMaxValue=this.rangeValues[this.sliderValue]
    this.state.mapTileOptions.next(newMapTileOptions)
  }

  refreshSlidertrack() {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    var val = (this.sliderValue - this.min) / (this.max - this.min);
    
    this.$element.find('.myDropdown1 input[type="range"]').css('background-image',
      '-webkit-gradient(linear, left top, right top, '
      + 'color-stop(' + val + ', #1f7de6), '
      + 'color-stop(' + val + ', #C5C5C5)'
      + ')'
    );
  }

  openCoverageBoundaryPanel() {
    this.state.activeViewModePanel = this.state.viewModePanels.COVERAGE_BOUNDARY
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW) // Panel is visible only in VIEW mode
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.COVERAGE_BOUNDARY
  }

  toggleSiteBoundary() {
    //if(this.state.showSiteBoundary && this.selectedBoundaryType) {
      this.state.viewSettingsChanged.next()
    //} 
  }

  showCableDirection() {
    this.state.viewSettingsChanged.next()
  }
}

ToolBarController.$inject = ['$element', '$timeout', '$document', 'state', 'map_tools', '$window', 'configuration']

let toolBar = {
  templateUrl: '/components/header/tool-bar.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: ToolBarController
}

export default toolBar