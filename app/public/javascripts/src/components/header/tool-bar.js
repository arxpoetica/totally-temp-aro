import Constants from '../common/constants'
import RfpActions from '../../react/components/optimization/rfp/rfp-actions'

class ToolBarController {
  constructor ($element, $timeout, $document, $http, $ngRedux, state, map_tools, $window) {
    this.state = state
    this.$element = $element
    this.$timeout = $timeout
    this.$document = $document
    this.$window = $window
    this.$http = $http
    this.marginPixels = 10 // Margin between the container and the div containing the buttons
    this.dropdownWidthPixels = 36 // The width of the dropdown button
    this.numPreviousCollapsedButtons = 0
    this.map_tools = map_tools
    this.showDropDown = false
    this.heatMapOption = this.state.mapTileOptions.getValue().selectedHeatmapOption.id === 'HEATMAP_ON'
    this.measuringStickEnabled = false
    this.isViewSettingsEnabled = false
    this.currentUser = state.loggedInUser
    this.Constants = Constants
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)

    this.min = 0
    // Map tile settings used for debugging
    this.state.mapTileOptions
      .subscribe((mapTileOptions) => this.mapTileOptions = angular.copy(mapTileOptions))

    this.rulerSegments = []
    this.rulerPolyLine = null

    this.state.showFiberSize = false
    this.state.viewSetting.selectedFiberOption = this.state.viewFiberOptions[0]

    this.rangeValues = []
    const initial = 1000
    const final = 5000000
    var incrementby = 1000
    for (var i = initial; i <= final; i = i + incrementby) {
      this.rangeValues.push(i)
      if (i < 5000) incrementby = 1000
      else if (i < 30000) incrementby = 5000
      else if (i < 100000) incrementby = 10000
      else if (i < 200000) incrementby = 25000
      else if (i < 500000) incrementby = 50000
      else if (i < 1000000) incrementby = 100000
      else if (i < 2000000) incrementby = 250000
      else incrementby = 500000
    }
    this.rangeValues.reverse()
    this.max = this.rangeValues.length - 1
    this.sliderValue = this.rangeValues.indexOf(this.mapTileOptions.heatMap.worldMaxValue)

    // toggle view settings dropdown
    $('.myDropdown1').on('show.bs.dropdown', function (e) {
      $(this).find('.view-dropdown').toggle()
      e.stopPropagation()
      e.preventDefault()
    })

    // toggle ruler dropdown
    $('.rulerDropdown').on('show.bs.dropdown', function (e) {
      $(this).find('.ruler-dropdown').toggle()
      e.stopPropagation()
      e.preventDefault()
    })

