import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import BoundaryDrawCreator from './boundary-draw-creator.jsx'

export class PlanEditor extends Component {
  render () {
    return <div>
      <div className='text-center'>
        <div className='btn-group '>
          {/* A button to commit the transaction */}
          <button
            className='btn btn-light'
            onClick={() => this.checkAndCommitTransaction()}
            disabled={this.props.isCommittingTransaction}
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
        <EquipmentDragger />
      </div>
      <EquipmentMapObjects />
      <EquipmentBoundaryMapObjects />
      { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
      { this.props.isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }
    </div>
  }

  componentWillMount () {
    this.props.resumeOrCreateTransaction(this.props.planId, this.props.userId)
  }

  checkAndCommitTransaction () {
    if (this.props.isCommittingTransaction) {
      return
    }
    this.props.commitTransaction(this.props.transactionId)
  }
}

PlanEditor.propTypes = {
  planId: PropTypes.number,
  userId: PropTypes.number,
  transactionId: PropTypes.number,
  isDrawingBoundaryFor: PropTypes.string
}

const mapStateToProps = state => {
  return {
    planId: state.plan.activePlan.id,
    userId: state.user.loggedInUser.id,
    transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
    isCommittingTransaction: state.planEditor.isCommittingTransaction,
    isDrawingBoundaryFor: state.planEditor.isDrawingBoundaryFor
  }
}

const mapDispatchToProps = dispatch => ({
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId))
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
