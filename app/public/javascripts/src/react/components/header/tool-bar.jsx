import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import './tool-bar.css';
import Tools from '../tool/tools'
import uuidStore from '../../../shared-utils/uuid-store'
import MapActions from '../map/map-actions'
import ToolBarActions from './tool-bar-actions'
import MapReportsActions from '../map-reports/map-reports-actions'
import ToolActions from '../tool/tool-actions'
import MapReportsListMapObjects from '../map-reports/map-reports-list-map-objects.jsx'
import FullScreenActions from '../full-screen/full-screen-actions'
import RfpActions from '../optimization/rfp/rfp-actions'
import AroHttp from '../../common/aro-http'
import { createSelector } from 'reselect'
import MapLayerActions from '../map-layers/map-layer-actions'
import ViewSettingsActions from '../view-settings/view-settings-actions'
import rState from '../../common/rState'
import PlanInputsModal from './plan-inputs-modal.jsx'
import GlobalsettingsActions from '../global-settings/globalsettings-action'
import GlobalSettings from '../global-settings/global-settings.jsx'

export class ToolBar extends Component {
  constructor (props) {
    super(props)
    
    this.rState = new rState(); // For RxJs implementation in React

    this.viewModePanels = Object.freeze({
      LOCATION_INFO: 'LOCATION_INFO',
      EQUIPMENT_INFO: 'EQUIPMENT_INFO',
      BOUNDARIES_INFO: 'BOUNDARIES_INFO',
      ROAD_SEGMENT_INFO: 'ROAD_SEGMENT_INFO',
      PLAN_SUMMARY_REPORTS: 'PLAN_SUMMARY_REPORTS',
      COVERAGE_BOUNDARY: 'COVERAGE_BOUNDARY',
      EDIT_LOCATIONS: 'EDIT_LOCATIONS',
      EDIT_SERVICE_LAYER: 'EDIT_SERVICE_LAYER',
      PLAN_INFO: 'PLAN_INFO'
    })

    // The display modes for the application
    this.displayModes = Object.freeze({
      VIEW: 'VIEW',
      ANALYSIS: 'ANALYSIS',
      EDIT_RINGS: 'EDIT_RINGS',
      EDIT_PLAN: 'EDIT_PLAN',
      PLAN_SETTINGS: 'PLAN_SETTINGS',
      DEBUG: 'DEBUG'
    })

    this.targetSelectionModes = Object.freeze({
      SINGLE_PLAN_TARGET: 0,
      POLYGON_PLAN_TARGET: 1,
      POLYGON_EXPORT_TARGET: 2,
      COVERAGE_BOUNDARY: 5
    })

    this.toolbarActions = Object.freeze({
      SINGLE_SELECT: 1,
      POLYGON_SELECT: 2,
      POLYGON_EXPORT: 3
    })

    // ruler actions
    this.allRulerActions = Object.freeze({
      STRAIGHT_LINE: { id: 'STRAIGHT_LINE', label: 'Straight Line' },
      ROAD_SEGMENT: { id: 'ROAD_SEGMENT', label: 'Road Segment' },
      COPPER: { id: 'COPPER', label: 'Copper' }
    })

    this.rulerActions = [
      this.allRulerActions.STRAIGHT_LINE,
      this.allRulerActions.ROAD_SEGMENT
    ]

    this.rulerSegments = []
    this.rulerPolyLine = null

    this.SPATIAL_EDGE_ROAD = 'road'
    this.SPATIAL_EDGE_COPPER = 'copper'

    // View Settings layer - define once
    this.viewSetting = {
      selectedFiberOption: null,
      heatmapOptions: [
        {
          id: 'HEATMAP_ON',
          label: 'Aggregate heatmap'
        },
        {
          id: 'HEATMAP_DEBUG',
          label: 'Aggregate points'
        },
        {
          id: 'HEATMAP_OFF',
          label: 'Raw Points'
        }
      ]
    }

    var heatmapOptions = {
      showTileExtents: false,
      heatMap: {
        useAbsoluteMax: false,
        maxValue: 100,
        powerExponent: 0.5,
        worldMaxValue: 500000
      },
      selectedHeatmapOption: this.viewSetting.heatmapOptions[0],
    }
    this.mapTileOptions = heatmapOptions

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
    this.min = 0

    this.viewFiberOptions = [
      {
        id: 1,
        name: 'Uniform width'
      },
      {
        id: 2,
        name: 'Fiber Strand Count',
        field: 'fiber_strands',
        multiplier: 2.1,
        pixelWidth: {
          min: 2,
          max: 12,
          divisor: 1 / 3
        },
        opacity: {
          min: 0.66,
          max: 1
        }
      },
      {
        id: 3,
        name: 'Atomic Unit Demand',
        field: 'atomic_units',
        multiplier: 1,
        pixelWidth: {
          min: 2,
          max: 12,
          divisor: 1 / 3,
          atomicDivisor: 50
        },
        opacity: {
          min: 0.66,
          max: 1
        }
      }
    ]

    this.state = {
      currentRulerAction: this.allRulerActions.STRAIGHT_LINE,
      mapRef: {},
      showRemoveRulerButton: false,
      heatMapOption: this.mapTileOptions.selectedHeatmapOption.id === 'HEATMAP_ON',
      sliderValue: this.rangeValues.indexOf(this.mapTileOptions.heatMap.worldMaxValue),
      showSiteBoundary: '',
      selectedBoundaryType: '',
      selectedFiberOption: this.viewSetting.selectedFiberOption,
      mapTileOptions: this.mapTileOptions,
      showDropDown: false,
      marginPixels: 10, // Margin between the container and the div containing the buttons
      dropdownWidthPixels: 36, // The width of the dropdown button
    }

    this.props.loadServiceLayers();

    this.refreshToolbar = this.refreshToolbar.bind(this); // To bind a function

    // To Trigger refreshToolbar() by Listening to the custom event from map-split.js $document.ready() method
    //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
    window.addEventListener('toolBarResized', () => { 
      setTimeout(() => this.refreshToolbar(), 0)
    });
  }

