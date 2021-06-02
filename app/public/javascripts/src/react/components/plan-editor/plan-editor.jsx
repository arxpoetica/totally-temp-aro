import React, { useEffect } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import BoundaryDrawCreator from './boundary-draw-creator.jsx'

export const PlanEditor = props => {

  const {
    planId,
    userId,
  	transactionId,
  	isCommittingTransaction,
    resumeOrCreateTransaction,
  	commitTransaction,
  	discardTransaction,
    isDrawingBoundaryFor,
  } = props

  useEffect(() => {
    resumeOrCreateTransaction(planId, userId)
  }, [])


  function checkAndCommitTransaction() {
    if (isCommittingTransaction) {
      return
    }
    commitTransaction(transactionId)
  }

  return (
    <div>
      <div className='text-center'>
        <div className='btn-group '>
          {/* A button to commit the transaction */}
          <button
            className='btn btn-light'
            onClick={() => checkAndCommitTransaction()}
            disabled={isCommittingTransaction}
          >
            <i className='fa fa-check-circle' />&nbsp;&nbsp;Commit
          </button>

          {/* A button to discard the transaction */}
          <button
            className='btn btn-light'
            onClick={() => discardTransaction(transactionId)}
          >
            <i className='fa fa-times-circle' />&nbsp;&nbsp;Discard
          </button>
        </div>
        <EquipmentDragger />
      </div>
      <EquipmentMapObjects />
      <EquipmentBoundaryMapObjects />
      { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
      { isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }
    </div>
  )

}

PlanEditor.propTypes = {
  planId: PropTypes.number,
  userId: PropTypes.number,
  transactionId: PropTypes.number,
  isDrawingBoundaryFor: PropTypes.string
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  userId: state.user.loggedInUser.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  isCommittingTransaction: state.planEditor.isCommittingTransaction,
  isDrawingBoundaryFor: state.planEditor.isDrawingBoundaryFor,
})

const mapDispatchToProps = dispatch => ({
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
