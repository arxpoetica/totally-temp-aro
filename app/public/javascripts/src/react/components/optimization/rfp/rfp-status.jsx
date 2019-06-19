import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import rfpActions from './rfp-actions'

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
    return <tr style={{ textAlign: 'center' }}>
      <td>{this.props.id}</td>
      <td>{this.props.name}</td>
      <td>{this.props.createdBy}</td>
      <td>
        <div className={`badge ${planStateToBadgeColor[this.props.status]}`}>{this.props.status}</div>
      </td>
      <td>
        <button className='btn btn-sm btn-primary'>
          <i className='fa fa-download' />
        </button>
      </td>
      <td>
        <button className='btn btn-sm btn-primary'>
          <i className='fa fa-download' />
        </button>
      </td>
    </tr>
  }
}

RfpStatusRow.propTypes = {
  id: PropTypes.number,
  name: PropTypes.string,
  createdBy: PropTypes.string,
  status: PropTypes.string
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
                <th>RFP Report</th>
                <th>Coverage Report</th>
              </tr>
            </thead>
            <tbody>
              {this.props.rfpPlans.map(rfpPlan => (
                <RfpStatusRow key={rfpPlan.id} id={rfpPlan.id} name={rfpPlan.name} createdBy={rfpPlan.createdBy.toString()} status={rfpPlan.planState} />
              ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  rfpPlans: state.optimization.rfp.rfpPlans,
  userId: state.user.loggedInUser && state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  clearRfpPlans: () => dispatch(rfpActions.clearRfpPlans()),
  loadRfpPlans: userId => dispatch(rfpActions.loadRfpPlans(userId))
})

const RfpStatusComponent = wrapComponentWithProvider(reduxStore, RfpStatus, mapStateToProps, mapDispatchToProps)
export default RfpStatusComponent
