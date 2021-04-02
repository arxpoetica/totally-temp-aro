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

  const { selectedMapFeatures, activeViewModePanel, cloneSelection, setMapSelection,
    activeViewModePanelAction, isClearViewMode, clearViewModeAction } = props

  function usePrevious(value) {
    const ref = useRef()
    useEffect(() => { ref.current = value })
    return ref.current
  }

  const prevMapFeatures = usePrevious(selectedMapFeatures)

  useEffect(() => {
    if (prevMapFeatures && !dequal(prevMapFeatures, selectedMapFeatures)) {
      if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.EQUIPMENT_FEATURES)
        && selectedMapFeatures.equipmentFeatures.length > 0) return
      if (selectedMapFeatures.hasOwnProperty(mapHitFeatures.LOCATIONS)
        && selectedMapFeatures.locations.length > 0) return
      if (activeViewModePanel === viewModePanels.EDIT_LOCATIONS) return

      if (selectedMapFeatures.roadSegments && selectedMapFeatures.roadSegments.size > 0) {
        const newSelection = cloneSelection()
        newSelection.details.roadSegments = selectedMapFeatures.roadSegments
        setMapSelection(newSelection)
        const roadSegmentsInfo = generateRoadSegmentsInfo(selectedMapFeatures.roadSegments)
        setState((state) => ({ ...state, selectedEdgeInfo: roadSegmentsInfo }))
        viewRoadSegmentInfo()
      } else if (isFeatureListEmpty(selectedMapFeatures)) {
        setState((state) => ({ ...state, selectedEdgeInfo: [] }))
        updateSelectedState()
        // this check maybe needs to go at the top of this function (symptom of larger problem)
        if (activeViewModePanel === viewModePanels.ROAD_SEGMENT_INFO) {
          // ToDo: this doesn't belog here it's a symptom of a larger problem
          activeViewModePanelAction(viewModePanels.LOCATION_INFO)
        }
      }
    }

    if (isClearViewMode) {
      setState((state) => ({ ...state, selectedEdgeInfo: [] }))
      updateSelectedState()
      clearViewModeAction(false)
    }
  }, [selectedMapFeatures, isClearViewMode])

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
        break;
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
                  {selectedEdgeInfo.map((edgeInfo) => {
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
  selectedMapFeatures: state.selection.mapFeatures,
  isClearViewMode: state.stateViewMode.isClearViewMode,
})

const mapDispatchToProps = (dispatch) => ({
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
  clearViewModeAction: (value) => dispatch(StateViewModeActions.clearViewMode(value)),
})

export default wrapComponentWithProvider(reduxStore, RoadSegmentDetail, mapStateToProps, mapDispatchToProps)
