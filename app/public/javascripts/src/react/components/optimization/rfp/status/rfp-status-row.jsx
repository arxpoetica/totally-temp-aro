import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import ReportDefinitionPropType from './report-definition-prop-type'
import RfpReportDownloadCell from './rfp-report-download-cell.jsx'

export class RfpStatusRow extends Component {
  render () {
    const planStateToBadgeColor = {
      UNDEFINED: 'badge-danger',
      START_STATE: 'badge-dark',
      INITIALIZED: 'badge-dark',
      STARTED: 'badge-primary',
      COMPLETED: 'badge-success',
      CANCELED: 'badge-danger',
      FAILED: 'badge-danger'
    }
    const createdByActor = this.props.systemActors[this.props.createdById]
    const createdByName = createdByActor ? `${createdByActor.firstName} ${createdByActor.lastName}` : `UserID: ${this.props.createdById}`
    return <tr style={{ textAlign: 'center' }}>
      <td>{this.props.planId}</td>
      <td>{this.props.name}</td>
      <td>{createdByName}</td>
      <td>
        <div className={`badge ${planStateToBadgeColor[this.props.status]}`}>{this.props.status}</div>
      </td>
      <td>
        <RfpReportDownloadCell planId={this.props.planId} userId={this.props.userId} reportDefinitions={this.props.reportDefinitions} />
      </td>
    </tr>
  }
}

RfpStatusRow.propTypes = {
  planId: PropTypes.number,
  name: PropTypes.string,
  createdById: PropTypes.number,
  status: PropTypes.string,
  systemActors: PropTypes.object,
  reportDefinitions: ReportDefinitionPropType,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  systemActors: state.user.systemActors,
  userId: state.user.loggedInUser && state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
})

const RfpStatusRowComponent = connect(mapStateToProps, mapDispatchToProps)(RfpStatusRow)
export default RfpStatusRowComponent