  componentDidMount(){
    this.initSearchBox()

    // toggle view settings dropdown
    jQuery('.myDropdown1').on('show.bs.dropdown', function (e) {
      jQuery(this).find('.view-dropdown').toggle()
      e.stopPropagation()
      e.preventDefault()
    })

    // toggle ruler dropdown
    jQuery('.rulerDropdown').on('show.bs.dropdown', function (e) {
      jQuery(this).find('.ruler-dropdown').toggle()
      e.stopPropagation()
      e.preventDefault()
    })

    // toggle toolbar dropdown
    jQuery('.dropdown').on('show.bs.dropdown', function (e) {
      jQuery('.tool-bar-dropdown').toggle()
      e.stopPropagation()
      e.preventDefault()
    })

    // To Trigger refreshToolbar() when window resized
    //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
    setTimeout(() => window.addEventListener("resize", this.refreshToolbar), 0)
  }

  componentWillReceiveProps(nextProps){
    if(this.props != nextProps) {
      this.setState({mapRef: nextProps.googleMaps, showSiteBoundary: nextProps.showSiteBoundary,
        selectedBoundaryType: nextProps.selectedBoundaryType})
    }
    // To Trigger refreshToolbar() when props changed
    setTimeout(() => this.refreshToolbar(), 0)
  }

  render () {
    return this.props.configuration === undefined || this.props.configuration.perspective === undefined
      ? null
      : this.renderToolBar()
  }

