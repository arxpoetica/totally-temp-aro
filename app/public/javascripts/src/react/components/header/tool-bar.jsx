import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import './tool-bar.css';
import GlobalSettingsButton from '../global-settings/global-settings-button.jsx'
import Tools from '../tool/tools'
import uuidStore from '../../../shared-utils/uuid-store'
import MapActions from '../map/map-actions'
import ToolBarActions from './tool-bar-actions'
import MapReportsActions from '../map-reports/map-reports-actions'
import ToolActions from '../tool/tool-actions'
import MapReportsListMapObjects from '../map-reports/map-reports-list-map-objects.jsx'
import FullScreenActions from '../full-screen/full-screen-actions'
import RfpActions from '../optimization/rfp/rfp-actions'

export class ToolBar extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }

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
  }

  componentDidMount(){
    this.initSearchBox()
  }

  render() {
    this.initSearchBox();

    const {selectedDisplayMode, activeViewModePanel, isAnnotationsListVisible,
       isMapReportsVisible, showMapReportMapObjects, selectedTargetSelectionMode} = this.props

    let selectedIndividualLocation = (selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW) && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    let selectedMultipleLocation = (selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW) && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    let calculateCoverageBoundry = selectedDisplayMode === this.displayModes.VIEW
    let exportSelectedPolygon = selectedDisplayMode === this.displayModes.VIEW && activeViewModePanel !== this.viewModePanels.EDIT_LOCATIONS
    
    return(
      <div className="tool-bar" style={{margin: '10px'}}>

        <img src="images/logos/aro/logo_navbar.png" className="no-collapse" style={{alignSelf: 'center', paddingLeft: '10px', paddingRight: '10px'}}/>

        <div className="no-collapse" id="global-search-toolbutton" style={{flex: '0 0 250px', margin: 'auto', width: '250px'}}>
          <input className="form-control select2" style={{padding:'0px', borderRadius: '0px'}} type="text" placeholder="Search an address, city, or state"/>
        </div>

        <div className="fa fa-search no-collapse" style={{paddingLeft: '10px', paddingRight: '10px', margin: 'auto', color: '#eee'}}></div>

        <div className="separator no-collapse"></div>

        <GlobalSettingsButton/>

        <div className="separator"></div>

        <button className="btn" title="Create a new plan">
          <i className="fa fa-file"></i>
        </button>

        <button className="btn" onClick={(e) => this.savePlanAs()}  title="Save plan as...">
          <i className="far fa-save"></i>
        </button>

        <button className="btn" title="Open an existing plan..." onClick={(e) => this.openViewModeExistingPlan()}>
          <i className="fa fa-folder-open"></i>
        </button>

        <div className="separator"></div>

        <div className="rulerDropdown">
          <button className="btn" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Ruler">
            <i className="fa fa-ruler"></i>
          </button>
        </div>

        <div className="myDropdown1">
          <button className="btn" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Show view settings...">
            <i className="fa fa-eye"></i>
          </button>
        </div>

        {selectedDisplayMode === this.displayModes.ANALYSIS || selectedDisplayMode === this.displayModes.VIEW &&
          <div className="separator"></div>
        }
        
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

        <button style={{ display: calculateCoverageBoundry ? 'block' : 'none' }} 
          className={`btn ${selectedTargetSelectionMode === this.targetSelectionModes.COVERAGE_BOUNDARY ? 'btn-selected' : ''} ${calculateCoverageBoundry === true ? 'ng-hide-remove' : 'ng-hide-add'}`}
          onClick={(e) => this.openViewModeCoverageBoundry()}
          title="Calculate coverage boundary">
          <i className="fa fa-crosshairs fa-rotate-180"></i>
        </button>
        
        <button style={{ display: exportSelectedPolygon ? 'block' : 'none' }}
          className={`btn ${selectedTargetSelectionMode === this.targetSelectionModes.POLYGON_EXPORT_TARGET ? 'btn-selected' : ''} ${exportSelectedPolygon === true ? 'ng-hide-remove' : 'ng-hide-add'}`}
          onClick={(e) => this.setSelectionExport()}
          title="Export selected polygon">
          <i className="fa fa-cube"></i>
        </button>

        <button className="btn" title="Show RFP status" 
          onClick={(e) => this.showRfpWindow()}>
          <i className="fa fa-cloud"></i>
        </button>

      </div>
    )
  }

  setSelectionSingle () {
    this.props.selectedToolBarAction(null)
    this.props.activeViewModePanelActions(null)
    this.setSelectionMode(this.targetSelectionModes.SINGLE_PLAN_TARGET)
  }

  setSelectionPolygon () {
    this.props.selectedToolBarAction(null)
    this.props.activeViewModePanelActions(null)
    this.setSelectionMode(this.targetSelectionModes.POLYGON_PLAN_TARGET)
  }

  setSelectionExport () {
    this.props.activeViewModePanelActions(null)
    this.setSelectionMode(this.targetSelectionModes.POLYGON_EXPORT_TARGET)
  }

  setSelectionMode (selectionMode) {
    this.props.selectedTargetSelectionModeAction(selectionMode)
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

  savePlanAs(){
    this.props.setPlanInputsModal(true)
  }
}

const mapStateToProps = (state) => ({
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  isAnnotationsListVisible: state.tool.showToolBox && (state.tool.activeTool === Tools.ANNOTATION.id),
  isMapReportsVisible: state.tool.showToolBox && (state.tool.activeTool === Tools.MAP_REPORTS.id),
  showMapReportMapObjects: state.mapReports.showMapObjects,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  selectedTargetSelectionMode: state.toolbar.selectedTargetSelectionMode,
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
  selectedTargetSelectionModeAction: (value) => dispatch(ToolBarActions.selectedTargetSelectionMode(value))
})

const ToolBarComponent = wrapComponentWithProvider(reduxStore, ToolBar, mapStateToProps, mapDispatchToProps)
export default ToolBarComponent