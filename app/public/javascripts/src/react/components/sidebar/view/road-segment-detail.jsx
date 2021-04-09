import React, { useState, useRef, useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import SelectionActions from '../../selection/selection-actions'
import ToolBarActions from '../../header/tool-bar-actions'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import { viewModePanels, mapHitFeatures } from '../constants'
import { dequal } from 'dequal'

export const RoadSegmentDetail = (props) => {

  const [state, setState] = useState({
    selectedEdgeInfo: [],
    correctZoomLevel: true,
  })

  const { selectedEdgeInfo, correctZoomLevel } = state

  const { mapFeatures, activeViewModePanel, cloneSelection, setMapSelection,
    activeViewModePanelAction, isClearViewMode, clearViewMode } = props

  // We need to get the previous mapFeatures prop, so that we can run an effect only on mapFeatures updates,
  // we can do it manually with a usePrevious() custom Hook.
  // https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
  function usePrevious(value) {
    const ref = useRef()
    useEffect(() => { ref.current = value })
    return ref.current
  }

  const prevMapFeatures = usePrevious(mapFeatures)

  useEffect(() => {
    // We need to run an effect only on mapFeatures updates, so 'prevMapFeatures' & 'mapFeatures' is compared.
    if (prevMapFeatures && !dequal(prevMapFeatures, mapFeatures)) {
      // On click of equipment or location dont show road segment details
      if (mapFeatures.hasOwnProperty(mapHitFeatures.EQUIPMENT_FEATURES)
        && mapFeatures.equipmentFeatures.length > 0) return
      if (mapFeatures.hasOwnProperty(mapHitFeatures.LOCATIONS)
        && mapFeatures.locations.length > 0) return
      if (activeViewModePanel === viewModePanels.EDIT_LOCATIONS) return

      if (mapFeatures.roadSegments && mapFeatures.roadSegments.size > 0) {
        const newSelection = cloneSelection()
        newSelection.details.roadSegments = mapFeatures.roadSegments
        setMapSelection(newSelection)
        const roadSegmentsInfo = generateRoadSegmentsInfo(mapFeatures.roadSegments)
        setState((state) => ({ ...state, selectedEdgeInfo: roadSegmentsInfo }))
        viewRoadSegmentInfo()
      } else if (isFeatureListEmpty(mapFeatures)) {
        setState((state) => ({ ...state, selectedEdgeInfo: [] }))
        updateSelectedState()
        // If user clicked on map then load LOCATION_INFO
        if (activeViewModePanel === viewModePanels.ROAD_SEGMENT_INFO) {
          activeViewModePanelAction(viewModePanels.LOCATION_INFO)
        }
      }
    }

    if (isClearViewMode) {
      setState((state) => ({ ...state, selectedEdgeInfo: [] }))
      updateSelectedState()
      clearViewMode(false)
    }
  }, [mapFeatures, isClearViewMode])

  const isFeatureListEmpty = (mapFeatures) => {
    let isObjectEmpty = true
    const features = Object.keys(mapFeatures)
    for (let i = 0; i < features.length; i++) {
      if (features[i] === 'latLng' || features[i] === 'roadSegments') continue
      if (mapFeatures[features[i]].length > 0 || [...mapFeatures[features[i]]].length > 0) isObjectEmpty = false
    }
    return isObjectEmpty
  }

  const generateRoadSegmentsInfo = (roadSegments) => {
    setState((state) => ({ ...state, correctZoomLevel: true }))
    const roadSegmentsInfo = []
    for (const rs of roadSegments) {
      if (rs.feature_type_name && rs.edge_length) {
        roadSegmentsInfo.push({ ...rs })
      } else {
        setState((state) => ({ ...state, correctZoomLevel: false }))
        break
      }
    }
    return roadSegmentsInfo
  }

  const updateSelectedState = () => {
    const newSelection = cloneSelection()
    newSelection.details.roadSegments = []
    if (typeof feature !== 'undefined' && typeof id !== 'undefined') {
      newSelection.editable.roadSegments[id] = feature
    }
    setMapSelection(newSelection)
  }

  const viewRoadSegmentInfo = () => {
    activeViewModePanelAction(viewModePanels.ROAD_SEGMENT_INFO)
  }

  return (
    <>
      {selectedEdgeInfo &&
        <div className="plan-settings-container">
          {correctZoomLevel
            ? <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Conduit Type</th>
                    <th>ID</th>
                    <th>Length</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    selectedEdgeInfo.map((edgeInfo) => {
                      return (
                        <tr key={edgeInfo.id}>
                          <td>{edgeInfo.feature_type_name}</td>
                          <td>{edgeInfo.gid}</td>
                          <td>{(edgeInfo.edge_length).toFixed(2)}m</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            : <>
                Zoom level too high to select conduit. Please zoom in and try to select the conduit again.
              </>
          }
        </div>
      }
    </>
  )
}

const mapStateToProps = (state) => ({
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  mapFeatures: state.selection.mapFeatures,
  isClearViewMode: state.stateViewMode.isClearViewMode,
})

const mapDispatchToProps = (dispatch) => ({
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
  clearViewMode: (value) => dispatch(StateViewModeActions.clearViewMode(value)),
})

export default wrapComponentWithProvider(reduxStore, RoadSegmentDetail, mapStateToProps, mapDispatchToProps)