  renderToolBar() {
    this.initSearchBox();
    this.refreshSlidertrack();

    const {selectedDisplayMode, activeViewModePanel, isAnnotationsListVisible, isMapReportsVisible,
       showMapReportMapObjects, selectedTargetSelectionMode, isRulerEnabled, isViewSettingsEnabled,
       boundaryTypes, showDirectedCable, showEquipmentLabels, showLocationLabels,
       showFiberSize, configuration, showGlobalSettings } = this.props

    const {currentRulerAction, showRemoveRulerButton, heatMapOption, sliderValue,
      showSiteBoundary, selectedBoundaryType, selectedFiberOption, showDropDown,
      marginPixels, dropdownWidthPixels} = this.state

    let selectedIndividualLocation = (selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW) && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    let selectedMultipleLocation = (selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW) && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS && configuration.perspective.showToolbarButtons.selectionPolygon
    let calculateCoverageBoundry = selectedDisplayMode === this.displayModes.VIEW
    let exportSelectedPolygon = selectedDisplayMode === this.displayModes.VIEW && configuration.perspective.showToolbarButtons.exportSelection && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    let isEphemeralPlan = configuration.perspective.showToolbarButtons.ephemeralPlan
    let isSavePlanAs = configuration.perspective.showToolbarButtons.savePlanAs
    let isPlanModel = configuration.perspective.showToolbarButtons.planModel
    let isMeasuringStick = configuration.perspective.showToolbarButtons.measuringStick
    let isViewSettings = configuration.perspective.showToolbarButtons.viewSettings

    return(
      <div className="tool-bar" style={{margin: marginPixels, backgroundColor: configuration.toolbar.toolBarColor}}>

        {configuration.ARO_CLIENT !== 'frontier' &&
          <img src="images/logos/aro/logo_navbar.png" className="no-collapse" style={{alignSelf: 'center', paddingLeft: '10px', paddingRight: '10px'}}/>
        }

        {configuration.ARO_CLIENT === 'frontier' &&
          <span style={{alignSelf: 'center', paddingLeft: '10px', paddingRight: '10px'}}><b>NPM BSA</b></span>
        }

        <div className="no-collapse" id="global-search-toolbutton" style={{flex: '0 0 250px', margin: 'auto', width: '250px'}}>
          <input className="form-control select2" style={{padding:'0px', borderRadius: '0px'}} type="text" placeholder="Search an address, city, or state"/>
        </div>
        <div className="fa fa-search no-collapse" style={{paddingLeft: '10px', paddingRight: '10px', margin: 'auto', color: '#eee'}}></div>

        <div className="separator"></div>

        {configuration.perspective.showToolbarButtons.globalSettings &&
          <button className="btn"
            title="Global Settings..."
            onClick={(e) => this.showGlobalSettings()}>
            <i className="fa fa-th"></i>
          </button>
        }
        {showGlobalSettings &&
          <GlobalSettings/>
        }

        <div className="separator"></div>

        <button className="btn" title="Create a new plan" style={{ display: isEphemeralPlan ? 'block' : 'none' }}
          onClick={(e) => this.createEphemeralPlan()}>
          <i className="fa fa-file"></i>
        </button>

        <button className="btn" title="Save plan as..." style={{ display: isSavePlanAs ? 'block' : 'none' }}
          onClick={(e) => this.savePlanAs()}>
          <i className="far fa-save"></i>
        </button>
        <PlanInputsModal></PlanInputsModal>

        <button className="btn" title="Open an existing plan..." style={{ display: isPlanModel ? 'block' : 'none' }}
          onClick={(e) => this.openViewModeExistingPlan()}>
          <i className="fa fa-folder-open"></i>
        </button>

        <div className="separator"></div>

        <div className="rulerDropdown" style={{ display: isMeasuringStick ? 'block' : 'none' }}>
          <button className={`btn ${isRulerEnabled ? 'btn-selected' : ''}`}
            type="button" onClick={(e) => this.rulerAction(e)}
            aria-haspopup="true" aria-expanded="false" title="Ruler">
            <i className="fa fa-ruler"></i>
          </button>
          <div className="dropdown-menu dropdown-menu-right ruler-dropdown" style={{ display: isRulerEnabled ? 'block' : 'none' }}>
            <div className="ruler-container">
              <select className="form-control" value={currentRulerAction.id} onChange={(e)=> {this.onChangeRulerDropdown(e);}}>
                {this.rulerActions.map((item, index) =>
                  <option key={index} value={item.id} label={item.label}></option>
                )}
              </select>
              {showRemoveRulerButton &&
                <button type="button" className="btn btn-primary ruler-undo-btn form-control"
                  onClick={(e)=>this.removeLastRulerMarker(e)}>
                  <i className="fa fa-minus"></i>
                </button>    
              }       
            </div>
          </div>
        </div>

        <div className="myDropdown1">
          <button className={`btn ${isViewSettingsEnabled ? 'btn-selected' : ''}`}
            style={{ display: isViewSettings ? 'block' : 'none' }}
            type="button" onClick={(e) => this.viewSettingsAction(e)}
            aria-haspopup="true" aria-expanded="false" title="Show view settings...">
            <i className="fa fa-eye"></i>
          </button>

          <div className="dropdown-menu dropdown-menu-right view-dropdown" style={{ display: isViewSettingsEnabled ? 'block' : 'none' }}>
            {/* Location Heat Map */}
            <input type="checkbox" className="checkboxfill" checked={heatMapOption} name="ctype-name" style={{marginLeft: '2px'}}
              onChange={(e)=> this.toggleHeatMapOptions(e)}/>
            <font>Location Heatmap On</font>
            {heatMapOption &&
              <>
                <div className="dropdown-divider"></div>
                <font>Heatmap Intensity</font>
                <div style={{padding: '0px 10px'}}>
                  <input type="range" min={this.min} max={this.max} value={sliderValue} className="aro-slider"
                    onChange={(e)=> {this.changeHeatMapOptions(e); this.refreshSlidertrack()}}/>
                </div>
              </>
            }

            {/* Location Labels */}
            <div className="dropdown-divider"></div>
            <input type="checkbox" className="checkboxfill" checked={showLocationLabels} name="ctype-name" style={{marginLeft: '2px'}}
              onChange={(e)=> this.showLocationLabelsChanged(e)}/>
            <font>Location Labels</font>

            {/* Site Boundaries */}
            {configuration.toolbar.showSiteBoundaries && configuration.toolbar !== undefined &&
            <>
              <div className="dropdown-divider"></div>
              <input type="checkbox" className="checkboxfill" checked={showSiteBoundary} name="ctype-name" style={{marginLeft: '2px'}}
                onChange={(e)=> this.toggleSiteBoundary(e)}/>
              <font>Site Boundaries</font>
              {showSiteBoundary &&
                <select className="form-control" value={selectedBoundaryType.description}
                  onChange={(e)=> this.onChangeSiteBoundaries(e)}>
                  {boundaryTypes.map((item, index) =>
                    <option key={index} value={item.description} label={item.description}></option>
                  )}
                </select>
              }
            </>
            }

            {/* Directed Cable */}
            {configuration.toolbar.showDirectedCables && configuration.toolbar !== undefined &&
            <>
              <div className="dropdown-divider"></div>
              <input type="checkbox" className="checkboxfill" checked={showDirectedCable} name="ctype-name" style={{marginLeft: '2px'}}
                onChange={(e)=> this.showCableDirection(e)}/>
              <font>Directed Cable</font>
            </>
            }

            {/* Site Labels */}
            {configuration.perspective.viewSettings.showSiteLabels &&
            <>
              <div className="dropdown-divider"></div>
              <input type="checkbox" className="checkboxfill" checked={showEquipmentLabels} name="ctype-name" style={{marginLeft: '2px'}}
                onChange={(e)=> this.showEquipmentLabelsChanged(e)}/>
              <font>Site Labels</font>
            </>
            }

            {/* Fiber Size */}
            {configuration.perspective.viewSettings.showFiberSize &&
            <>
              <div className="dropdown-divider"></div>
              <input type="checkbox" className="checkboxfill" checked={showFiberSize} name="ctype-name" style={{marginLeft: '2px'}}
                onChange={(e)=> this.setShowFiberSize(e)}/>
              <font>Fiber Size</font>
              {showFiberSize &&
                <select className="form-control" value={selectedFiberOption}
                  onChange={(e)=> this.onChangeSelectedFiberOption(e)}>
                  {this.viewFiberOptions.map((item, index) =>
                    <option key={index} value={item.name} label={item.name}></option>
                  )}
                </select>
              }
            </>
            }
          </div>
        </div>

        <div style={{ display: selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW ? 'block' : 'none' }} className="separator"></div>
      
        <button style={{ display: selectedIndividualLocation ? 'block' : 'none' }}
          className={`btn ${selectedTargetSelectionMode === this.targetSelectionModes.SINGLE_PLAN_TARGET ? 'btn-selected' : ''} ${selectedIndividualLocation === true ? 'ng-hide-remove' : 'ng-hide-add'}`}
          onClick={(e) => this.setSelectionSingle()}
          title="Select individual locations">
          <i className="fa fa-mouse-pointer"></i>
        </button>

        <button style={{ display: selectedMultipleLocation ? 'block' : 'none' }} 
          className={`btn ${selectedTargetSelectionMode === this.targetSelectionModes.POLYGON_PLAN_TARGET ? 'btn-selected' : ''} ${selectedMultipleLocation === true ? 'ng-hide-remove' : 'ng-hide-add'}`}
          onClick={(e) => this.setSelectionPolygon()}
          title="Select multiple locations">
          <i className="fa fa-draw-polygon"></i>
        </button>

        <button className={`btn ${isAnnotationsListVisible ? 'btn-selected' : ''}`}
          title="Annotation" onClick={(e) => this.openAnnotationListVisibility()}>
          <i className="fa fa-paint-brush"></i>
        </button>

        <button className={`btn ${isMapReportsVisible ? 'btn-selected' : ''}`} 
          title="PDF Reports" onClick={(e) => this.openMapReportsVisibility()}>
          <i className="fas fa-print"></i>
        </button>

        {showMapReportMapObjects &&
          <MapReportsListMapObjects/>
        }

        <div className="separator"></div>

        {configuration.perspective.showToolbarButtons.openCoverageBoundary &&
          <button style={{ display: calculateCoverageBoundry ? 'block' : 'none' }} 
            className={`btn ${selectedTargetSelectionMode === this.targetSelectionModes.COVERAGE_BOUNDARY && activeViewModePanel === this.viewModePanels.COVERAGE_BOUNDARY  ? 'btn-selected' : ''} ${calculateCoverageBoundry === true ? 'ng-hide-remove' : 'ng-hide-add'}`}
            onClick={(e) => this.openViewModeCoverageBoundry()}
            title="Calculate coverage boundary">
            <i className="fa fa-crosshairs fa-rotate-180"></i>
          </button>
        }

        <button
          style={{ display: exportSelectedPolygon ? 'block' : 'none' }} 
          className={`btn ${selectedTargetSelectionMode === this.targetSelectionModes.POLYGON_EXPORT_TARGET ? 'btn-selected' : ''} ${exportSelectedPolygon === true ? 'ng-hide-remove' : 'ng-hide-add'}`}
          onClick={(e) => this.setSelectionExport()}
          title="Export selected polygon">
          <i className="fa fa-cube"></i>
        </button>
        
        <button className="btn" title="Show RFP status" 
          onClick={(e) => this.showRfpWindow()}>
          <i className="fa fa-cloud"></i>
        </button>

        <div className="dropdown" style={{ display: !showDropDown ? 'none' : 'block', borderLeft: '#eee 1px dotted', width: dropdownWidthPixels}}>
          <button style={{backgroundColor: configuration.toolbar.toolBarColor}} 
            className="btn btn-light" type="button" id="dropdownMenu1" data-toggle="dropdown"
            aria-haspopup="true" aria-expanded="true">
            <i className="fa fa-angle-double-down"></i>
          </button>
          {/* <!-- Override some styles on the dropdown-menu UL below to remove margins, padding, etc --> */}
          <ul className="dropdown-menu tool-bar-dropdown" aria-labelledby="dropdownMenu1"
            style={{padding: '0px', minWidth: '0px', backgroundColor: configuration.toolbar.toolBarColor}}>
          </ul> 
        </div> 
      </div>
    )
  }

