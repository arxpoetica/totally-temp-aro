import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import MapReportActions from './map-reports-actions'
import ScalingFactors from './scaling-factors'
import Orientations from './orientations'
export class MapReportsList extends Component {
  constructor (props) {
    super(props)
    this.handleRemovePageClicked = this.handleRemovePageClicked.bind(this)
    this.handleAddPageClicked = this.handleAddPageClicked.bind(this)
  }
  render () {
    return <div>
      <ul className='list-group'>
        {
          this.props.reportPages.map((reportPage, index) => (
            <li
              className={'list-group-item' + ((this.props.activePageIndex === index) ? ' active' : '')}
              key={index}
              style={{ cursor: 'pointer', lineHeight: '28px' }}
              onClick={() => this.props.setActivePageIndex(index)}
            >
              <div className='d-flex'>
                <div className='flex-grow-1'>{reportPage.title}</div>
                <div className='flex-grow-0'>
                  <button className='btn btn-sm btn-danger'
                    onClick={event => this.handleRemovePageClicked(event, index)}
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
        className='btn btn-light'
        onClick={this.handleAddPageClicked}
      >
        Add
      </button>
    </div>
  }

  handleRemovePageClicked (event, index) {
    this.props.removePage(index)
    event.stopPropagation()
  }

  handleAddPageClicked () {
    var newPage = JSON.parse(JSON.stringify(this.props.reportPages[0]))
    newPage.title = 'New Page'
    this.props.addPage(newPage)
  }
}

MapReportsList.propTypes = {
  activePageIndex: PropTypes.number,
  reportPages: PropTypes.array
}

const mapStateToProps = state => ({
  activePageIndex: state.mapReports.activePageIndex,
  reportPages: state.mapReports.pages
})

const mapDispatchToProps = dispatch => ({
  addPage: pageDefinition => dispatch(MapReportActions.addPage(pageDefinition)),
  removePage: index => dispatch(MapReportActions.removePage(index)),
  setActivePageIndex: index => dispatch(MapReportActions.setActivePageIndex(index))
})

const MapReportsDownloaderComponent = connect(mapStateToProps, mapDispatchToProps)(MapReportsList)
export default MapReportsDownloaderComponent