    // toggle toolbar dropdown
    $('.dropdown').on('show.bs.dropdown', function (e) {
      $(this).find('.tool-bar-dropdown').toggle()
      e.stopPropagation()
      e.preventDefault()
    })
  }

  $onInit () {
    this.mapRef = this.$window[this.mapGlobalObjectName]

    this.state.clearToolbarActions.skip(1).subscribe((clear) => clear && this.closeDropdowns())
  }

  openGlobalSettings () {
    this.state.showGlobalSettings = true
  }

  setSelectionSingle () {
    this.state.selectedToolBarAction = null
    this.setSelectionMode(this.state.targetSelectionModes.SINGLE_PLAN_TARGET)
  }

  setSelectionPolygon () {
    this.state.selectedToolBarAction = null
    this.setSelectionMode(this.state.targetSelectionModes.POLYGON_PLAN_TARGET)
  }

  setSelectionExport () {
    if (this.state.selectedDisplayMode.getValue() != this.state.displayModes.VIEW) return
    if (this.state.selectedToolBarAction === this.state.toolbarActions.POLYGON_EXPORT) {
      this.state.selectedToolBarAction = null
      return
    }
    this.state.selectedToolBarAction = this.state.toolbarActions.POLYGON_EXPORT
    this.setSelectionMode(this.state.targetSelectionModes.POLYGON_EXPORT_TARGET)
  }

  setSelectionMode (selectionMode) {
    this.state.selectedTargetSelectionMode = selectionMode
    this.$timeout() // Trigger a digest cycle as the toolbar state has changed
  }

  showPlanModal () {
    this.state.activeViewModePanel = this.state.viewModePanels.PLAN_INFO
  }

  createEphemeralPlan () {
    this.state.createNewPlan(true)
      .then((result) => this.state.loadPlan(result.data.id))
      .catch((err) => console.error(err))
  }

  savePlanAs () {
    this.state.planInputsModal.next(true)
    if (this.state.configuration.ARO_CLIENT === 'frontier') this.state.currentPlanTags = []
  }

  toggleMeasuringStick () {
    this.measuringStickEnabled = true
    this.clearRulers()
    if (this.measuringStickEnabled) {
      this.clickListener = google.maps.event.addListener(this.mapRef, 'click', (point) => {
        this.state.currentRulerAction.id === this.state.allRulerActions.STRAIGHT_LINE.id && this.addToRulerSegments(point.latLng)
      })
    } else {
      google.maps.event.removeListener(this.clickListener)
    }
    this.state.selectedToolBarAction = null
  }

  clearStraightLineAction () {
    this.measuringStickEnabled = false
    this.clearRulers()
    this.clickListener && google.maps.event.removeListener(this.clickListener)
  }

  addToRulerSegments (latLng) {
    var ruler

    // add a marker
    ruler = new google.maps.Marker({
      position: latLng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 2
      },
      map: this.mapRef,
      draggable: true,
      zIndex: 100
    })

    this.rulerSegments.push(ruler)

    // if this is the first marker, add a label and link it to the first marker
    if (this.rulerSegments.length === 1) {
      this.state.measuredDistance.next(0)
    } else {
      this.rulerDrawEvent()
    }

    google.maps.event.addListener(ruler, 'drag', () => {
      this.rulerDrawEvent()
    })
  }

  clearRulerMarker (ruler) {
    google.maps.event.clearListeners(ruler)
    ruler.setMap(null)
  }

  rulerDrawEvent () {
    this.drawRulerPolyline()
    this.updateLengthLabel()
  }

  drawRulerPolyline () {
    this.clearPolyLine()

    this.rulerPolyLine = new google.maps.Polyline({
      path: this.rulersToPositions(),
      strokeColor: '#4d99e5',
      strokeWeight: 3,
      clickable: false,
      map: this.mapRef
    })
  }

  updateLengthLabel () {
    var total

    if (this.rulerSegments.length) {
      total = _(this.rulerSegments).reduce((length, ruler, index) => {
        var prev
        // console.log( 'reduce', length, ruler,index )
        // ignore the first ruler.... work from current ruler to the previous ruler
        if (index) {
          prev = this.rulerSegments[index - 1]
          return length + google.maps.geometry.spherical.computeDistanceBetween(prev.getPosition(), ruler.getPosition())
        } else {
          return 0
        }
      }, 0)

      this.state.measuredDistance.next(total)
    }
  }

  clearPolyLine () {
    if (this.rulerPolyLine) {
      this.rulerPolyLine.setMap(null)
      this.rulerPolyLine = null
    }
  }

  rulersToPositions () {
    return _(this.rulerSegments).map(function (ruler) {
      return ruler.position
    })
  }

  clearRulers () {
    this.clearPolyLine()

    _(this.rulerSegments).each((ruler) => {
      this.clearRulerMarker(ruler)
    })

    this.rulerSegments = null
    this.rulerSegments = []

    this.rulerDrawEvent()

    this.measuredDistance = null
    this.state.measuredDistance.next(this.measuredDistance)
  }

  removeLastRulerMarker () {
    var last

    if (this.rulerSegments.length) {
      last = _(this.rulerSegments).last()
      this.rulerSegments = _(this.rulerSegments).without(last)

      this.clearRulerMarker(last)
      this.rulerDrawEvent()
    }
  }

  showRemoveRulerButton () {
    return this.rulerSegments && (this.rulerSegments.length > 1)
  }

  refreshToolbar () {
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
      if (dropdownUL) {
        while (dropdownUL.hasChildNodes()) {
          dropdownUL.removeChild(dropdownUL.lastChild)
        }
      }

      // All buttons are in the toolbar. Go through all of them and mark the ones to be collapsed (if any).
      var cumulativeWidth = 0
      var collapsedButtons = 0 // Counted from the right side.
      var toolbarButtons = [] // A list of toolbar buttons
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

  $doCheck () {
    // Call refreshToolbar() after a timeout, to allow the browser layout/rendering to catch up with splitter changes.
    setTimeout(() => this.refreshToolbar(), 0)
    setTimeout(() => this.refreshSlidertrack(), 0)
  }

  viewSettingsAction () {
    !this.isViewSettingsEnabled && this.closeDropdowns()
    this.isViewSettingsEnabled = !this.isViewSettingsEnabled
  }

  // Take the mapTileOptions defined and set it on the state
  toggleHeatMapOptions () {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    // this.heatMapOption = !this.heatMapOption
    newMapTileOptions.selectedHeatmapOption = this.heatMapOption ? this.state.viewSetting.heatmapOptions[0] : this.state.viewSetting.heatmapOptions[2]
    this.state.mapTileOptions.next(newMapTileOptions)
  }

  showEquipmentLabelsChanged () {
    this.state.viewSettingsChanged.next()
    this.state.requestMapLayerRefresh.next(null)
  }

  changeHeatMapOptions () {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    newMapTileOptions.heatMap.worldMaxValue = this.rangeValues[this.sliderValue]
    this.state.mapTileOptions.next(newMapTileOptions)
  }

  refreshSlidertrack () {
    var newMapTileOptions = angular.copy(this.mapTileOptions)
    var val = (this.sliderValue - this.min) / (this.max - this.min)

    this.$element.find('.myDropdown1 input[type="range"]').css('background-image',
      '-webkit-gradient(linear, left top, right top, ' +
      'color-stop(' + val + ', #1f7de6), ' +
      'color-stop(' + val + ', #C5C5C5)' +
      ')'
    )
  }

  openCoverageBoundaryPanel () {
    this.state.activeViewModePanel = this.state.viewModePanels.COVERAGE_BOUNDARY
    this.state.selectedDisplayMode.next(this.state.displayModes.VIEW) // Panel is visible only in VIEW mode
    this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.COVERAGE_BOUNDARY
  }

  toggleSiteBoundary () {
    this.state.viewSettingsChanged.next() // This will also refresh the map layer
  }

  showCableDirection () {
    this.state.viewSettingsChanged.next()
  }

  rulerAction () {
    !this.state.isRulerEnabled && this.closeDropdowns()
    this.state.isRulerEnabled = !this.state.isRulerEnabled
    this.enableRulerAction()

    this.state.isRulerEnabled ? this.mapRef.setOptions({ draggableCursor: 'crosshair' }) : this.mapRef.setOptions({ draggableCursor: null })
  }

  enableRulerAction () {
    if (!this.state.isRulerEnabled) {
      // clear straight line ruler action
      this.clearStraightLineAction()
      // clear copper ruler action
      this.clearRulerCopperAction()
    } else {
      this.onChangeRulerAction()
    }
  }

  onChangeRulerAction () {
    if (this.state.currentRulerAction.id === this.state.allRulerActions.STRAIGHT_LINE.id) {
      this.toggleMeasuringStick()
      // clear copper ruler action
      this.clearRulerCopperAction()
    } else if (this.state.currentRulerAction.id === this.state.allRulerActions.COPPER.id ||
      this.state.currentRulerAction.id === this.state.allRulerActions.ROAD_SEGMENT.id) {
      // clear straight line ruler action
      this.clearStraightLineAction()
      this.clearRulerCopperAction()
      this.rulerCopperAction()
    }
  }

  rulerCopperAction () {
    this.getCopperPoints()
  }

  getCopperPoints () {
    this.copperPoints = []
    this.copperMarkers = []
    this.listenForCopperMarkers()
  }

  listenForCopperMarkers () {
    // Note we are using skip(1) to skip the initial value (that is fired immediately) from the RxJS stream.
    this.copperClicklistener = google.maps.event.addListener(this.mapRef, 'click', (event) => {
      if (!event || !event.latLng || this.state.currentRulerAction.id === this.state.allRulerActions.STRAIGHT_LINE.id) {
        console.log(event)
        return
      }

      var copperMarker = new google.maps.Marker({
        position: event.latLng,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 2
        },
        map: this.mapRef,
        draggable: false,
        zIndex: 100
      })

      this.copperMarkers.push(copperMarker)
      this.copperPoints.push(event)
      if (this.copperPoints.length > 1) {
        // clear copper ruler path if any
        this.clearRulerCopperPath()
        this.clearCopperMarkers()
        this.drawCopperPath()
      }
    })
  }

  drawCopperPath () {
    var maxDistance = 25 * config.length.length_units_to_meters
    if (google.maps.geometry.spherical.computeDistanceBetween(this.copperPoints[0].latLng,
      this.copperPoints[this.copperPoints.length - 1].latLng) > maxDistance) {
      var errorText = 'Selected points are too far apart for ruler analysis. Please select points which are closer.'
      swal({ title: 'Error!', text: errorText, type: 'error' })
      this.copperPoints = []
      this.clearCopperMarkers()
      return
    }
    // Get the POST body for optimization based on the current application state
    var optimizationBody = this.state.getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'POINT_TO_POINT'
    optimizationBody.pointFrom = {
      type: 'Point',
      coordinates: [this.copperPoints[0].latLng.lng(), this.copperPoints[0].latLng.lat()]
    }
    let pointTo = this.copperPoints[this.copperPoints.length - 1]
    optimizationBody.pointTo = {
      type: 'Point',
      coordinates: [pointTo.latLng.lng(), pointTo.latLng.lat()]
    }
    var spatialEdgeType = this.state.currentRulerAction.id === this.state.allRulerActions.COPPER.id ? this.Constants.SPATIAL_EDGE_COPPER : this.Constants.SPATIAL_EDGE_ROAD
    optimizationBody.spatialEdgeType = spatialEdgeType
    optimizationBody.directed = false

    this.$http.post('/service/v1/network-analysis/p2p', optimizationBody)
      .then((result) => {
      // get copper properties
        var geoJson = {
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'properties': {},
            'geometry': {}
          }]
        }

        geoJson.features[0].geometry = result.data.path
        this.copperPath = this.mapRef.data.addGeoJson(geoJson)
        this.mapRef.data.setStyle(function (feature) {
          return {
            strokeColor: '#000000',
            strokeWeight: 4
          }
        })
        this.state.measuredDistance.next(result.data.length)
        this.copperPoints = []
      })
  }

  clearRulerCopperAction () {
    this.copperClicklistener && google.maps.event.removeListener(this.copperClicklistener)
    this.clearRulerCopperPath()
    this.clearCopperMarkers()
  }

  clearRulerCopperPath () {
    if (this.copperPath != null) {
      for (var i = 0; i < this.copperPath.length; i++) {
        this.mapRef.data.remove(this.copperPath[i])
      }
    }
  }

  clearCopperMarkers () {
    this.copperMarkers && this.copperMarkers.map((marker) => this.clearRulerMarker(marker))
    this.copperMarkers = []
  }

  closeDropdowns () {
    if (this.isViewSettingsEnabled) {
      this.$element.find('.view-dropdown').toggle()
      this.isViewSettingsEnabled = false
    }
    if (this.state.isRulerEnabled) {
      this.$element.find('.ruler-dropdown').toggle()
      this.rulerAction()
    }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      showRfpStatusModal: () => dispatch(RfpActions.showOrHideRfpStatusModal(true))
    }
  }
}

ToolBarController.$inject = ['$element', '$timeout', '$document', '$http', '$ngRedux', 'state', 'map_tools', '$window']

let toolBar = {
  templateUrl: '/components/header/tool-bar.html',
  bindings: {
    mapGlobalObjectName: '@'
  },
  controller: ToolBarController
}

export default toolBar