  showGlobalSettings(){
    this.props.setShowGlobalSettings(true)
  }

  refreshToolbar () {
    var element = jQuery(".reactCompClass").get();  // To get the <r-tool-bar> component Elements
    if (element) {

      var toolBarElement = jQuery(".tool-bar").get();
      var dropDownElement = jQuery(".tool-bar .dropdown").get();
      var ulElement = jQuery(".tool-bar .dropdown ul").get();

      // Some of the buttons may be in the dropdown menu because the toolbar is collapsed.
      // Move them into the main toolbar before checking for button sizes.
      var toolbarRoot = toolBarElement[0];
      var dropdownRoot = dropDownElement[0];
      // The width of the toolbar is the clientWidth minus the margins minus the width of the dropdown.
      // We assume that the dropdown is shown while computing which buttons to collapse.
      var toolbarWidth = element[0].clientWidth - this.state.marginPixels * 2.0 - this.state.dropdownWidthPixels
      var dropdownUL = ulElement[0];
      // Loop through all the <li> elements in the dropdown. These <li> elements contain the buttons.
      var dropdownItems = jQuery(".tool-bar .dropdown ul li").get();

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
      if(toolbarRoot !== undefined) {
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
      }
      // Our toolbar width was calculated assuming that the dropdown button is visible. If we are going
      // to collapse exactly one button, that is the dropdown. In this case don't collapse any buttons.
      // This is done so that the "number of buttons to collapse" is computed correctly, including separators, etc.
      if (collapsedButtons === 1) {
        collapsedButtons = 0
      }

      this.setState({showDropDown: collapsedButtons > 0})

      // This Method is implemented in AngularJs to Trigger a digest cycle which not needed in React
      // if (this.numPreviousCollapsedButtons !== collapsedButtons) {
      //   this.$timeout() // Trigger a digest cycle as the toolbar state has changed
      // }
      // this.numPreviousCollapsedButtons = collapsedButtons

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

  savePlanAs(){
    this.props.setPlanInputsModal(true)
  }

  createEphemeralPlan () {
    this.props.createNewPlan(true)
    .then((result) => this.props.loadPlan(result.data.id))
    .catch((err) => console.error(err))
  }

  onChangeSelectedFiberOption (e) {
    this.setState({selectedFiberOption: e.target.value})
    this.rState.requestMapLayerRefresh.sendMessage(null)
  }

  setShowFiberSize () {
    this.props.setShowFiberSize(!this.props.showFiberSize)
    this.rState.requestMapLayerRefresh.sendMessage(null)
  }

  showLocationLabelsChanged () {
    this.props.setShowLocationLabels(!this.props.showLocationLabels)
  }

  showEquipmentLabelsChanged () {
    this.props.setShowEquipmentLabelsChanged(!this.props.showEquipmentLabels)
    this.rState.viewSettingsChanged.sendMessage()
    this.rState.requestMapLayerRefresh.sendMessage(null)
  }

  showCableDirection () {
    this.props.setShowDirectedCable(!this.props.showDirectedCable)
    this.rState.viewSettingsChanged.sendMessage()
  }

  onChangeSiteBoundaries (e) {
    let selectedBoundaryType = this.state.selectedBoundaryType
    this.props.boundaryTypes.map((item, index) => {
      if(index === e.target.selectedIndex){
        selectedBoundaryType = item
      }
    })
    this.setState({selectedBoundaryType: selectedBoundaryType})
    this.props.setSelectedBoundaryType(this.props.boundaryTypes[e.target.selectedIndex])
    this.props.setShowSiteBoundary(true)
  }

  toggleSiteBoundary (e) {
    this.setState({showSiteBoundary: !this.state.showSiteBoundary})
    this.rState.viewSettingsChanged.sendMessage() // This will also refresh the map layer
  }

  viewSettingsAction () {
    !this.props.isViewSettingsEnabled && this.closeDropdowns()
    this.props.setIsViewSettingsEnabled(!this.props.isViewSettingsEnabled)
  }

  toggleHeatMapOptions (e) {
    this.setState({heatMapOption: !this.state.heatMapOption}, function() {
      var newMapTileOptions = JSON.parse(JSON.stringify(this.state.mapTileOptions))
      newMapTileOptions.selectedHeatmapOption = this.state.heatMapOption ? this.viewSetting.heatmapOptions[0] : this.viewSetting.heatmapOptions[2]
      this.rState.mapTileOptions.sendMessage(newMapTileOptions) // This will also refresh the map layer
      this.refreshSlidertrack()
    })
    // To set selectedHeatmapOption in redux state
    this.props.setSelectedHeatMapOption(!this.state.heatMapOption ? this.viewSetting.heatmapOptions[0].id : this.viewSetting.heatmapOptions[2].id)
  }

  changeHeatMapOptions (e) {
    this.setState({sliderValue: e.target.value}, function() {
      var newMapTileOptions = JSON.parse(JSON.stringify(this.state.mapTileOptions))
      newMapTileOptions.heatMap.worldMaxValue = this.rangeValues[this.state.sliderValue]
      this.setState({mapTileOptions: newMapTileOptions})
      this.rState.mapTileOptions.sendMessage(newMapTileOptions) // This will also refresh the map layer  
    })
  }

  refreshSlidertrack () {
    var val = (this.state.sliderValue - this.min) / (this.max - this.min)
    jQuery('.myDropdown1 input[type="range"]').css('background-image',
      '-webkit-gradient(linear, left top, right top, ' +
      'color-stop(' + val + ', #1f7de6), ' +
      'color-stop(' + val + ', #C5C5C5)' +
      ')'
    )
  }

  rulerAction (e) {
    !this.props.isRulerEnabled && this.closeDropdowns()
    this.props.setIsRulerEnabled(!this.props.isRulerEnabled)
    this.enableRulerAction()

    !this.props.isRulerEnabled ? this.state.mapRef.setOptions({ draggableCursor: 'crosshair' }) : this.state.mapRef.setOptions({ draggableCursor: null })
  }

  enableRulerAction () {
    if (this.props.isRulerEnabled) {
      // clear straight line ruler action
       this.clearStraightLineAction()
      // clear copper ruler action
       this.clearRulerCopperAction()    
    } else {
      this.onChangeRulerAction()
    }
  }

  onChangeRulerDropdown(e){
    let prestineCurrentRulerAction = this.state.currentRulerAction
    Object.entries(this.allRulerActions).map(([ objKey, objValue ], objIndex) => {
      if(objKey === e.target.value){
        prestineCurrentRulerAction = objValue
      }
    })
    this.setState({currentRulerAction: prestineCurrentRulerAction}, function() {
      this.onChangeRulerAction();
    });
  }

  onChangeRulerAction () {

    if (this.state.currentRulerAction.id === this.allRulerActions.STRAIGHT_LINE.id) {
      this.toggleMeasuringStick()
      // clear copper ruler action
      this.clearRulerCopperAction()
    }  else if (this.state.currentRulerAction.id === this.allRulerActions.COPPER.id ||
      this.state.currentRulerAction.id === this.allRulerActions.ROAD_SEGMENT.id) {
      // clear straight line ruler action
      this.clearStraightLineAction()
      this.clearRulerCopperAction()
      this.rulerCopperAction() 
      this.showRemoveRulerButton()
    }
  }

  // **************** Stright Line Methods ***************************

  toggleMeasuringStick () {
    this.measuringStickEnabled = true
    this.clearRulers()
    if (this.measuringStickEnabled) {
      this.clickListener = google.maps.event.addListener(this.state.mapRef, 'click', (point) => {
        this.state.currentRulerAction.id === this.allRulerActions.STRAIGHT_LINE.id && this.addToRulerSegments(point.latLng)
      })
    } else {
      google.maps.event.removeListener(this.clickListener)
    }
    this.props.selectedToolBarAction(null)
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
      map: this.state.mapRef,
      draggable: true,
      zIndex: 100
    })

    this.rulerSegments.push(ruler)

    // if this is the first marker, add a label and link it to the first marker
    if (this.rulerSegments.length === 1) {
      var event = new CustomEvent('measuredDistance', { detail : 0});
      window.dispatchEvent(event);
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
      map: this.state.mapRef
    })
  }

  updateLengthLabel () {
    var total

    if (this.rulerSegments.length) {
      total = _(this.rulerSegments).reduce((length, ruler, index) => {
        var prev
        // ignore the first ruler.... work from current ruler to the previous ruler
        if (index) {
          prev = this.rulerSegments[index - 1]
          return length + google.maps.geometry.spherical.computeDistanceBetween(prev.getPosition(), ruler.getPosition())
        } else {
          return 0
        }
      }, 0)

      var event = new CustomEvent('measuredDistance', { detail : total});
      window.dispatchEvent(event);
      // Unable to call in Render Method so called here
      this.showRemoveRulerButton();
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
    var event = new CustomEvent('measuredDistance', { detail : this.measuredDistance});
    window.dispatchEvent(event);
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

// **************** Road Segment Methods ***************************

  rulerCopperAction () {
    this.getCopperPoints()
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
    this.copperClicklistener = google.maps.event.addListener(this.state.mapRef, 'click', (event) => {
      if (!event || !event.latLng || this.state.currentRulerAction.id === this.allRulerActions.STRAIGHT_LINE.id) {
        return
      }

      var copperMarker = new google.maps.Marker({
        position: event.latLng,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 2
        },
        map: this.state.mapRef,
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
    const {optimizationInputs, activeSelectionModeId, locationLayers, plan} = this.props
    var optimizationBody = this.props.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan)
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
    var spatialEdgeType = this.state.currentRulerAction.id === this.allRulerActions.COPPER.id ? this.SPATIAL_EDGE_COPPER : this.SPATIAL_EDGE_ROAD
    optimizationBody.spatialEdgeType = spatialEdgeType
    optimizationBody.directed = false
    AroHttp.post('/service/v1/network-analysis/p2p', optimizationBody)
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
        this.copperPath = this.state.mapRef.data.addGeoJson(geoJson)
        this.state.mapRef.data.setStyle(function (feature) {
          return {
            strokeColor: '#000000',
            strokeWeight: 4
          }
        })
        var event = new CustomEvent('measuredDistance', { detail : result.data.length});
        window.dispatchEvent(event);
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
        this.state.mapRef.data.remove(this.copperPath[i])
      }
    }
  }

  clearCopperMarkers () {
    this.copperMarkers && this.copperMarkers.map((marker) => this.clearRulerMarker(marker))
    this.copperMarkers = []
  }

  closeDropdowns () {
    if (this.props.isViewSettingsEnabled) {
      jQuery('.view-dropdown').toggle()
      this.props.setIsViewSettingsEnabled(false)
    }
    if (this.props.isRulerEnabled) {
      jQuery('.ruler-dropdown').toggle()
      this.rulerAction()
    }
  }

  showRemoveRulerButton () {
    this.setState({showRemoveRulerButton: this.rulerSegments && (this.rulerSegments.length > 1)})
  }


  setSelectionSingle () {
    this.props.selectedToolBarAction(null)
    this.setSelectionMode(this.targetSelectionModes.SINGLE_PLAN_TARGET)
  }

  setSelectionPolygon () {
    this.props.selectedToolBarAction(null)
    this.setSelectionMode(this.targetSelectionModes.POLYGON_PLAN_TARGET)
  }

  setSelectionExport () {
    if (this.props.selectedDisplayMode != 'VIEW') return
    if (this.props.selectedToolBarAction === this.toolbarActions.POLYGON_EXPORT) {
      this.props.selectedToolBarAction(null)
      return
    }
    this.props.selectedToolBarAction(this.toolbarActions.POLYGON_EXPORT)
    this.setSelectionMode(this.targetSelectionModes.POLYGON_EXPORT_TARGET)
  }

  setSelectionMode (selectionMode) {
    this.props.selectedTargetSelectionModeAction(selectionMode)
    // This Method is implemented in AngularJs to Trigger a digest cycle which not needed in React
    //this.$timeout() // Trigger a digest cycle as the toolbar state has changed
  }

  showRfpWindow(){
    this.props.showFullScreenContainer()
  }

  openMapReportsVisibility(){
    this.props.setMapReportsVisibility(!this.props.isMapReportsVisible)
  }

  openAnnotationListVisibility(){
    this.props.setAnnotationListVisibility(!this.props.isAnnotationsListVisible)
  }

  openViewModeExistingPlan(){
    this.props.selectedDisplayModeActions(this.displayModes.VIEW)
    this.props.activeViewModePanelActions(this.viewModePanels.PLAN_INFO)
  }

  openViewModeCoverageBoundry(){
    this.props.selectedDisplayModeActions(this.displayModes.VIEW)
    this.props.activeViewModePanelActions(this.viewModePanels.COVERAGE_BOUNDARY)
    this.setSelectionMode(this.targetSelectionModes.COVERAGE_BOUNDARY)
  }

  initSearchBox () {
    var ids = 0
    var searchSessionToken = uuidStore.getInsecureV4UUID()
    var addBouncingMarker = (latitude, longitude) => {
      var marker = new google.maps.Marker({
        map: map,
        animation: google.maps.Animation.BOUNCE,
        position: { lat: latitude, lng: longitude }
      })
      setTimeout(() => { marker.setMap(null) }, 5000);
    }
    var search = $('#global-search-toolbutton .select2')
    search.select2({
      placeholder: 'Set an address, city, state or CLLI code',
      ajax: {
        url: '/search/addresses',
        dataType: 'json',
        quietMillis: 250, // *** In newer versions of select2, this is called 'delay'. Remember this when upgrading select2
        data: (term) => ({
          text: term,
          sessionToken: searchSessionToken,
          biasLatitude: this.props.defaultPlanCoordinates.latitude,
          biasLongitude: this.props.defaultPlanCoordinates.longitude
        }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: 'id-' + (++ids),
              text: location.displayText,
              type: location.type,
              value: location.value
            }
          })
          if (items.length === 0) {
            items.push({
              id: 'id-' + (++ids),
              text: 'Search an address, city, or state',
              type: 'placeholder'
            })
          }
          return {
            results: items,
            pagination: {
              more: false
            }
          }
        },
        cache: true
      }
    }).on('change', (e) => {
      var selectedLocation = e.added
      if (selectedLocation) {
        const ZOOM_FOR_LOCATION_SEARCH = 17
        if (selectedLocation.type === 'placeId') {
          // This is a google maps place_id. The actual latitude/longitude can be obtained by another call to the geocoder
          var geocoder = new google.maps.Geocoder()
          geocoder.geocode({ 'placeId': selectedLocation.value }, function (results, status) {
            if (status !== 'OK') {
              console.error('Geocoder failed: ' + status)
              return
            }
            var mapObject = {
              latitude: results[0].geometry.location.lat(),
              longitude: results[0].geometry.location.lng(),
              zoom: ZOOM_FOR_LOCATION_SEARCH
            }
            //Due to unable to subscribe requestSetMapCenter as of now used Custom Event Listener
            // https://www.sitepoint.com/javascript-custom-events/
            var event = new CustomEvent('mapChanged', { detail : mapObject});
            window.dispatchEvent(event);
            addBouncingMarker(results[0].geometry.location.lat(), results[0].geometry.location.lng())
          })
        } else if (selectedLocation.type === 'latlng') {
          // The user has searched for a latitude/longitude. Simply go to that position
          var mapObject = {
            latitude: +selectedLocation.value[0],
            longitude: +selectedLocation.value[1],
            zoom: ZOOM_FOR_LOCATION_SEARCH
          }
          var event = new CustomEvent('mapChanged', { detail : mapObject});
          window.dispatchEvent(event);
          addBouncingMarker(+selectedLocation.value[0], +selectedLocation.value[1])
        } else if (selectedLocation.type === 'error') {
          console.error('ERROR when searching for location')
          console.error(selectedLocation)
        }
      }
    })
  }
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

