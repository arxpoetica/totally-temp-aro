import React, { useEffect } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorHeader from './plan-editor-header.jsx'
import PlanEditorButtons from './plan-editor-buttons.jsx'
import PlanEditorRecalculate from './plan-editor-recalculate.jsx'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import BoundaryDrawCreator from './boundary-draw-creator.jsx'
import './plan-editor.css'

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
    selectedFeatureIds,
    setSubnets,
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
    <div className="aro-plan-editor">
      <div className="text-center mb-2">
        <div className="btn-group">
          <button
            className="btn btn-light"
            onClick={() => checkAndCommitTransaction()}
            disabled={isCommittingTransaction}
          >
            <i className="fa fa-check-circle" />&nbsp;&nbsp;Commit
          </button>
          <button
            className="btn btn-light"
            onClick={() => discardTransaction(transactionId)}
          >
            <i className="fa fa-times-circle" />&nbsp;&nbsp;Discard
          </button>
        </div>
      </div>
      <EquipmentDragger />
      <EquipmentMapObjects />
      <EquipmentBoundaryMapObjects />
      { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
      { isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }

      <PlanEditorRecalculate />
      <PlanEditorButtons />
      {
        selectedFeatureIds.map(id => {
          return (
            <div key={id}>
              <PlanEditorHeader selectedFeatureId={id} />

              {/* below will be replaced by generic object editor */}
              <p>Selected: {id}</p>
            </div>
          )
        })
      }
    </div>
  )

}
/*
PlanEditor.propTypes = {
  planId: PropTypes.number,
  userId: PropTypes.number,
  transactionId: PropTypes.number,
  isDrawingBoundaryFor: PropTypes.string
}
*/
const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  userId: state.user.loggedInUser.id,
  transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
  isCommittingTransaction: state.planEditor.isCommittingTransaction,
  isDrawingBoundaryFor: state.planEditor.isDrawingBoundaryFor,
  features: state.planEditor.features,
  //selectedFeatureIds: state.planEditor.selectedFeatureIds,
  selectedFeatureIds: state.selection.planEditorFeatures,
})

const mapDispatchToProps = dispatch => ({
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
  setSubnets: subnets => dispatch(PlanEditorActions.setSubnets(subnets)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
