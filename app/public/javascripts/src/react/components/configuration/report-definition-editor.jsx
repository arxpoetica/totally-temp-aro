import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import ConfigurationActions from './configuration-actions'

export class ReportDefinitionEditor extends Component {
  constructor (props) {
    super(props)
    this.props.populateEditingReportDefinition(this.props.reportId)
  }

  render () {
    return <div>
      <table className='table table-sm table-striped'>
        <tbody>
          <tr>
            <td>Report Type</td>
            <td>{this.props.reportDefinition && this.props.reportDefinition.reportType}</td>
          </tr>
        </tbody>
      </table>
    </div>
  }
}

ReportDefinitionEditor.propTypes = {
  reportId: PropTypes.number,
  reportDefinition: PropTypes.object
}

const mapStateToProps = (state) => ({
  reportId: state.configuration.reports.reportBeingEdited && state.configuration.reports.reportBeingEdited.id,
  reportDefinition: state.configuration.reports.reportBeingEdited && state.configuration.reports.reportBeingEdited.definition
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  populateEditingReportDefinition: reportId => dispatch(ConfigurationActions.populateEditingReportDefinition(reportId))
})

const ReportDefinitionEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ReportDefinitionEditor)
export default ReportDefinitionEditorComponent
