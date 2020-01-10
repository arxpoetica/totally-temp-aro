import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { formValueSelector } from 'redux-form'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import MapReportActions from './map-reports-actions'
import MapReportPage from './map-report-page.jsx'
import Constants from '../../common/constants'
const pageDefinitionSelector = formValueSelector(Constants.MAP_REPORTS_PAGE_FORM)


export class MapReportPageEditor extends Component {
  render () {
    return <div style={{ overflow: 'auto' }}>
      <MapReportPage initialValues={this.props.reportPages[0]} />
      <button className='btn btn-primary float-right' onClick={() => this.savePageDefinition()}>
        <i className='fa fa-save' />Save
      </button>
    </div>
  }

  savePageDefinition () {
    var pageDefinition = JSON.parse(JSON.stringify(this.props.pageDefinition))
    const mapCenter = this.props.googleMaps.getCenter()
    pageDefinition.mapCenter = {
      latitude: mapCenter.lat(),
      longitude: mapCenter.lng()
    }
    this.props.savePageDefinition(0, pageDefinition)
  }
}

MapReportPageEditor.propTypes = {
  reportPages: PropTypes.array,
  pageDefinition: PropTypes.object,
  googleMaps: PropTypes.object
}

const mapStateToProps = state => ({
  reportPages: state.mapReports.pages,
  pageDefinition: pageDefinitionSelector(state, 'paperSize', 'worldLengthPerMeterOfPaper', 'dpi', 'orientation'),
  googleMaps: state.map.googleMaps
})

const mapDispatchToProps = dispatch => ({
  savePageDefinition: (index, pageDefinition) => dispatch(MapReportActions.savePageDefinition(index, pageDefinition))
})

const MapReportPageEditorComponent = wrapComponentWithProvider(reduxStore, MapReportPageEditor, mapStateToProps, mapDispatchToProps)
export default MapReportPageEditorComponent
