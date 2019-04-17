import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import { PropTypes } from 'prop-types'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from './configuration-actions'
import ReportDefinitionEditor from './report-definition-editor.jsx'

export class ReportDefinitionList extends Component {
  constructor (props) {
    super(props)
    this.props.getReportsMetadata()
  }

  render () {
    return this.props.reportBeingEdited
      ? <ReportDefinitionEditor id='comReportDefinitionEditor' />
      : this.renderReportsList()
  }

  renderReportsList () {
    return <div id='divReportsList'>
      <table className='table table-sm table-striped'>
        <tbody>
          {this.props.reportsMetaData.map(reportMetaData => (
            <tr key={reportMetaData.id}>
              <td>{reportMetaData.reportType}</td>
              <td>{reportMetaData.displayName}</td>
              <td>
                <button id={`btnEditReport${reportMetaData.id}`} className='btn btn-primary' onClick={event => this.props.startEditingReport(reportMetaData.id)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  }

  uploadFile () {
    const file = this.fileInput.current.files[0]
    const assetKey = file.name
    this.props.uploadAssetToServer(assetKey, file)
  }
}

ReportDefinitionList.propTypes = {
  reportsMetaData: PropTypes.array,
  reportBeingEdited: PropTypes.object
}

const mapStateToProps = (state) => ({
  reportsMetaData: state.configuration.reports.metaData,
  reportBeingEdited: state.configuration.reports.reportBeingEdited
})

const mapDispatchToProps = dispatch => ({
  getReportsMetadata: () => dispatch(ConfigurationActions.getReportsMetadata()),
  startEditingReport: reportId => dispatch(ConfigurationActions.startEditingReport(reportId))
})

const ReportDefinitionListComponent = wrapComponentWithProvider(reduxStore, ReportDefinitionList, mapStateToProps, mapDispatchToProps)
export default ReportDefinitionListComponent