const getAllBoundaryTypesList = state => state.mapLayers.boundaryTypes
const getBoundaryTypesList = createSelector([getAllBoundaryTypesList], (boundaryTypes) => boundaryTypes.toJS())


const mapStateToProps = (state) => ({
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  isAnnotationsListVisible: state.tool.showToolBox && (state.tool.activeTool === Tools.ANNOTATION.id),
  isMapReportsVisible: state.tool.showToolBox && (state.tool.activeTool === Tools.MAP_REPORTS.id),
  showMapReportMapObjects: state.mapReports.showMapObjects,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  selectedTargetSelectionMode: state.toolbar.selectedTargetSelectionMode,
  googleMaps: state.map.googleMaps,
  isRulerEnabled: state.toolbar.isRulerEnabled,
  optimizationInputs: state.optimization.networkOptimization.optimizationInputs,
  activeSelectionModeId: state.selection.activeSelectionMode.id,
  locationLayers: getLocationLayersList(state),
  plan: state.plan.activePlan,
  isViewSettingsEnabled: state.toolbar.isViewSettingsEnabled,
  showSiteBoundary: state.mapLayers.showSiteBoundary,
  boundaryTypes: getBoundaryTypesList(state),
  selectedBoundaryType: state.mapLayers.selectedBoundaryType,
  showDirectedCable: state.toolbar.showDirectedCable,
  showEquipmentLabels: state.toolbar.showEquipmentLabels,
  showLocationLabels: state.viewSettings.showLocationLabels,
  showFiberSize: state.toolbar.showFiberSize,
  configuration: state.toolbar.appConfiguration,
  showGlobalSettings: state.globalSettings.showGlobalSettings
})  

