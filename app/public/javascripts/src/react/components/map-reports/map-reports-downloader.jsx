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
      <h3>Map Reports</h3>
        <MapReportsListMapObjects />
        {
          this.props.editingPageIndex >= 0
          ? <MapReportPageEditor />
          : <div>
            <MapReportsList />
            <button className='btn btn-block btn-primary mt-2' onClick={() => this.doDownloadReport()}>
              <i className='fa fa-download' />Generate and Download report
            </button>
          </div>
        }
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
  reportPages: PropTypes.array,
  editingPageIndex: PropTypes.number
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  mapLayers: state.mapLayers,
  reportPages: state.mapReports.pages,
  editingPageIndex: state.mapReports.editingPageIndex
})

const mapDispatchToProps = dispatch => ({
  downloadReport: (planId, pageDefinitions) => dispatch(MapReportActions.downloadReport(planId, pageDefinitions)),
  clearMapReports: () => dispatch(MapReportActions.clearMapReports())
})

const MapReportsDownloaderComponent = wrapComponentWithProvider(reduxStore, MapReportsDownloader, mapStateToProps, mapDispatchToProps)
export default MapReportsDownloaderComponent
