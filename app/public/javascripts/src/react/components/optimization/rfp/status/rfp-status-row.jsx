import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import ReportDefinitionPropType from './report-definition-prop-type'
import RfpReportDownloadCell from './rfp-report-download-cell.jsx'
import PlanActions from '../../../plan/plan-actions'
import FullScreenActions from '../../../full-screen/full-screen-actions'

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
      <td className='text-left pl-5'>
        <a
          href='#'
          onClick={() => this.onClickLoadPlan()}
        >
          {this.props.name}
        </a>
      </td>
      <td>{createdByName}</td>
      <td>
        <div className={`badge ${planStateToBadgeColor[this.props.status]}`}>{this.props.status}</div>
      </td>
      <td>
        <RfpReportDownloadCell
          planId={this.props.planId}
          userId={this.props.userId}
          projectId={this.props.projectId}
          reportDefinitions={this.props.reportDefinitions}
        />
      </td>
    </tr>
  }

  onClickLoadPlan () {
    this.props.loadPlan(this.props.planId)
    this.props.hideFullScreenContainer()
  }
}

RfpStatusRow.propTypes = {
  planId: PropTypes.number,
  name: PropTypes.string,
  createdById: PropTypes.number,
  status: PropTypes.string,
  systemActors: PropTypes.object,
  reportDefinitions: ReportDefinitionPropType,
  userId: PropTypes.number,
  projectId: PropTypes.number
}

const mapStateToProps = state => ({
  systemActors: state.user.systemActors,
  userId: state.user.loggedInUser && state.user.loggedInUser.id,
  projectId: state.user.loggedInUser.projectId
})

const mapDispatchToProps = dispatch => ({
  loadPlan: (planId) => dispatch(PlanActions.loadPlan(planId)),
  hideFullScreenContainer: () => dispatch(FullScreenActions.showOrHideFullScreenContainer(false))
})

const RfpStatusRowComponent = connect(mapStateToProps, mapDispatchToProps)(RfpStatusRow)
export default RfpStatusRowComponent
