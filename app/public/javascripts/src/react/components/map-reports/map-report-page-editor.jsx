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
      <MapReportPage initialValues={this.props.reportPages.filter(page => page.uuid === this.props.editingPageUuid)[0]} />
      <button className='btn btn-sm btn-primary float-right' onClick={() => this.savePageDefinition()}>
        <i className='fa fa-save' />Save
      </button>
    </div>
  }

  savePageDefinition () {
    const editingPageIndex = this.props.reportPages.findIndex(page => page.uuid === this.props.editingPageUuid)
    const editingPage = this.props.reportPages[editingPageIndex]
    const oldPageDefinition = JSON.parse(JSON.stringify(editingPage))
    const newPageDefinition = this.props.pageDefinition
    const pageDefinition = Object.assign(oldPageDefinition, newPageDefinition)
    const reportPages = [].concat(this.props.reportPages)
    reportPages.splice(editingPageIndex, 1, pageDefinition)
    this.props.setPages(this.props.planId, reportPages)
    this.props.setEditingPageUuid(null)
  }
}

MapReportPageEditor.propTypes = {
  planId: PropTypes.number,
  reportPages: PropTypes.array,
  pageDefinition: PropTypes.object,
  googleMaps: PropTypes.object,
  editingPageUuid: PropTypes.string
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  reportPages: state.mapReports.pages,
  pageDefinition: pageDefinitionSelector(state, 'title', 'paperSize', 'worldLengthPerMeterOfPaper', 'dpi', 'orientation'),
  googleMaps: state.map.googleMaps,
  editingPageUuid: state.mapReports.editingPageUuid
})

const mapDispatchToProps = dispatch => ({
  setPages: (planId, pageDefinitions) => dispatch(MapReportActions.setPages(planId, pageDefinitions)),
  setEditingPageUuid: uuid => dispatch(MapReportActions.setEditingPageUuid(uuid))
})

const MapReportPageEditorComponent = wrapComponentWithProvider(reduxStore, MapReportPageEditor, mapStateToProps, mapDispatchToProps)
export default MapReportPageEditorComponent
