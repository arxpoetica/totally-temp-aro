import React, { useEffect } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorHeader from './plan-editor-header.jsx'
import PlanEditorRecalculate from './plan-editor-recalculate.jsx'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import FiberMapObjects  from './fiber-map-objects.jsx'
import AlertsPanel from './alerts-panel.jsx'
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
    features,
    selectedEditFeatureIds,
    subnets,
    selectedSubnetId,
    addSubnets,
    setSelectedSubnetId,
    deselectEditFeatureById,
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

  function onSelectedClick(event, objectId) {
    if (objectId === selectedSubnetId) objectId = '' // deselect
    // ToDo: this check does not belong here
    //  the action should try to request the subnet and if fail, set sub net to null
    if (!features[objectId] 
      || (
        features[objectId].feature.networkNodeType !== 'central_office'
        && features[objectId].feature.networkNodeType !== 'fiber_distribution_hub'
    )) objectId = '' // deselect
    setSelectedSubnetId(objectId)
  }

  function onSelectedClose(event, objectId) {
    if (objectId === selectedSubnetId) setSelectedSubnetId('')
    deselectEditFeatureById(objectId)
  }

  return (
    <div className="aro-plan-editor" style={{paddingRight: '10px'}}>
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
      <FiberMapObjects />
      { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
      { isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }

      <AlertsPanel />
      <PlanEditorRecalculate />

      {selectedEditFeatureIds.map(id => <PlanEditorHeader
          key={id}
          selectedFeatureId={id}
          onClick={ (event, objectId) => onSelectedClick(event, objectId)}
          onClose={ (event, objectId) => onSelectedClose(event, objectId)}
          isSelected={id === selectedSubnetId}
        />
      )}

      {false &&
        <div className="temporary" style={{ margin: '0 0 25px' }}>
          <h2>Plan Information</h2>
          <p>userId: {userId}</p>
          <p>planId: {planId}</p>
          <p>transactionId: {transactionId}</p>
          <p>selectedSubnetId: {selectedSubnetId}</p>
          <p>subnets: {JSON.stringify(Object.keys(subnets), null, '  ')}</p>
          {/* <pre>features: {JSON.stringify(features, null, '  ')}</pre> */}
          <pre>selectedEditFeatureIds: {JSON.stringify(selectedEditFeatureIds, null, '  ')}</pre>
        </div>
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
  selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
  subnets: state.planEditor.subnets,
  selectedSubnetId: state.planEditor.selectedSubnetId,
})

const mapDispatchToProps = dispatch => ({
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
  addSubnets: subnetIds => dispatch(PlanEditorActions.addSubnets(subnetIds)),
  setSelectedSubnetId: subnetId => dispatch(PlanEditorActions.setSelectedSubnetId(subnetId)),
  deselectEditFeatureById: objectId => dispatch(PlanEditorActions.deselectEditFeatureById(objectId)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
