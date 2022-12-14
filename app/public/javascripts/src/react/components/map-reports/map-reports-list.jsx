import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import uuidv4 from 'uuid/v4'
import MapReportActions from './map-reports-actions'
import ScalingFactors from './scaling-factors'
import Orientations from './orientations'
import { REPORT_LAT_LONG_PRECISION } from './constants'
import './map-reports-list.css'

export class MapReportsList extends Component {
  constructor (props) {
    super(props)
    this.handleRemovePageClicked = this.handleRemovePageClicked.bind(this)
    this.handleAddPageClicked = this.handleAddPageClicked.bind(this)
    this.handleEditPageClicked = this.handleEditPageClicked.bind(this)
  }
  render () {
    return <div>
      <ul className='list-group'>
        {
          this.props.reportPages.map((reportPage, index) => (
            <li
              className={'p-1 list-group-item' + ((this.props.activePageUuid === reportPage.uuid) ? ' active' : '')}
              key={index}
              style={{ cursor: 'pointer', lineHeight: '28px' }}
              onClick={() => this.props.setActivePageUuid(reportPage.uuid)}
            >
              <div className='d-flex'>
                <strong className='flex-grow-1'>{reportPage.title}</strong>
                <div className='flex-grow-0'>
                  <button className='btn btn-sm btn-light'
                    onClick={event => this.handleEditPageClicked(event, reportPage.uuid)}
                  >
                    <i className='fa fa-edit'/>
                  </button>
                  <button className='btn btn-sm btn-danger'
                    onClick={event => this.handleRemovePageClicked(event, reportPage.uuid)}
                  >
                    <i className='fa fa-trash-alt'/>
                  </button>
                </div>
              </div>
              <div style={{ lineHeight: '20px' }}>
                <span className='badge badge-light mr-1 map-reports-badge text-black-50'>{reportPage.paperSize}</span>
                <span className='badge badge-light mr-1 map-reports-badge text-black-50'>{ScalingFactors[reportPage.worldLengthPerMeterOfPaper] || ScalingFactors.default}</span>
                <span className='badge badge-light mr-1 map-reports-badge text-black-50'>{reportPage.dpi} dpi</span>
                <span className='badge badge-light mr-1 map-reports-badge text-black-50'>{Orientations[reportPage.orientation]}</span>
                <span className='badge badge-light mr-1 map-reports-badge text-black-50'><i className='fas fa-map-marker-alt mr-1' />{reportPage.mapCenter.latitude}, {reportPage.mapCenter.longitude} </span>
              </div>
            </li>
          ))
        }
      </ul>
      <button
        className='btn btn-sm btn-light mt-2'
        onClick={this.handleAddPageClicked}
      >
        <i className='fa fa-plus mr-2' />Add Page
      </button>
    </div>
  }

  handleRemovePageClicked (event, uuid) {
    const indexToRemove = this.props.reportPages.findIndex(reportPage => reportPage.uuid === uuid)
    var newPages = [].concat(this.props.reportPages)
    newPages.splice(indexToRemove, 1)
    this.props.setPages(this.props.planId, newPages)
    event.stopPropagation()
  }

  handleAddPageClicked () {
    const mapCenter = this.props.googleMaps.getCenter()
    var newPage = { // Don't set a UUID, aro-service will do that for us
      title: 'New Page',
      paperSize: 'A4',
      worldLengthPerMeterOfPaper: 100000,
      dpi: 72,
      orientation: 'portrait',
      mapCenter: {
        latitude: Math.round(mapCenter.lat() * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION,
        longitude: Math.round(mapCenter.lng() * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION
      }
    }
    this.props.setPages(this.props.planId, this.props.reportPages.concat(newPage))
  }

  handleEditPageClicked (event, index) {
    this.props.setEditingPageUuid(index)
    event.stopPropagation()
  }
}

MapReportsList.propTypes = {
  planId: PropTypes.number,
  activePageUuid: PropTypes.string,
  googleMaps: PropTypes.object,
  reportPages: PropTypes.array
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  activePageUuid: state.mapReports.activePageUuid,
  googleMaps: state.map.googleMaps,
  reportPages: state.mapReports.pages
})

const mapDispatchToProps = dispatch => ({
  setPages: (planId, pageDefinitions) => dispatch(MapReportActions.setPages(planId, pageDefinitions)),
  setActivePageUuid: uuid => dispatch(MapReportActions.setActivePageUuid(uuid)),
  setEditingPageUuid: uuid => dispatch(MapReportActions.setEditingPageUuid(uuid))
})

const MapReportsDownloaderComponent = connect(mapStateToProps, mapDispatchToProps)(MapReportsList)
export default MapReportsDownloaderComponent
