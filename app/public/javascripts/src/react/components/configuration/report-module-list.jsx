import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import { PropTypes } from 'prop-types'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from './configuration-actions'
import ReportModuleEditor from './report-module-editor.jsx'
import '../common-styles/common-styles.css'

export class ReportModuleList extends Component {
  constructor (props) {
    super(props)
    this.props.getReportsMetadata()
  }

  render () {
    return this.props.reportBeingEdited
      ? <ReportModuleEditor id='comReportDefinitionEditor' />
      : this.renderReportsList()
  }

  renderReportsList () {
    return <div id='divReportsList'>
      <table className='table table-sm table-striped'>
        <thead>
          <tr>
            <th>Report Type</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {this.props.reportsMetaData.map(reportMetaData => (
            <tr key={reportMetaData.id}>
              <td>{reportMetaData.reportType}</td>
              <td>{reportMetaData.displayName}</td>
              <td>
                <button id={`btnEditReport${reportMetaData.id}`} className='btn btn-primary' onClick={event => this.props.startEditingReport(reportMetaData.id)}>
                  <i className='fa fa-edit' /> Edit
                </button>
                <button id={`btnDeleteReport${reportMetaData.id}`} className='btn btn-danger' onClick={event => this.props.deleteReport(reportMetaData.id)}>
                  <i className='fa fa-trash-alt' /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button id='btnCreateNewReport' className='btn btn-primary float-right' onClick={() => this.props.createReport()}>
        <i className='fa fa-plus' /> Create new report
      </button>
    </div>
  }

  uploadFile () {
    const file = this.fileInput.current.files[0]
    const assetKey = file.name
    this.props.uploadAssetToServer(assetKey, file)
  }
}

ReportModuleList.propTypes = {
  reportsMetaData: PropTypes.array,
  reportBeingEdited: PropTypes.object
}

const mapStateToProps = (state) => ({
  reportsMetaData: state.configuration.reports.metaData,
  reportBeingEdited: state.configuration.reports.reportBeingEdited
})

const mapDispatchToProps = dispatch => ({
  getReportsMetadata: () => dispatch(ConfigurationActions.getReportsMetadata()),
  startEditingReport: reportId => dispatch(ConfigurationActions.startEditingReport(reportId)),
  createReport: () => dispatch(ConfigurationActions.createReport()),
  deleteReport: reportId => dispatch(ConfigurationActions.deleteReport(reportId))
})

const ReportModuleListComponent = wrapComponentWithProvider(reduxStore, ReportModuleList, mapStateToProps, mapDispatchToProps)
export default ReportModuleListComponent
