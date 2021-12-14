import React, { useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import SelectionActions from '../selection/selection-actions'
import { usePrevious } from '../../common/view-utils.js'
import { targetSelectionModes } from '../sidebar/constants'
import { dequal } from 'dequal'

// Create a drawing manager that will be used for marking out polygons for selecting entities
const drawingManager = new google.maps.drawing.DrawingManager({
  drawingMode: null,
  drawingControl: false
})

export const MapSelectorPlanTarget = (props) => {
  const {
    mapRef,
    planId,
    mapFeatures,
    planTargets,
    setMapFeatures,
    addPlanTargets,
    removePlanTargets,
    targetSelectionMode,
    requestPolygonSelect,
   } = props

  useEffect(() => {
    drawingManager.addListener('overlaycomplete', (e) => {
      requestPolygonSelect({
        coords: e.overlay.getPath().getArray()
      })
      setTimeout(() => e.overlay.setMap(null), 100)
    })

    return () => {
      if (drawingManager) { updateDrawingManagerState(drawingManager, 'marker', null) }
      setMapFeatures({})
    }
  }, [])

  useEffect(() => {
    if (targetSelectionMode === targetSelectionModes.POLYGON_PLAN_TARGET) {
      updateDrawingManagerState(drawingManager, 'polygon', mapRef)
    } else {
      updateDrawingManagerState(drawingManager, 'marker', null)
    }
  }, [targetSelectionMode])

  const updateDrawingManagerState = (drawingManager, drawingMode, mapRef) => {
    drawingManager.setDrawingMode(drawingMode)
    drawingManager.setMap(mapRef)
  }

  const prevMapFeatures = usePrevious(mapFeatures)
  useEffect(() => {
    if (prevMapFeatures && !dequal(prevMapFeatures, mapFeatures)) {
      addOrRemoveSelection(mapFeatures.locations || [], 'locations', 'location_id')
      addOrRemoveSelection(mapFeatures.serviceAreas || [], 'serviceAreas', 'id')
      addOrRemoveSelection(mapFeatures.analysisAreas || [], 'analysisAreas', 'id')
    }
  }, [mapFeatures])

  const addOrRemoveSelection = (entities, planTargetKey, entityIdKey) => {
    // Get a list of ids to add and remove
    var idsToAdd = new Set()
    var idsToRemove = new Set()
    entities.forEach((entity) => {
      if (planTargets[planTargetKey].has(+entity[entityIdKey])) {
        idsToRemove.add(+entity[entityIdKey])
      } else {
        idsToAdd.add(+entity[entityIdKey])
      }
    })
    if (idsToAdd.size > 0) {
      addPlanTargets(planId, { [planTargetKey]: idsToAdd })
    }
    if (idsToRemove.size > 0) {
      removePlanTargets(planId, { [planTargetKey]: idsToRemove })
    }
  }

  // No UI for this component. It deals with map objects only.
  return null
}

const mapStateToProps = (state) => ({
  mapRef: state.map.googleMaps,
  planId: state.plan.activePlan.id,
  planTargets: state.selection.planTargets,
  mapFeatures: state.selection.mapFeatures,
  targetSelectionMode: state.toolbar.selectedTargetSelectionMode,
})

const mapDispatchToProps = (dispatch) => ({
  setMapFeatures: mapFeatures => dispatch(SelectionActions.setMapFeatures(mapFeatures)),
  addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
  removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets)),
  requestPolygonSelect: polygonCoordinates => dispatch(SelectionActions.requestPolygonSelect(polygonCoordinates)),
})

export default wrapComponentWithProvider(reduxStore, MapSelectorPlanTarget, mapStateToProps, mapDispatchToProps)
