import React, { useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'
import PlanEditorDrafts from './plan-editor-drafts.jsx'
import PlanTransactionTools from './sidebar/plan-transaction-tools.jsx'
import PlanEditorThumbs from './plan-editor-thumbs.jsx'
import EquipmentDragger from './equipment-dragger.jsx'
import EquipmentMapObjects from './equipment-map-objects.jsx'
import EquipmentBoundaryMapObjects from './equipment-boundary-map-objects.jsx'
import FiberMapObjects  from './fiber-map-objects.jsx'
import PlanNavigation from './sidebar/plan-navigation.jsx'
import AlertsTooltip from './alerts-tooltip.jsx'
import BoundaryDrawCreator from './boundary-draw-creator.jsx'
import AroFeatureEditor from '../common/editor-interface/aro-feature-editor.jsx'
import { isDraftLoadingOrLoaded } from './shared'
import { Overlay } from '@mantine/core'
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
    equipments,
    updateFeatureProperties,
    noMetaConstructionAreas,
    noMetaEquipmentTypes,
    isChangesSaved,
    isRecalculating,
    isCommittingTransaction,
  } = props

  useEffect(() => {
    subscribeToSocket()
      .then(() => resumeOrCreateTransaction())
    return () => unsubscribeFromSocket()
  }, [])

  function onFeatureFormSave(newValObj, objectId) {
    const { feature } = features[objectId]
    updateFeatureProperties({ ...feature, networkNodeEquipment: newValObj })
  }

  return (
    <div className="aro-plan-editor">

      <PlanTransactionTools />

      <div className="body">
        {/* certain things shouldn't be visible until drafts are loaded */}
        {isDraftLoadingOrLoaded(draftsState) && <>
          <EquipmentDragger />
          <EquipmentMapObjects />
          <EquipmentBoundaryMapObjects />
          <FiberMapObjects />
          { /* If we are in "draw boundary mode" for any equipment, render the drawing component */ }
          { isDrawingBoundaryFor ? <BoundaryDrawCreator /> : null }
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

        {(!isChangesSaved || isRecalculating || isCommittingTransaction) &&
          <Overlay opacity={0.75} color="#ffffff" zIndex={5}/>
        }
      </div>

      <style jsx>{`
        .aro-plan-editor {
          overflow: auto;
          height: 100%;
          margin: -12px 0 12px;
        }
        .body {
          position: relative;
        }
      `}</style>
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
    equipments: state.mapLayers.networkEquipment.equipments,
    constructionAreas: state.mapLayers.constructionAreas.construction_areas,
    noMetaEquipmentTypes: (state.configuration.ui.perspective && state.configuration.ui.perspective.networkEquipment.planEdit[planType].noMetaData) || [],
    noMetaConstructionAreas: (state.configuration.ui.perspective && state.configuration.ui.perspective.constructionAreas.planEdit[constructionPlanType].noMetaData) || [],
    isChangesSaved: PlanEditorSelectors.getIsChangesSaved(state),
    isRecalculating: state.planEditor.isRecalculating,
    isCommittingTransaction: state.planEditor.isCommittingTransaction,
  }
}

const mapDispatchToProps = dispatch => ({
  unsubscribeFromSocket: () => dispatch(PlanEditorActions.unsubscribeFromSocket()),
  subscribeToSocket: () => dispatch(PlanEditorActions.subscribeToSocket()),
  resumeOrCreateTransaction: () => dispatch(PlanEditorActions.resumeOrCreateTransaction()),
  updateFeatureProperties: feature => dispatch(PlanEditorActions.updateFeatureProperties(feature)),
})

const PlanEditorComponent = wrapComponentWithProvider(reduxStore, PlanEditor, mapStateToProps, mapDispatchToProps)
export default PlanEditorComponent
