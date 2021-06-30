import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import MapReportActions from './map-reports-actions'
import MapReportPageEditor from './map-report-page-editor.jsx'
import MapReportsList from './map-reports-list.jsx'
import MapReportsListMapObjects from './map-reports-list-map-objects.jsx'

export class MapReportsDownloader extends Component {
  render () {
    return <div>
      { this.renderContent() }
    </div>
  }

  renderContent () {
    if (this.props.isCommunicating) {
      return this.renderLoadingSpinner()
    } else {
      if (this.props.editingPageUuid) {
        return this.renderEditingPage()
      } else {
        return this.renderReportsList()
      }
    }
  }

  renderLoadingSpinner () {
    return <div className='mb-4 mt-4 text-center'>
      <i className='fa fa-5x fa-spinner fa-spin text-black-50' />
    </div>
  }

  renderEditingPage () {
    return <MapReportPageEditor />
  }

  renderReportsList () {
    return <div>
      <MapReportsList />
      <div className='row pt-3'>
        <div className='col-md-8' style={{ lineHeight: '30px' }}>
          <input
            className='checkboxfill mr-2'
            type='checkbox'
            checked={this.props.manualWait}
            onChange={event => this.props.setManualWait(event.target.checked)}
          />
          Wait time per page (sec)
        </div>
        <div className='col-md-4'>
          <input
            className='form-control form-control-sm'
            type='number'
            disabled={!this.props.manualWait}
            value={this.props.waitSecondsPerPage}
            onChange={event => this.props.setWaitTimePerPage(+event.target.value)}
          />
        </div>
      </div>
        
      <button
        className={'btn btn-sm btn-block mt-2' + (this.props.isDownloading ? ' btn-light' : ' btn-primary')}
        onClick={() => this.doDownloadReport()}
        disabled={this.props.isDownloading}
      >
        {
          this.props.isDownloading
            ? <i className='fa fa-spin fa-spinner mr-2' />
            : <i className='fa fa-download mr-2' />
        }
        {
          this.props.isDownloading ? 'Downloading...' : 'Generate and Download report'
        }
      </button>
    </div>
  }

  doDownloadReport () {
    const pageDefinitions = this.props.reportPages.map(reportPage => {
      const pageDefinition = JSON.parse(JSON.stringify(reportPage))
      pageDefinition.planId = this.props.planId
      pageDefinition.planName = this.props.planName
      pageDefinition.clientId = this.props.clientId
      
      if (this.props.manualWait) {
        pageDefinition.waitSecondsPerPage = this.props.waitSecondsPerPage // The user has asked to manually wait for each page
      }
      pageDefinition.showLocationLabels = this.props.showLocationLabels
      pageDefinition.showEquipmentLabels = this.props.showEquipmentLabels
      // From maplayers, get the layers that we want to display in the report. Also send the location filters.
      pageDefinition.locationFilters = this.props.mapLayers.locationFilters
      pageDefinition.layersTypeVisibility = JSON.parse(JSON.stringify(this.props.layersTypeVisibility))
      pageDefinition.visibleLayers = this.props.mapLayers.location.filter(layer => layer.checked).map(layer => layer.key).toJS();
      pageDefinition.selectedHeatMapOption = this.props.selectedHeatMapOption
      // this needs to be done differently
      pageDefinition.visibleCableConduits = {};
      // ToDo: this should NOT be hardcoded, related to state.js setLoggedInUser (very misnamed and bloated) near service.setNetworkEquipmentLayerVisiblity
      ['boundaries', 'cables', 'conduits', 'equipments', 'roads'].forEach(networkEquipmentCategory => {
        const category = this.props.mapLayers.networkEquipment[networkEquipmentCategory]
        if (category) {
          Object.keys(category).forEach(categoryKey => {
            if (category[categoryKey].checked) {
              pageDefinition.visibleLayers.push(category[categoryKey].key)
              if (networkEquipmentCategory === 'cables') {
                pageDefinition.visibleCableConduits[category[categoryKey].key] = []
              }
            }
          })
        }
      })
      Object.keys(pageDefinition.visibleCableConduits).forEach(cableType => {
        pageDefinition.visibleCableConduits[cableType] = this.props.mapLayers.networkEquipment.cables[cableType].conduitVisibility
      })
      // need to send cable > conduit visibility from (for eg)
      // mapLayers.networkEquipment.cables.FEEDER.conduitVisibility 
      // still thinking about how to properly encode this
      return pageDefinition
    })
    this.props.downloadReport(this.props.planId, pageDefinitions)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (this.props.planId && (this.props.planId !== prevProps.planId)) {
      // Plan ID has changed. Reload the report pages.
      this.props.loadReportPagesForPlan(this.props.planId)
    }
  }

  componentDidMount () {
    this.props.loadReportPagesForPlan(this.props.planId)
  }

  componentWillUnmount () {
    this.props.clearMapReports()
  }
}

MapReportsDownloader.propTypes = {
  planId: PropTypes.number,
  planName: PropTypes.string,
  clientId: PropTypes.string,
  mapLayers: PropTypes.object,
  isCommunicating: PropTypes.bool,
  isDownloading: PropTypes.bool,
  reportPages: PropTypes.array,
  editingPageUuid: PropTypes.string,
  waitSecondsPerPage: PropTypes.number,
  manualWait: PropTypes.bool,
  showLocationLabels: PropTypes.bool
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  planName: state.plan.activePlan.name,
  clientId: state.configuration.system.ARO_CLIENT,
  mapLayers: state.mapLayers,
  isCommunicating: state.mapReports.isCommunicating,
  isDownloading: state.mapReports.isDownloading,
  reportPages: state.mapReports.pages,
  editingPageUuid: state.mapReports.editingPageUuid,
  waitSecondsPerPage: state.mapReports.waitSecondsPerPage,
  manualWait: state.mapReports.manualWait,
  showLocationLabels: state.viewSettings.showLocationLabels,
  showEquipmentLabels: state.toolbar.showEquipmentLabels,
  layersTypeVisibility: state.mapLayers.typeVisibility,
  selectedHeatMapOption: state.toolbar.selectedHeatMapOption,
})

const mapDispatchToProps = dispatch => ({
  loadReportPagesForPlan: planId => dispatch(MapReportActions.loadReportPagesForPlan(planId)),
  downloadReport: (planId, pageDefinitions) => dispatch(MapReportActions.downloadReport(planId, pageDefinitions)),
  clearMapReports: () => dispatch(MapReportActions.clearMapReports()),
  setWaitTimePerPage: waitSecondsPerPage => dispatch(MapReportActions.setWaitTimePerPage(waitSecondsPerPage)),
  setManualWait: manualWait => dispatch(MapReportActions.setManualWait(manualWait))
})

const MapReportsDownloaderComponent = wrapComponentWithProvider(reduxStore, MapReportsDownloader, mapStateToProps, mapDispatchToProps)
export default MapReportsDownloaderComponent
