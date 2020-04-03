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
      <MapReportsListMapObjects />
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
      <button className='btn btn-sm btn-block btn-primary mt-2' onClick={() => this.doDownloadReport()}>
        <i className='fa fa-download mr-2' />Generate and Download report
      </button>
    </div>
  }

  doDownloadReport () {
    const pageDefinitions = this.props.reportPages.map(reportPage => {
      const pageDefinition = JSON.parse(JSON.stringify(reportPage))
      pageDefinition.planId = this.props.planId
      // From maplayers, get the layers that we want to display in the report
      pageDefinition.visibleLayers = this.props.mapLayers.location.filter(layer => layer.checked).map(layer => layer.key).toJS();
      ['boundaries', 'cables', 'conduits', 'equipments', 'roads'].forEach(networkEquipmentCategory => {
        const category = this.props.mapLayers.networkEquipment[networkEquipmentCategory]
        if (category) {
          Object.keys(category).forEach(categoryKey => {
            if (category[categoryKey].checked) {
              pageDefinition.visibleLayers.push(category[categoryKey].key)
            }
          })
        }
      })
      return pageDefinition
    })
    this.props.downloadReport(this.props.planId, pageDefinitions)
  }

  componentWillUnmount () {
    this.props.clearMapReports()
  }
}

MapReportsDownloader.propTypes = {
  planId: PropTypes.number,
  mapLayers: PropTypes.object,
  isCommunicating: PropTypes.bool,
  reportPages: PropTypes.array,
  editingPageUuid: PropTypes.string
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  mapLayers: state.mapLayers,
  isCommunicating: state.mapReports.isCommunicating,
  reportPages: state.mapReports.pages,
  editingPageUuid: state.mapReports.editingPageUuid
})

const mapDispatchToProps = dispatch => ({
  downloadReport: (planId, pageDefinitions) => dispatch(MapReportActions.downloadReport(planId, pageDefinitions)),
  clearMapReports: () => dispatch(MapReportActions.clearMapReports())
})

const MapReportsDownloaderComponent = wrapComponentWithProvider(reduxStore, MapReportsDownloader, mapStateToProps, mapDispatchToProps)
export default MapReportsDownloaderComponent
