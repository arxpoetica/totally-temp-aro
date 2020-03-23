import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import uuidv4 from 'uuid/v4'
import MapReportActions from './map-reports-actions'
import ScalingFactors from './scaling-factors'
import Orientations from './orientations'
import { REPORT_LAT_LONG_PRECISION } from './constants'

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
              className={'list-group-item' + ((this.props.activePageUuid === reportPage.uuid) ? ' active' : '')}
              key={index}
              style={{ cursor: 'pointer', lineHeight: '28px' }}
              onClick={() => this.props.setActivePageUuid(reportPage.uuid)}
            >
              <div className='d-flex'>
                <div className='flex-grow-1'>{reportPage.title}</div>
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
              <div>
                <span className='badge badge-light mr-2'>{reportPage.paperSize}</span>
                <span className='badge badge-light mr-2'>{ScalingFactors[reportPage.worldLengthPerMeterOfPaper] || ScalingFactors.default}</span>
                <span className='badge badge-light mr-2'>{reportPage.dpi} dpi</span>
                <span className='badge badge-light mr-2'>{Orientations[reportPage.orientation]}</span>
                <span className='badge badge-light mr-2'>Center: {reportPage.mapCenter.latitude}, {reportPage.mapCenter.longitude} </span>
              </div>
            </li>
          ))
        }
      </ul>
      <button
        className='btn btn-light mt-2'
        onClick={this.handleAddPageClicked}
      >
        <i className='fa fa-plus mr-2' />Add Page
      </button>
    </div>
  }

  handleRemovePageClicked (event, uuid) {
    this.props.removePage(uuid)
    event.stopPropagation()
  }

  handleAddPageClicked () {
    const mapCenter = this.props.googleMaps.getCenter()
    var newPage = {
      uuid: uuidv4(),
      title: 'Page 1',
      paperSize: 'A4',
      worldLengthPerMeterOfPaper: 100000,
      dpi: 72,
      orientation: 'portrait',
      mapCenter: {
        latitude: Math.round(mapCenter.lat() * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION,
        longitude: Math.round(mapCenter.lng() * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION
      }
    }
    newPage.title = 'New Page'
    this.props.addPage(newPage)
  }

  handleEditPageClicked (event, index) {
    this.props.setEditingPageUuid(index)
    event.stopPropagation()
  }
}

MapReportsList.propTypes = {
  activePageUuid: PropTypes.string,
  googleMaps: PropTypes.object,
  reportPages: PropTypes.array
}

const mapStateToProps = state => ({
  activePageUuid: state.mapReports.activePageUuid,
  googleMaps: state.map.googleMaps,
  reportPages: state.mapReports.pages
})

const mapDispatchToProps = dispatch => ({
  addPage: pageDefinition => dispatch(MapReportActions.addPage(pageDefinition)),
  removePage: uuid => dispatch(MapReportActions.removePage(uuid)),
  setActivePageUuid: uuid => dispatch(MapReportActions.setActivePageUuid(uuid)),
  setEditingPageUuid: uuid => dispatch(MapReportActions.setEditingPageUuid(uuid))
})

const MapReportsDownloaderComponent = connect(mapStateToProps, mapDispatchToProps)(MapReportsList)
export default MapReportsDownloaderComponent
