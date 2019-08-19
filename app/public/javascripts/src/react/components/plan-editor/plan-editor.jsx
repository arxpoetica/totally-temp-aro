import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'

export class PlanEditor extends Component {
  render () {
    return <div>
      <div className='text-center'>
        <div className='btn-group '>
          {/* A button to commit the transaction */}
          <button
            className='btn btn-light'
            onClick={() => this.props.commitTransaction(this.props.transactionId)}
          >
            <i className='fa fa-check-circle' />&nbsp;&nbsp;Commit
          </button>

          {/* A button to discard the transaction */}
          <button
            className='btn btn-light'
            onClick={() => this.props.discardTransaction(this.props.transactionId)}
          >
            <i className='fa fa-times-circle' />&nbsp;&nbsp;Discard
          </button>
        </div>
      </div>
    </div>
  }

  componentWillMount () {
    this.props.resumeOrCreateTransaction(this.props.planId, this.props.userId)
  }
}

PlanEditor.propTypes = {
  planId: PropTypes.number,
  userId: PropTypes.number,
  transactionId: PropTypes.number
}

const mapStateToProps = state => {
  return {
    planId: state.plan.activePlan.id,
    userId: state.user.loggedInUser.id,
    transactionId: state.planEditor.transaction && state.planEditor.transaction.id
  }
}

const mapDispatchToProps = dispatch => ({
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId))
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
