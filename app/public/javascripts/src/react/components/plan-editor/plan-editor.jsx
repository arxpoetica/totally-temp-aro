import React, { useEffect } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorThumbs from './plan-editor-thumbs.jsx'
import PlanEditorRecalculate from './plan-editor-recalculate.jsx'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import FiberMapObjects  from './fiber-map-objects.jsx'
import AlertsPanel from './alerts-panel.jsx'
import { AlertsPanelTooltip } from './alerts-panel-tooltip.jsx'
import BoundaryDrawCreator from './boundary-draw-creator.jsx'
import AroFeatureEditor from '../common/editor-interface/aro-feature-editor.jsx'
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
    equipments,
    updateFeatureProperties,
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

  function onFeatureFormChange (newValObj, propVal, path, event) {
    //console.log({propVal, path, newValObj, event})
  }
  
  function onFeatureFormSave (newValObj, objectId) {
    let feature = features[objectId].feature
    let updatedFeature = { ...feature, 
      networkNodeEquipment: newValObj,
    }
    updateFeatureProperties(updatedFeature)
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
      <AlertsPanelTooltip />
      <PlanEditorRecalculate />
      <PlanEditorThumbs />

      {selectedEditFeatureIds.map(id =>
        <AroFeatureEditor key={id}
          altTitle={equipments[features[id].feature.networkNodeType].label}
          isEditable={true}
          feature={features[id].feature}
          onChange={onFeatureFormChange}
          onSave={newValObj => onFeatureFormSave(newValObj, id)}
        ></AroFeatureEditor>
      )}

      {false &&
        <div className="temporary" style={{ margin: '0 0 25px' }}>
          <h2>Plan Information</h2>
          <p>userId: {userId}</p>
          <p>planId: {planId}</p>
          <p>transactionId: {transactionId}</p>
          <p>selectedSubnetId: {selectedSubnetId}</p>
          {Object.keys(subnets).length && <>
            <br/>
            <h2>Subnet Information</h2>
            {Object.keys(subnets).map(id => <p key={id}>subnet id: {id}</p>)}
          </>}
          <br/>
          <h2>Features Information</h2>
          <pre>selectedEditFeatureIds: {JSON.stringify(selectedEditFeatureIds, null, '  ')}</pre>
        </div>
      }
    </div>
  )

}

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
  equipments: state.mapLayers.networkEquipment.equipments,
})

const mapDispatchToProps = dispatch => ({
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  commitTransaction: transactionId => dispatch(PlanEditorActions.commitTransaction(transactionId)),
  discardTransaction: transactionId => dispatch(PlanEditorActions.discardTransaction(transactionId)),
  updateFeatureProperties: feature => dispatch(PlanEditorActions.updateFeatureProperties(feature)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
