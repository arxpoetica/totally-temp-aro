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
import AroFeatureFactory from '../../../service-typegen/dist/AroFeatureFactory'
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
    selectedFeatureIds,
  } = props

  //state = 

  useEffect(() => {
    resumeOrCreateTransaction(planId, userId)
  }, [])

  /*
  function componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.userID !== prevProps.userID) {
      this.fetchData(this.props.userID);
    }
  }
  */

  function checkAndCommitTransaction() {
    if (isCommittingTransaction) {
      return
    }
    commitTransaction(transactionId)
  }

  function onFormChange (newValObj, propVal, path, event) {
    console.log({propVal, path, newValObj, event})
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

      <PlanEditorRecalculate/>
      <PlanEditorHeader/>
      <PlanEditorButtons/>
      {/* below will be replaced by generic object editor */}
      Selected:
      {/*
        selectedFeatureIds.map(id => {
          let aroFeature = AroFeatureFactory.createObject(features[id].feature)
          return (
            <div key={id}>
              <pre>{JSON.stringify(aroFeature, null, 2)}</pre>
              <div> ======= </div>
              <pre>{JSON.stringify(aroFeature.networkNodeEquipment.getDisplayProperties(), null, 2)}</pre>
            </div>
          )
        })
      */}
      {
        selectedFeatureIds.map(id => {
          let aroFeature = AroFeatureFactory.createObject(features[id].feature)
          let meta = aroFeature.getDisplayProperties()
          meta = meta.find(ele => ele.displayName === "Network Node Equipment") // ToDo: this needs fixing
          aroFeature = aroFeature.networkNodeEquipment
          console.log({meta, aroFeature})
          return (
            <AroFeatureEditor key={id}
              isEditable={true} 
              value={aroFeature} 
              meta={meta} 
              onChange={onFormChange}
            ></AroFeatureEditor>
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
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
