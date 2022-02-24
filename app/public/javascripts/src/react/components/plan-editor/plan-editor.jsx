import React, { useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'
import PlanEditorDrafts from './plan-editor-drafts.jsx'
import PlanTransactionTools from './sidebar/plan-transaction-tools.jsx'
import PlanEditorThumbs from './plan-editor-thumbs.jsx'
import PlanEditorRecalculate from './plan-editor-recalculate.jsx'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import FiberMapObjects  from './fiber-map-objects.jsx'
import PlanNavigation from './sidebar/plan-navigation.jsx'
import AlertsTooltip from './alerts-tooltip.jsx'
import BoundaryDrawCreator from './boundary-draw-creator.jsx'
import AroFeatureEditor from '../common/editor-interface/aro-feature-editor.jsx'
import './plan-editor.css'

export const PlanEditor = props => {
  const {
    planId,
    userId,
    transactionId,
    isDrawingBoundaryFor,
    isDraftsLoaded,
    subscribeToSocket,
    unsubscribeFromSocket,
    resumeOrCreateTransaction,
    drafts,
    features,
    selectedEditFeatureIds,
    subnets,
    selectedSubnetId,
    equipments,
    rootSubnet,
    updateFeatureProperties,
    noMetaConstructionAreas,
    noMetaEquipmentTypes,
  } = props

  useEffect(() => {
    subscribeToSocket()
    resumeOrCreateTransaction(planId, userId)
    return () => unsubscribeFromSocket()
  }, [])

  function onFeatureFormSave(newValObj, objectId) {
    const { feature } = features[objectId]
    updateFeatureProperties({
      feature: { ...feature, networkNodeEquipment: newValObj },
      rootSubnetId: rootSubnet.subnetNode,
    })
  }

  return (isDraftsLoaded ?
    <div className="aro-plan-editor" style={{paddingRight: '10px'}}>
      <PlanEditorDrafts />
      <PlanTransactionTools />
      <EquipmentDragger />
      <EquipmentMapObjects />
      <EquipmentBoundaryMapObjects />
      <FiberMapObjects />
      { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
      { isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }

      <PlanNavigation />
      <AlertsTooltip />
      { /* We only want PlanEditorRecalculate to show for equipments */ }
      { selectedSubnetId && features[selectedSubnetId] && features[selectedSubnetId].feature.networkNodeType && <PlanEditorRecalculate /> }
      <PlanEditorThumbs />

      {selectedEditFeatureIds.map(id => {
        let feature = features[id].feature;
        if (
          (feature.networkNodeType &&  !noMetaEquipmentTypes.includes(feature.networkNodeType)) ||
          (!feature.networkNodeType && !noMetaConstructionAreas.includes(feature.dataType))
        ) {
          return (
            <AroFeatureEditor key={id}
              altTitle={equipments[features[id].feature.networkNodeType].label}
              isEditable={true}
              feature={features[id].feature}
              onChange={() => {}}
              onSave={newValObj => onFeatureFormSave(newValObj, id)}
            />
          )
        } else {
          return null
        }
      })}

      {/*false &&
        <div className="temporary" style={{ margin: '0 0 25px' }}>
          <h2>Plan Information</h2>
          {Object.keys(drafts).length &&
            <div style={{ backgroundColor: 'gray', padding: '10px' }}>
              <h2>Draft Information:</h2>
              {Object.keys(drafts).map(id => <p key={id}>Draft id: {id}</p>)}
              {/* {Object.values(drafts).map(draft =>
                <pre key={draft.subnetId}>{JSON.stringify(draft, null, '  ')}</pre>
              )} */}
            </div>
          }
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
      */}
    </div>
  : null)
}

const mapStateToProps = (state) => {
  let planType = state.plan.activePlan.planType
  let constructionPlanType = state.plan.activePlan.planType
  if (!(planType in state.configuration.ui.perspective.networkEquipment.planEdit)) planType = 'default'
  if (!(constructionPlanType in state.configuration.ui.perspective.constructionAreas.planEdit)) constructionPlanType = 'default'

  return {
    planId: state.plan.activePlan.id,
    userId: state.user.loggedInUser.id,
    transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
    isDrawingBoundaryFor: state.planEditor.isDrawingBoundaryFor,
    isDraftsLoaded: state.planEditor.isDraftsLoaded,
    drafts: state.planEditor.drafts,
    features: state.planEditor.features,
    selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
    subnets: state.planEditor.subnets,
    selectedSubnetId: state.planEditor.selectedSubnetId,
    equipments: state.mapLayers.networkEquipment.equipments,
    constructionAreas: state.mapLayers.constructionAreas.construction_areas,
    rootSubnet: PlanEditorSelectors.getRootSubnet(state),
    noMetaEquipmentTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.networkEquipment.planEdit[planType].noMetaData) || [],
    noMetaConstructionAreas: (state.configuration.ui.perspective && state.configuration.ui.perspective.constructionAreas.planEdit[constructionPlanType].noMetaData) || [],
  }
}

const mapDispatchToProps = dispatch => ({
  unsubscribeFromSocket: () => dispatch(PlanEditorActions.unsubscribeFromSocket()),
  subscribeToSocket: () => dispatch(PlanEditorActions.subscribeToSocket()),
  resumeOrCreateTransaction: (planId, userId) => dispatch(PlanEditorActions.resumeOrCreateTransaction(planId, userId)),
  updateFeatureProperties: obj => dispatch(PlanEditorActions.updateFeatureProperties(obj)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