const mapDispatchToProps = (dispatch) => ({
  setPlanInputsModal: (status) => dispatch(ToolBarActions.setPlanInputsModal(status)),
  requestSetMapCenter: (mapRef) => dispatch(MapActions.requestSetMapCenter(mapRef)),
  selectedDisplayModeActions: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
  activeViewModePanelActions: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  setAnnotationListVisibility: isVisible => {
    dispatch(ToolActions.setActiveTool(isVisible ? Tools.ANNOTATION.id : null))
    dispatch(ToolActions.setToolboxVisibility(isVisible))
  },
  setMapReportsVisibility: isVisible => {
    dispatch(ToolActions.setActiveTool(isVisible ? Tools.MAP_REPORTS.id : null))
    dispatch(ToolActions.setToolboxVisibility(isVisible))
    dispatch(MapReportsActions.showMapObjects(isVisible))
  },
  showFullScreenContainer: () => {
    dispatch(FullScreenActions.showOrHideFullScreenContainer(true))
    dispatch(RfpActions.showOrHideAllRfpStatus(true))
  },
  selectedToolBarAction: (value) => dispatch(ToolBarActions.selectedToolBarAction(value)),
  selectedTargetSelectionModeAction: (value) => dispatch(ToolBarActions.selectedTargetSelectionMode(value)),
  setIsRulerEnabled: (value) => dispatch(ToolBarActions.setIsRulerEnabled(value)),
  getOptimizationBody : (optimizationInputs, activeSelectionModeId, locationLayers, plan) => dispatch(ToolBarActions.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan)),
  setIsViewSettingsEnabled: (value) => dispatch(ToolBarActions.setIsViewSettingsEnabled(value)),
  setSelectedBoundaryType: (selectedBoundaryType) => dispatch(MapLayerActions.setSelectedBoundaryType(selectedBoundaryType)),
  setShowSiteBoundary: (value) => dispatch(MapLayerActions.setShowSiteBoundary(value)),
  setShowDirectedCable: (value) => dispatch(ToolBarActions.setShowDirectedCable(value)),
  setShowEquipmentLabelsChanged: (value) => dispatch(ToolBarActions.setShowEquipmentLabelsChanged(value)),
  setShowLocationLabels: showLocationLabels => dispatch(ViewSettingsActions.setShowLocationLabels(showLocationLabels)),
  setShowFiberSize: (value) => dispatch(ToolBarActions.setShowFiberSize(value)),
  createNewPlan: (value) => dispatch(ToolBarActions.createNewPlan(value)),
  loadPlan: (planId) => dispatch(ToolBarActions.loadPlan(planId)),
  loadServiceLayers: () => dispatch(ToolBarActions.loadServiceLayers()),
  setSelectedHeatMapOption: (selectedHeatMapOption) => dispatch(ToolBarActions.setSelectedHeatMapOption(selectedHeatMapOption)),
  setShowGlobalSettings: (status) => dispatch(GlobalsettingsActions.setShowGlobalSettings(status))
})

const ToolBarComponent = wrapComponentWithProvider(reduxStore, ToolBar, mapStateToProps, mapDispatchToProps)
export default ToolBarComponent