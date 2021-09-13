import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import './tool-bar.css'
import LocationSearch from './location-search.jsx'
import Tools from '../tool/tools'
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
import RxState from '../../common/rxState'
import PlanInputsModal from './plan-inputs-modal.jsx'
import GlobalsettingsActions from '../global-settings/globalsettings-action'
import GlobalSettings from '../global-settings/global-settings.jsx'
import { logoutApp } from '../../common/view-utils'

export class ToolBar extends Component {
  constructor (props) {
    super(props)

    this.rxState = new RxState() // For RxJs implementation in reactjs

    // ToDo: these constants need to be global
    
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

    // Map tile settings used for debugging
    this.rxState.mapTileOptions.getMessage().subscribe((mapTileOptions) => {
      this.mapTileOptions = JSON.parse(JSON.stringify(mapTileOptions))
    })

    this.rangeValues = []
    const initial = 1000
    const final = 5000000
    let incrementby = 1000
    for (let i = initial; i <= final; i = i + incrementby) {
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

    this.state = {
      currentRulerAction: this.allRulerActions.STRAIGHT_LINE,
      showRemoveRulerButton: false,
      heatMapOption: this.mapTileOptions.selectedHeatmapOption.id === 'HEATMAP_ON',
      sliderValue: this.rangeValues.indexOf(this.mapTileOptions.heatMap.worldMaxValue),
      showDropDown: false,
      marginPixels: 10, // Margin between the container and the div containing the buttons
      dropdownWidthPixels: 36, // The width of the dropdown button
      isAccountSettingsEnabled: false,
      isOpenAccountSettings: false
    }

    this.props.loadServiceLayers() // To load Service layer in advance

    this.refreshToolbar = this.refreshToolbar.bind(this) // To bind a function
    this.openAccountSettingsModal = this.openAccountSettingsModal.bind(this) // To bind a function

    // To Trigger refreshToolbar() by Listening to the custom event from map-split.js $document.ready() method
    // https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
    window.addEventListener('toolBarResized', () => {
      setTimeout(() => this.refreshToolbar(), 0)
    })

    // To set selectedFiberOptionin in viewSetting redux state
    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption = this.props.viewFiberOptions[0]
    this.props.setViewSetting(newViewSetting)
  }

  componentDidMount(){
    // To Trigger refreshToolbar() when window resized
    // https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
    setTimeout(() => window.addEventListener('resize', this.refreshToolbar), 0)
  }

  // https://reactjs.org/docs/react-component.html#componentdidupdate
  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      setTimeout(() => this.refreshToolbar(), 0) // To Trigger refreshToolbar() when props changed
    }
  }

  render () {
    // AppConfiguration takes some time to create a perspective object so this condition is required
    return Object.keys(this.props.configuration).length === 0
      ? null
      : this.renderToolBar()
  }

  renderToolBar() {
    this.refreshSlidertrack() // To re-render Heatmap intensity slider

    const { selectedDisplayMode, activeViewModePanel, isAnnotationsListVisible, isMapReportsVisible,
      showMapReportMapObjects, selectedTargetSelectionMode, isRulerEnabled, isViewSettingsEnabled,
      boundaryTypes, showDirectedCable, showEquipmentLabels, showLocationLabels, showFiberSize,
      configuration, showGlobalSettings, showSiteBoundary, selectedBoundaryType,
      viewSetting, viewFiberOptions } = this.props

    const { currentRulerAction, showRemoveRulerButton, heatMapOption, sliderValue,
      showDropDown, marginPixels, dropdownWidthPixels, isAccountSettingsEnabled,
      isOpenAccountSettings } = this.state

    const selectedIndividualLocation = (
      selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW
    ) && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    const selectedMultipleLocation = (
      selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW
    ) && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    && configuration.perspective.showToolbarButtons.selectionPolygon
    const calculateCoverageBoundry = selectedDisplayMode === this.displayModes.VIEW
    const exportSelectedPolygon = selectedDisplayMode === this.displayModes.VIEW
      && configuration.perspective.showToolbarButtons.exportSelection
      && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    const isEphemeralPlan = configuration.perspective.showToolbarButtons.ephemeralPlan
    const isSavePlanAs = configuration.perspective.showToolbarButtons.savePlanAs
    const isPlanModel = configuration.perspective.showToolbarButtons.planModel
    const isMeasuringStick = configuration.perspective.showToolbarButtons.measuringStick
    const isViewSettings = configuration.perspective.showToolbarButtons.viewSettings

    // To set Dynamic Background color for select2-results using jQuery
    $(".select2-results").css("background-color", configuration.toolbar.toolBarColor)

    // TODO: ARO_CLIENT should never be checked in views, these images should be in settings
    const { ARO_CLIENT } = configuration
    const isFrontier = ARO_CLIENT === 'frontier'
    let leftElement = <img src={`images/logos/${ARO_CLIENT}/logo_navbar.png`} className="no-collapse"
      style={{alignSelf: 'center', paddingLeft: '10px', paddingRight: '10px'}}
    />
    if (isFrontier) {
      leftElement = <span style={{alignSelf: 'center', paddingLeft: '10px', paddingRight: '10px'}}><b>NPM BSA</b></span>
    }

    return (
      <div className="tool-bar" style={{margin: marginPixels, backgroundColor: configuration.toolbar.toolBarColor}}>
        { leftElement }
        <LocationSearch currentView='toolBarSearch'/>
        <div className="separator"></div>

        {configuration.perspective.showToolbarButtons.globalSettings &&
          <button className="btn"
            title="Global Settings..."
            onClick={() => this.showGlobalSettings()}>
            <i className="fa fa-th"></i>
          </button>
        }
        {showGlobalSettings &&
          <GlobalSettings />
        }

        <div className="separator"></div>

        <button className="btn" title="Create a new plan" style={{ display: isEphemeralPlan ? 'block' : 'none' }}
          onClick={() => this.createEphemeralPlan()}>
          <i className="fa fa-file"></i>
        </button>

        <button className="btn" title="Save plan as..." style={{ display: isSavePlanAs ? 'block' : 'none' }}
          onClick={() => this.savePlanAs()}>
          <i className="far fa-save"></i>
        </button>
        <PlanInputsModal></PlanInputsModal>

        <button className="btn" title="Open an existing plan..." style={{ display: isPlanModel ? 'block' : 'none' }}
          onClick={() => this.openViewModeExistingPlan()}>
          <i className="fa fa-folder-open"></i>
        </button>

        <div className="separator"></div>

        {/* Ruler */}
        <div className="rulerDropdown" style={{ display: isMeasuringStick ? 'block' : 'none' }}>
          <button className={`btn ${isRulerEnabled ? 'btn-selected' : ''}`}
            type="button" onClick={() => this.rulerAction()}
            aria-haspopup="true" aria-expanded="false" title="Ruler">
            <i className="fa fa-ruler"></i>
          </button>
          <div
            className="dropdown-menu dropdown-menu-right ruler-dropdown"
            style={{ display: isRulerEnabled ? 'block' : 'none' }}
          >
            <div className="ruler-container">
              <select
                className="form-control"
                value={currentRulerAction.id}
                onChange={(event) => {this.onChangeRulerDropdown(event)}}
              >
                {this.rulerActions.map((item, index) =>
                  <option key={index} value={item.id} label={item.label}></option>
                )}
              </select>
              {showRemoveRulerButton &&
                <button type="button" className="btn btn-primary ruler-undo-btn form-control"
                  onClick={() => this.removeLastRulerMarker()}>
                  <i className="fa fa-minus"></i>
                </button>  
              }
            </div>
          </div>
        </div>

        {/* Show View Settings */}
        <div className="myDropdown1">
          <button className={`btn ${isViewSettingsEnabled ? 'btn-selected' : ''}`}
            style={{ display: isViewSettings ? 'block' : 'none' }}
            type="button" onClick={() => this.viewSettingsAction()}
            aria-haspopup="true" aria-expanded="false" title="Show view settings...">
            <i className="fa fa-eye"></i>
          </button>

          <div
            className="dropdown-menu dropdown-menu-right view-dropdown"
            style={{ display: isViewSettingsEnabled ? 'block' : 'none' }}
          >
            {/* Location Heat Map */}
            <input
              type="checkbox"
              className="checkboxfill"
              checked={heatMapOption}
              style={{marginLeft: '2px'}}
              onChange={() => this.toggleHeatMapOptions()}
            />
            <span>Location Heatmap On</span>
            {heatMapOption &&
              <>
                <div className="dropdown-divider"></div>
                <span>Heatmap Intensity</span>
                <div style={{padding: '0px 10px'}}>
                  <input
                    type="range"
                    min={this.min}
                    max={this.max}
                    value={sliderValue}
                    className="aro-slider"
                    onChange={(event) => {this.changeHeatMapOptions(event); this.refreshSlidertrack()}}
                  />
                </div>
              </>
            }

            {/* Location Labels */}
            <div className="dropdown-divider"></div>
            <input
              type="checkbox"
              className="checkboxfill"
              checked={showLocationLabels}
              style={{marginLeft: '2px'}}
              onChange={() => this.showLocationLabelsChanged()}
            />
            <span>Location Labels</span>

            {/* Equipment Boundaries */}
            {configuration.toolbar.showSiteBoundaries && configuration.toolbar !== undefined &&
            <>
              <div className="dropdown-divider"></div>
              <input
                type="checkbox"
                className="checkboxfill"
                checked={showSiteBoundary}
                style={{marginLeft: '2px'}}
                onChange={() => this.toggleSiteBoundary()}
              />
              {/* TODO: See https://www.pivotaltracker.com/n/projects/2468285/stories/177344788 */}
              <span>{isFrontier ? 'Site' : 'Equipment'} Boundaries</span>
              {showSiteBoundary &&
                <select className="form-control" value={selectedBoundaryType.description}
                  onChange={(event) => this.onChangeSiteBoundaries(event)}>
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
              <input
                type="checkbox"
                className="checkboxfill"
                checked={showDirectedCable}
                style={{marginLeft: '2px'}}
                onChange={(event) => this.showCableDirection(event)}
              />
              <span>Directed Cable</span>
            </>
            }

            {/* Equipment Labels */}
            {configuration.perspective.viewSettings.showSiteLabels &&
            <>
              <div className="dropdown-divider"></div>
              <input
                type="checkbox"
                className="checkboxfill"
                checked={showEquipmentLabels}
                style={{marginLeft: '2px'}}
                onChange={(event) => this.showEquipmentLabelsChanged(event)}
              />
              {/* TODO: See https://www.pivotaltracker.com/n/projects/2468285/stories/177344788 */}
              <span>{isFrontier ? 'Site' : 'Equipment'} Labels</span>
            </>
            }

            {/* Fiber Size */}
            {configuration.perspective.viewSettings.showFiberSize &&
            <>
              <div className="dropdown-divider"></div>
              <input
                type="checkbox"
                className="checkboxfill"
                checked={showFiberSize}
                style={{marginLeft: '2px'}}
                onChange={(event) => this.setShowFiberSize(event)}
              />
              <span>Fiber Size</span>
              {showFiberSize &&
                <select className="form-control" value={viewSetting.selectedFiberOption.name}
                  onChange={(event) => this.onChangeSelectedFiberOption(event)}>
                  {viewFiberOptions.map((item, index) =>
                    <option key={index} value={item.name} label={item.name}></option>
                  )}
                </select>
              }
            </>
            }
          </div>
        </div>

        <div
          style={{ display: selectedDisplayMode === this.displayModes.ANALYSIS
            || selectedDisplayMode === this.displayModes.VIEW? 'block' : 'none' }}
          className="separator" 
        />

        <button style={{ display: selectedIndividualLocation ? 'block' : 'none' }}
          className={
            `btn ${selectedTargetSelectionMode === this.targetSelectionModes.SINGLE_PLAN_TARGET ? 'btn-selected' : ''}
            ${selectedIndividualLocation === true ? 'ng-hide-remove' : 'ng-hide-add'}`
          }
          onClick={() => this.setSelectionSingle()}
          title="Select individual locations">
          <i className="fa fa-mouse-pointer"></i>
        </button>

        <button style={{ display: selectedMultipleLocation ? 'block' : 'none' }}
          className={
            `btn ${selectedTargetSelectionMode === this.targetSelectionModes.POLYGON_PLAN_TARGET ? 'btn-selected' : ''}
            ${selectedMultipleLocation === true ? 'ng-hide-remove' : 'ng-hide-add'}`
          }
          onClick={() => this.setSelectionPolygon()}
          title="Select multiple locations">
          <i className="fa fa-draw-polygon"></i>
        </button>

        <button className={`btn ${isAnnotationsListVisible ? 'btn-selected' : ''}`}
          title="Annotation" onClick={() => this.openAnnotationListVisibility()}>
          <i className="fa fa-paint-brush"></i>
        </button>

        <button className={`btn ${isMapReportsVisible ? 'btn-selected' : ''}`}
          title="PDF Reports" onClick={() => this.openMapReportsVisibility()}>
          <i className="fas fa-print"></i>
        </button>

        {showMapReportMapObjects &&
          <MapReportsListMapObjects />
        }

        <div className="separator"></div>

        {configuration.perspective.showToolbarButtons.openCoverageBoundary &&
          <button style={{ display: calculateCoverageBoundry ? 'block' : 'none' }}
            className={
              `btn ${selectedTargetSelectionMode === this.targetSelectionModes.COVERAGE_BOUNDARY
              && activeViewModePanel === this.viewModePanels.COVERAGE_BOUNDARY ? 'btn-selected' : ''}
              ${calculateCoverageBoundry === true ? 'ng-hide-remove' : 'ng-hide-add'}`
            }
            onClick={() => this.openViewModeCoverageBoundry()}
            title="Calculate coverage boundary">
            <i className="fa fa-crosshairs fa-rotate-180"></i>
          </button>
        }

        <button
          style={{ display: exportSelectedPolygon ? 'block' : 'none' }}
          className={
            `btn ${selectedTargetSelectionMode === this.targetSelectionModes.POLYGON_EXPORT_TARGET
              ? 'btn-selected'
              : ''
            } ${exportSelectedPolygon === true ? 'ng-hide-remove' : 'ng-hide-add'}`
          }
          onClick={() => this.setSelectionExport()}
          title="Export selected polygon">
          <i className="fa fa-cube"></i>
        </button>

        <button className="btn" title="Show RFP status"
          onClick={() => this.showRfpWindow()}>
          <i className="fa fa-cloud"></i>
        </button>

        {/* Dynamic Dropdown for Toolbar icons */}
        <div
          className="dropdown"
          style={{ display: !showDropDown ? 'none' : 'block',
            borderLeft: '#eee 1px dotted', width: dropdownWidthPixels }}
        >
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

        <div className="separator"></div>

        <button className="btn" onClick={() => this.refreshTiles()}
          data-toggle="tooltip"
          data-placement="bottom"
          title="Refresh tiles">
          <i className="fa fa-sync-alt"></i>
        </button>

        <div className="separator"></div>

         {/* Account Settings */}
         <div className="accountDropdown" onMouseLeave={() => this.setState({ isAccountSettingsEnabled: false})}>
          <button className={`btn ${this.state.isAccountSettingsEnabled ? 'btn-selected' : ''}`}
            type="button"
            onClick={() => this.openAccountSettingsDropDown()}
            aria-haspopup="true" aria-expanded="false" title="Account Settings">
            <i className="fa fa-user-cog" />
          </button>

          <div
            className="dropdown-menu dropdown-menu-right account-settings-dropdown"
            style={{ display: isAccountSettingsEnabled ? 'block' : 'none' }}
          > 
            <span onClick={() => this.openAccountSettingsModal(true)}>Account Settings</span>
            <div className="dropdown-divider" />
            <span onClick={() => logoutApp()}>Logout</span>
          </div>
        </div>
        {isOpenAccountSettings &&
          <GlobalSettings
            currentViewProps='My Account'
            openAccountSettingsModal={this.openAccountSettingsModal}
          />
        }
      </div>
    )
  }

  openAccountSettingsDropDown () {
    if (!this.state.isAccountSettingsEnabled) { this.closeDropdowns() }
    this.setState({ isAccountSettingsEnabled: !this.state.isAccountSettingsEnabled})
  }

  openAccountSettingsModal (status) {
    this.setState({ isOpenAccountSettings: status })
  }
  
  refreshTiles () {
    const refreshTileCmd = {
      'dataTypes': [
        'subnet'
      ]
    }
    AroHttp.post(`/service/v1/plan-command/refresh?user_id=${this.props.loggedInUser.id}&plan_id=${this.props.plan.id}`, refreshTileCmd)
      .catch(err => console.error(err))
  }

  showGlobalSettings(){
    this.props.setShowGlobalSettings(true)
  }

  refreshToolbar () {
    const element = jQuery(".reactCompClass").get() // To get the <r-tool-bar> component Elements
    if (element) {

      const toolBarElement = jQuery(".tool-bar").get()
      const dropDownElement = jQuery(".tool-bar .dropdown").get()
      const ulElement = jQuery(".tool-bar .dropdown ul").get()

      // Some of the buttons may be in the dropdown menu because the toolbar is collapsed.
      // Move them into the main toolbar before checking for button sizes.
      const toolbarRoot = toolBarElement[0]
      const dropdownRoot = dropDownElement[0]
      // The width of the toolbar is the clientWidth minus the margins minus the width of the dropdown.
      // We assume that the dropdown is shown while computing which buttons to collapse.
      const toolbarWidth = element[0].clientWidth - this.state.marginPixels * 2.0 - this.state.dropdownWidthPixels
      const dropdownUL = ulElement[0]
      // Loop through all the <li> elements in the dropdown. These <li> elements contain the buttons.
      const dropdownItems = jQuery(".tool-bar .dropdown ul li").get()

      for (let i = 0; i < dropdownItems.length; ++i) {
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
      let cumulativeWidth = 0
      let collapsedButtons = 0 // Counted from the right side.
      const toolbarButtons = [] // A list of toolbar buttons
      if (toolbarRoot !== undefined) {
        toolbarRoot.childNodes.forEach((toolbarButton) => {
          // There may also be markup like newlines which show up as "text" elements that have a NaN scrollWidth.
          // Ignore these elements (also ignore the dropdown button itself - this may be shown or hidden).
          const isDropDown = toolbarButton.className && toolbarButton.className.indexOf('dropdown') >= 0
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

      this.setState({ showDropDown: collapsedButtons > 0 })

      // This Method is implemented in AngularJs to Trigger a digest cycle which not needed in React
      // if (this.numPreviousCollapsedButtons !== collapsedButtons) {
      //   this.$timeout() // Trigger a digest cycle as the toolbar state has changed
      // }
      // this.numPreviousCollapsedButtons = collapsedButtons

      // If we have any collapsed buttons, then move them into the dropdown
      if (collapsedButtons > 0) {
        for (let i = toolbarButtons.length - collapsedButtons; i < toolbarButtons.length; ++i) {
          const li = document.createElement('li')
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

  onChangeSelectedFiberOption (event) {
    // To set selectedFiberOptionin in viewSetting redux state
    const newViewSetting = JSON.parse(JSON.stringify(this.props.viewSetting))
    newViewSetting.selectedFiberOption = this.props.viewFiberOptions.filter(
      selectedFiberOption => selectedFiberOption.name === event.target.value
    )[0]
    this.props.setViewSetting(newViewSetting)
    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  setShowFiberSize () {
    this.props.setShowFiberSize(!this.props.showFiberSize)
    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  showLocationLabelsChanged () {
    this.props.setShowLocationLabels(!this.props.showLocationLabels)
  }

  showEquipmentLabelsChanged () {
    this.props.setShowEquipmentLabelsChanged(!this.props.showEquipmentLabels)
    this.rxState.viewSettingsChanged.sendMessage()
    this.rxState.requestMapLayerRefresh.sendMessage(null)
  }

  showCableDirection () {
    this.props.setShowDirectedCable(!this.props.showDirectedCable)
    this.rxState.viewSettingsChanged.sendMessage()
  }

  onChangeSiteBoundaries (event) {
    this.props.setSelectedBoundaryType(this.props.boundaryTypes[event.target.selectedIndex])
    this.props.setShowSiteBoundary(true)
  }

  toggleSiteBoundary () {
    this.props.setShowSiteBoundary(!this.props.showSiteBoundary)
    this.rxState.viewSettingsChanged.sendMessage() // This will also refresh the map layer
  }

  viewSettingsAction () {
    if (!this.props.isViewSettingsEnabled) { this.closeDropdowns() }
    this.props.setIsViewSettingsEnabled(!this.props.isViewSettingsEnabled)
  }

  toggleHeatMapOptions () {
    this.setState({ heatMapOption: !this.state.heatMapOption }, function() {
      const newMapTileOptions = JSON.parse(JSON.stringify(this.mapTileOptions))
      newMapTileOptions.selectedHeatmapOption = this.state.heatMapOption 
        ? this.props.viewSetting.heatmapOptions[0] : this.props.viewSetting.heatmapOptions[2]
      this.rxState.mapTileOptions.sendMessage(newMapTileOptions) // This will also refresh the map layer
      this.refreshSlidertrack()
    })
    // To set selectedHeatmapOption in redux state
    this.props.setSelectedHeatMapOption(!this.state.heatMapOption 
      ? this.props.viewSetting.heatmapOptions[0].id : this.props.viewSetting.heatmapOptions[2].id)
  }

  changeHeatMapOptions (event) {
    this.setState({ sliderValue: event.target.value }, function() {
      const newMapTileOptions = JSON.parse(JSON.stringify(this.mapTileOptions))
      newMapTileOptions.heatMap.worldMaxValue = this.rangeValues[this.state.sliderValue]
      this.rxState.mapTileOptions.sendMessage(newMapTileOptions) // This will also refresh the map layer
    })
  }

  refreshSlidertrack () {
    const val = (this.state.sliderValue - this.min) / (this.max - this.min)
    jQuery('.myDropdown1 input[type="range"]').css('background-image',
      '-webkit-gradient(linear, left top, right top, ' +
      'color-stop(' + val + ', #1f7de6), ' +
      'color-stop(' + val + ', #C5C5C5)' +
      ')'
    )
  }

  rulerAction () {
    if (!this.props.isRulerEnabled) { this.closeDropdowns() }
    this.props.setIsRulerEnabled(!this.props.isRulerEnabled)
    this.enableRulerAction()

    !this.props.isRulerEnabled
      ? this.props.mapRef.setOptions({ draggableCursor: 'crosshair' })
      : this.props.mapRef.setOptions({ draggableCursor: null })
    this.showRemoveRulerButton() // To disable ruler (-) icon
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

  onChangeRulerDropdown(event){
    let prestineCurrentRulerAction = this.state.currentRulerAction
    Object.entries(this.allRulerActions).map(([objKey, objValue]) => {
      if (objKey === event.target.value){
        prestineCurrentRulerAction = objValue
      }
    })
    this.setState({ currentRulerAction: prestineCurrentRulerAction }, function() {
      this.onChangeRulerAction()
    })
  }

  onChangeRulerAction () {

    if (this.state.currentRulerAction.id === this.allRulerActions.STRAIGHT_LINE.id) {
      this.toggleMeasuringStick()
      // clear copper ruler action
      this.clearRulerCopperAction()
    } else if (this.state.currentRulerAction.id === this.allRulerActions.COPPER.id ||
      this.state.currentRulerAction.id === this.allRulerActions.ROAD_SEGMENT.id) {
      // clear straight line ruler action
      this.clearStraightLineAction()
      this.clearRulerCopperAction()
      this.rulerCopperAction()
      this.showRemoveRulerButton() // To disable ruler (-) icon
    }
  }

  // **************** Stright Line Methods ***************************

  toggleMeasuringStick () {
    this.measuringStickEnabled = true
    this.clearRulers()
    if (this.measuringStickEnabled) {
      this.clickListener = google.maps.event.addListener(this.props.mapRef, 'click', (point) => {
        this.state.currentRulerAction.id === this.allRulerActions.STRAIGHT_LINE.id
        && this.addToRulerSegments(point.latLng)
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
    // add a marker
    const ruler = new google.maps.Marker({
      position: latLng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 2
      },
      map: this.props.mapRef,
      draggable: true,
      zIndex: 100
    })

    this.rulerSegments.push(ruler)

    // if this is the first marker, add a label and link it to the first marker
    if (this.rulerSegments.length === 1) {
      const event = new CustomEvent('measuredDistance', { detail: 0})
      window.dispatchEvent(event)
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
      map: this.props.mapRef
    })
  }

  updateLengthLabel () {
    if (this.rulerSegments.length) {
      const total = _(this.rulerSegments).reduce((length, ruler, index) => {
        // ignore the first ruler.... work from current ruler to the previous ruler
        if (index) {
          const prev = this.rulerSegments[index - 1]
          return length + google.maps.geometry.spherical.computeDistanceBetween(
            prev.getPosition(), ruler.getPosition()
          )
        } else {
          return 0
        }
      }, 0)

      const event = new CustomEvent('measuredDistance', { detail: total})
      window.dispatchEvent(event)
      // Unable to call in Render Method so called here
      this.showRemoveRulerButton() // To disable ruler (-) icon
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
    const event = new CustomEvent('measuredDistance', { detail: this.measuredDistance})
    window.dispatchEvent(event)
  }

  removeLastRulerMarker () {
    if (this.rulerSegments.length) {
      const last = _(this.rulerSegments).last()
      this.rulerSegments = _(this.rulerSegments).without(last)

      this.clearRulerMarker(last)
      this.rulerDrawEvent()
    }
  }

  // **************** Road Segment Methods ***************************

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
    this.copperClicklistener = google.maps.event.addListener(this.props.mapRef, 'click', (event) => {
      if (!event || !event.latLng
        || this.state.currentRulerAction.id === this.allRulerActions.STRAIGHT_LINE.id) {
        return
      }

      const copperMarker = new google.maps.Marker({
        position: event.latLng,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 2
        },
        map: this.props.mapRef,
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
    const maxDistance = 25 * config.length.length_units_to_meters
    if (google.maps.geometry.spherical.computeDistanceBetween(this.copperPoints[0].latLng,
      this.copperPoints[this.copperPoints.length - 1].latLng) > maxDistance) {
      const errorText = 'Selected points are too far apart for ruler analysis. Please select points which are closer.'
      swal({ title: 'Error!', text: errorText, type: 'error' })
      this.copperPoints = []
      this.clearCopperMarkers()
      return
    }

    // Get the POST body for optimization based on the current application state
    const { optimizationInputs, activeSelectionModeId, locationLayers, plan } = this.props
    const optimizationBody = this.props.getOptimizationBody(
      optimizationInputs, activeSelectionModeId, locationLayers, plan
    )
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'POINT_TO_POINT'
    optimizationBody.pointFrom = {
      type: 'Point',
      coordinates: [this.copperPoints[0].latLng.lng(), this.copperPoints[0].latLng.lat()]
    }
    const pointTo = this.copperPoints[this.copperPoints.length - 1]
    optimizationBody.pointTo = {
      type: 'Point',
      coordinates: [pointTo.latLng.lng(), pointTo.latLng.lat()]
    }
    const spatialEdgeType = this.state.currentRulerAction.id === this.allRulerActions.COPPER.id
      ? this.SPATIAL_EDGE_COPPER
      : this.SPATIAL_EDGE_ROAD
    optimizationBody.spatialEdgeType = spatialEdgeType
    optimizationBody.directed = false
    AroHttp.post('/service/v1/network-analysis/p2p', optimizationBody)
      .then((result) => {
        // get copper properties
        const geoJson = {
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'properties': {},
            'geometry': {}
          }]
        }

        geoJson.features[0].geometry = result.data.path
        this.copperPath = this.props.mapRef.data.addGeoJson(geoJson)
        this.props.mapRef.data.setStyle(function () {
          return {
            strokeColor: '#000000',
            strokeWeight: 4
          }
        })
        const event = new CustomEvent('measuredDistance', { detail: result.data.length})
        window.dispatchEvent(event)
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
      for (let i = 0; i < this.copperPath.length; i++) {
        this.props.mapRef.data.remove(this.copperPath[i])
      }
    }
  }

  clearCopperMarkers () {
    this.copperMarkers && this.copperMarkers.map((marker) => this.clearRulerMarker(marker))
    this.copperMarkers = []
  }

  closeDropdowns () {
    if (this.props.isViewSettingsEnabled) {
      this.props.setIsViewSettingsEnabled(false)
    }
    if (this.props.isRulerEnabled) {
      this.rulerAction()
    }
    if (this.state.isAccountSettingsEnabled) {
      this.openAccountSettingsDropDown()
    }
  }

  showRemoveRulerButton () {
    this.setState({ showRemoveRulerButton: this.rulerSegments && (this.rulerSegments.length > 1) })
  }


  setSelectionSingle () {
    this.props.selectedToolBarAction(null)
    this.props.mapRef.setOptions({ draggableCursor: null })
    this.setSelectionMode(this.targetSelectionModes.SINGLE_PLAN_TARGET)
  }

  setSelectionPolygon () {
    this.props.selectedToolBarAction(null)
    this.props.mapRef.setOptions({ draggableCursor: 'crosshair' })
    this.setSelectionMode(this.targetSelectionModes.POLYGON_PLAN_TARGET)
  }

  setSelectionExport () {
    if (this.props.selectedDisplayMode !== 'VIEW') return
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
    // this.$timeout() // Trigger a digest cycle as the toolbar state has changed
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
}

// We need a selector, else the .toJS() call will create an infinite digest loop
const getAllLocationLayers = state => state.mapLayers.location
const getLocationLayersList = createSelector([getAllLocationLayers], (locationLayers) => locationLayers.toJS())

const getAllBoundaryTypesList = state => state.mapLayers.boundaryTypes
const getBoundaryTypesList = createSelector([getAllBoundaryTypesList], (boundaryTypes) => boundaryTypes.toJS())

const mapStateToProps = (state) => ({
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  isAnnotationsListVisible: state.tool.showToolBox && (state.tool.activeTool === Tools.ANNOTATION.id),
  isMapReportsVisible: state.tool.showToolBox && (state.tool.activeTool === Tools.MAP_REPORTS.id),
  showMapReportMapObjects: state.mapReports.showMapObjects,
  selectedTargetSelectionMode: state.toolbar.selectedTargetSelectionMode,
  mapRef: state.map.googleMaps,
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
  showGlobalSettings: state.globalSettings.showGlobalSettings,
  viewSetting: state.toolbar.viewSetting,
  viewFiberOptions: state.toolbar.viewFiberOptions,
  loggedInUser: state.user.loggedInUser,
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
  getOptimizationBody: (optimizationInputs, activeSelectionModeId, locationLayers, plan) => dispatch(
    ToolBarActions.getOptimizationBody(optimizationInputs, activeSelectionModeId, locationLayers, plan)
  ),
  setIsViewSettingsEnabled: (value) => dispatch(ToolBarActions.setIsViewSettingsEnabled(value)),
  setSelectedBoundaryType: (selectedBoundaryType) => dispatch(
    MapLayerActions.setSelectedBoundaryType(selectedBoundaryType)
  ),
  setShowSiteBoundary: (value) => dispatch(MapLayerActions.setShowSiteBoundary(value)),
  setShowDirectedCable: (value) => dispatch(ToolBarActions.setShowDirectedCable(value)),
  setShowEquipmentLabelsChanged: (value) => dispatch(ToolBarActions.setShowEquipmentLabelsChanged(value)),
  setShowLocationLabels: showLocationLabels => dispatch(ViewSettingsActions.setShowLocationLabels(showLocationLabels)),
  setShowFiberSize: (value) => dispatch(ToolBarActions.setShowFiberSize(value)),
  createNewPlan: (value) => dispatch(ToolBarActions.createNewPlan(value)),
  loadPlan: (planId) => dispatch(ToolBarActions.loadPlan(planId)),
  loadServiceLayers: () => dispatch(ToolBarActions.loadServiceLayers()),
  setSelectedHeatMapOption: (selectedHeatMapOption) => dispatch(
    ToolBarActions.setSelectedHeatMapOption(selectedHeatMapOption)
  ),
  setShowGlobalSettings: (status) => dispatch(GlobalsettingsActions.setShowGlobalSettings(status)),
  setViewSetting: (viewSetting) => dispatch(ToolBarActions.setViewSetting(viewSetting)),
})

const ToolBarComponent = wrapComponentWithProvider(reduxStore, ToolBar, mapStateToProps, mapDispatchToProps)
export default ToolBarComponent
