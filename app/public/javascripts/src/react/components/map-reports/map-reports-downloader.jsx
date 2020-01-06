import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import MapReportActions from './map-reports-actions'

export class MapReportsDownloader extends Component {
  render () {
    return <div>
      <h3>Map Reports</h3>
      <button className='btn btn-primary' onClick={() => this.props.downloadReport(this.props.planId)}>
        <i className='fa fa-download' />Download
      </button>
    </div>
  }
}

MapReportsDownloader.propTypes = {
  planId: PropTypes.number
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id
})

const mapDispatchToProps = dispatch => ({
  downloadReport: planId => dispatch(MapReportActions.downloadReport(planId))
})

const MapReportsDownloaderComponent = wrapComponentWithProvider(reduxStore, MapReportsDownloader, mapStateToProps, mapDispatchToProps)
export default MapReportsDownloaderComponent
