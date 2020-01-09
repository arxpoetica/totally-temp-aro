import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import MapReportActions from './map-reports-actions'

export class MapReportsDownloader extends Component {
  render () {
    return <div>
      <h3>Map Reports</h3>
      <button className='btn btn-primary' onClick={() => this.doDownloadReport()}>
        <i className='fa fa-download' />Download
      </button>
    </div>
  }

  doDownloadReport () {
    // From maplayers, get the layers that we want to display in the report
    var visibleLayers = this.props.mapLayers.location.filter(layer => layer.checked).map(layer => layer.key).toJS();
    ['boundaries', 'cables', 'conduits', 'equipments', 'roads'].forEach(networkEquipmentCategory => {
      const category = this.props.mapLayers.networkEquipment[networkEquipmentCategory]
      Object.keys(category).forEach(categoryKey => {
        if (category[categoryKey].checked) {
          visibleLayers.push(category[categoryKey].key)
        }
      })
    })
    this.props.downloadReport(this.props.planId, visibleLayers)
  }

  componentWillUnmount () {
    this.props.clearMapReports()
  }
}

MapReportsDownloader.propTypes = {
  planId: PropTypes.number,
  mapLayers: PropTypes.object
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  mapLayers: state.mapLayers
})

const mapDispatchToProps = dispatch => ({
  downloadReport: (planId, visibleLayers) => dispatch(MapReportActions.downloadReport(planId, visibleLayers)),
  clearMapReports: () => dispatch(MapReportActions.clearMapReports())
})

const MapReportsDownloaderComponent = wrapComponentWithProvider(reduxStore, MapReportsDownloader, mapStateToProps, mapDispatchToProps)
export default MapReportsDownloaderComponent
