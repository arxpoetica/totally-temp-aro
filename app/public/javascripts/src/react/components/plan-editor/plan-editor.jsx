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
import { isDraftLoadingOrLoaded } from './shared'
import './plan-editor.css'

export const PlanEditor = props => {
  const {
    isDrawingBoundaryFor,
    draftsState,
    subscribeToSocket,
    unsubscribeFromSocket,
    resumeOrCreateTransaction,
    features,
    selectedEditFeatureIds,
    selectedSubnetId,
    equipments,
    rootSubnet,
    updateFeatureProperties,
    noMetaConstructionAreas,
    noMetaEquipmentTypes,
    transactionId,
    rootDrafts,
    getFiberAnnotations,
  } = props

  useEffect(() => {
    subscribeToSocket()
      .then(() => resumeOrCreateTransaction())
    return () => unsubscribeFromSocket()
  }, [])

  useEffect(() => {
    if (transactionId && draftsState === "END_INITIALIZATION") {
      Object.values(rootDrafts).forEach(draft => {
        getFiberAnnotations(draft.subnetId) // does this belong in a component or in a controller/action?
      })
    }
  }, [transactionId, Object.keys(rootDrafts), draftsState])

  function onFeatureFormSave(newValObj, objectId) {
    const { feature } = features[objectId]
    updateFeatureProperties({ ...feature, networkNodeEquipment: newValObj })
  }

  return (
    <div className="aro-plan-editor" style={{paddingRight: '10px'}}>

      {/* certain things shouldn't be visible until drafts are loaded */}
      {isDraftLoadingOrLoaded(draftsState) && <>
        <PlanTransactionTools />
        <EquipmentDragger />
        <EquipmentMapObjects />
        <EquipmentBoundaryMapObjects />
        <FiberMapObjects />
        { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
        { isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }

        { /* We only want PlanEditorRecalculate to show for equipments */ }
        {
          selectedSubnetId
          && features[selectedSubnetId]
          && features[selectedSubnetId].feature.networkNodeType
          && <PlanEditorRecalculate />
        }
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
          }
          return null
        })}
      </>}

      <PlanEditorDrafts />
      <PlanNavigation />
      <AlertsTooltip />
    </div>
  )
}

const mapStateToProps = (state) => {
  let planType = state.plan.activePlan.planType
  let constructionPlanType = state.plan.activePlan.planType
  if (!(planType in state.configuration.ui.perspective.networkEquipment.planEdit)) planType = 'default'
  if (!(constructionPlanType in state.configuration.ui.perspective.constructionAreas.planEdit)) constructionPlanType = 'default'

  return {
    isDrawingBoundaryFor: state.planEditor.isDrawingBoundaryFor,
    draftsState: state.planEditor.draftsState,
    features: state.planEditor.features,
    selectedEditFeatureIds: state.planEditor.selectedEditFeatureIds,
    selectedSubnetId: state.planEditor.selectedSubnetId,
    equipments: state.mapLayers.networkEquipment.equipments,
    constructionAreas: state.mapLayers.constructionAreas.construction_areas,
    rootSubnet: PlanEditorSelectors.getRootSubnet(state),
    noMetaEquipmentTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.networkEquipment.planEdit[planType].noMetaData) || [],
    noMetaConstructionAreas: (state.configuration.ui.perspective && state.configuration.ui.perspective.constructionAreas.planEdit[constructionPlanType].noMetaData) || [],
    transactionId: state.planEditor.transaction && state.planEditor.transaction.id,
    rootDrafts: PlanEditorSelectors.getRootDrafts(state),
  }
}

const mapDispatchToProps = dispatch => ({
  unsubscribeFromSocket: () => dispatch(PlanEditorActions.unsubscribeFromSocket()),
  subscribeToSocket: () => dispatch(PlanEditorActions.subscribeToSocket()),
  resumeOrCreateTransaction: () => dispatch(PlanEditorActions.resumeOrCreateTransaction()),
  updateFeatureProperties: feature => dispatch(PlanEditorActions.updateFeatureProperties(feature)),
  getFiberAnnotations: subnetId => dispatch(PlanEditorActions.getFiberAnnotations(subnetId)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
