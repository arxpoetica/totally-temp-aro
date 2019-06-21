import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import rfpActions from './rfp-actions'

class RfpReportDownloadCell extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedReportTypeId: this.props.reportDefinitions[0].reportData.id
    }
  }

  render () {
    const selectedReport = this.props.reportDefinitions.filter(report => report.reportData.id === this.state.selectedReportTypeId)[0]
    return <div className='d-flex'>
      <select
        className='form-control'
        style={{ marginTop: '1px' }}
        value={this.state.selectedReportTypeId}
        onChange={event => this.setState({ selectedReportTypeId: +event.target.value })}>
        {this.props.reportDefinitions.map(reportDefinition => (
          <option
            key={reportDefinition.reportData.id}
            value={reportDefinition.reportData.id}>
            {reportDefinition.reportData.displayName}
          </option>
        ))}
      </select>
      <div className='btn btn-group p-0'>
        {
          selectedReport.reportData.media_types.map(mediaType => {
            // "(new Date()).toISOString().split('T')[0]" will give "YYYY-MM-DD"
            // Note that we are doing (new Date(Date.now())) so that we can have deterministic tests (by replacing the Date.now() function when testing)
            const downloadFileName = `${(new Date(Date.now())).toISOString().split('T')[0]}_${selectedReport.reportData.name}.${mediaType}`
            const downloadUrl = selectedReport.href
              .replace('{planId}', this.props.planId)
              .replace('{mediaType}', mediaType)
              .replace('{userId}', this.props.userId)
            return <a
              key={mediaType}
              className='btn btn-light'
              style={{ whiteSpace: 'nowrap' }}
              href={`/service-download-file/${downloadFileName}${downloadUrl}`}
              download>
              <i className='fa fa-download' /> {mediaType}
            </a>
          })
        }
      </div>
    </div>
  }
}

RfpReportDownloadCell.propTypes = {
  planId: PropTypes.number,
  reportDefinitions: PropTypes.arrayOf(PropTypes.shape({
    reportData: PropTypes.shape({
      id: PropTypes.number,
      reportType: PropTypes.string,
      name: PropTypes.string,
      displayName: PropTypes.string,
      media_types: PropTypes.arrayOf(PropTypes.string)
    }),
    href: PropTypes.string
  })),
  userId: PropTypes.number
}

class RfpStatusRow extends Component {
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
  reportDefinitions: PropTypes.arrayOf(PropTypes.shape({
    reportData: PropTypes.shape({
      id: PropTypes.number,
      reportType: PropTypes.string,
      name: PropTypes.string,
      displayName: PropTypes.string,
      media_types: PropTypes.arrayOf(PropTypes.string)
    }),
    href: PropTypes.string
  })),
  userId: PropTypes.number
}

export class RfpStatus extends Component {
  render () {
    return <div className='container pt-5'>
      <h2>RFP Plan Status</h2>
      <div className='row'>
        <div className='col-md-12'>
          <table className='table table-sm table-striped'>
            <thead className='thead-light'>
              <tr style={{ textAlign: 'center' }}>
                <th>ID</th>
                <th>Name</th>
                <th>Created by</th>
                <th>Status</th>
                <th style={{ width: '400px' }}>Reports</th>
              </tr>
            </thead>
            <tbody>
              {
                this.props.isLoadingRfpPlans
                  ? this.renderLoadingIconRow()
                  : this.renderRfpPlanRows()
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  }

  renderLoadingIconRow () {
    return <tr>
      <td colSpan={5} className='p-5 text-center'>
        <div className='fa fa-5x fa-spin fa-spinner mb-4' />
        <h4>Loading RFP Plans...</h4>
      </td>
    </tr>
  }

  renderRfpPlanRows () {
    return this.props.rfpPlans.map(rfpPlan => (
      <RfpStatusRow
        key={rfpPlan.id}
        planId={rfpPlan.id}
        name={rfpPlan.name}
        createdById={rfpPlan.createdBy}
        status={rfpPlan.planState}
        systemActors={this.props.systemActors}
        reportDefinitions={this.props.rfpReportDefinitions}
        userId={this.props.userId}
      />
    ))
  }

  componentDidMount () {
    this.props.loadRfpPlans(this.props.userId)
  }

  componentWillUnmount () {
    this.props.clearRfpPlans()
  }
}

RfpStatus.propTypes = {
  rfpPlans: PropTypes.array,
  rfpReportDefinitions: PropTypes.arrayOf(PropTypes.shape({
    reportData: PropTypes.shape({
      id: PropTypes.number,
      reportType: PropTypes.string,
      name: PropTypes.string,
      displayName: PropTypes.string,
      media_types: PropTypes.arrayOf(PropTypes.string)
    }),
    href: PropTypes.string
  })),
  isLoadingRfpPlans: PropTypes.bool,
  systemActors: PropTypes.object,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  rfpPlans: state.optimization.rfp.rfpPlans,
  rfpReportDefinitions: state.optimization.rfp.rfpReportDefinitions,
  isLoadingRfpPlans: state.optimization.rfp.isLoadingRfpPlans,
  systemActors: state.user.systemActors,
  userId: state.user.loggedInUser && state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  clearRfpPlans: () => dispatch(rfpActions.clearRfpPlans()),
  loadRfpPlans: userId => dispatch(rfpActions.loadRfpPlans(userId))
})

const RfpStatusComponent = wrapComponentWithProvider(reduxStore, RfpStatus, mapStateToProps, mapDispatchToProps)
export default RfpStatusComponent
