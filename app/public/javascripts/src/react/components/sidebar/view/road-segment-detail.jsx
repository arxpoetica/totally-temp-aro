import React, { useState, useRef, useEffect } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { RoadSegmentTagging } from './road-segment-tagging.jsx'
import SelectionActions from '../../selection/selection-actions'
import ToolBarActions from '../../header/tool-bar-actions'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import { viewModePanels, mapHitFeatures } from '../constants'
import AroHttp from '../../../common/aro-http'
import { dequal } from 'dequal'

export const RoadSegmentDetail = (props) => {

  const [state, setState] = useState({
    selectedEdgeInfo: [],
    correctZoomLevel: true,
    detailsById: {},
    selectedDetail: null,
  })

  const { selectedEdgeInfo, correctZoomLevel, detailsById, selectedDetail } = state

  const { mapFeatures, activeViewModePanel, cloneSelection, setMapSelection,
    activeViewModePanelAction, isClearViewMode, clearViewMode, plan, user } = props

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
        if (roadSegmentsInfo.length === 1) onEdgeExpand(roadSegmentsInfo[0])
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
    let roadSegmentsInfo = []
    // don't show duplicates, use id 
    let addedIDs = []
    for (const rs of roadSegments) {
      if (rs.feature_type_name && rs.edge_length) {
        if (!addedIDs.includes(rs.id)) {
          addedIDs.push(rs.id)
          roadSegmentsInfo.push({ ...rs })
        }
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

  const onEdgeExpand = (edgeInfo) => {
    let newSelectedDetail = null
    if (edgeInfo.id !== selectedDetail) {
      newSelectedDetail = edgeInfo.id
    }

    setState((state) => ({ ...state, 'selectedDetail': newSelectedDetail }))
    if (!detailsById[edgeInfo.id]) {
      getEdgeAttributes(edgeInfo.id)
    }
  }

  const getEdgeAttributes = (edgeId) => {
    AroHttp.get(`/service/plan-feature/${plan.id}/edge/${edgeId}?user_id=${user.id}`)
    .then((result) => {
      let attributes = null
      if (result.data && result.data.exportedAttributes) {
        attributes = result.data.exportedAttributes
      }
      let newDetailsById = { ...state.detailsById }
      newDetailsById[edgeId] = attributes
      setState((state) => ({ ...state, 
        'detailsById': newDetailsById
      }))

    })
    .catch((err) => console.error(err))
  }

  const renderAttributesComponent = attributes => {
    return <table className="table table-sm" style={{ 'backgroundColor': 'inherit' }}>
      <tbody>
        {Object.keys(attributes).map(key =>
          <tr key={key}>
            <td>{key}</td>
            <td>{attributes[key]}</td>
          </tr>
        )}
      </tbody>
    </table>
  }

  return (
    <>
      <style>
        {`
          .roadSegDetailRow {
            cursor: pointer;
          }
          .roadSegDetailRow:hover {
            outline: 1px solid #007bff;
          }
          .roadSegDetailAttributeRow {
            padding-left: 20px !important;
          }
          .roadSegOddRow {
            background-color: rgba(0,0,0,.05);
          }
        `}
      </style>
      {selectedEdgeInfo &&
        <div className="plan-settings-container">

          {correctZoomLevel
            ? <>
                <RoadSegmentTagging/>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Conduit Type</th>
                      <th>ID</th>
                      <th>Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      selectedEdgeInfo.map((edgeInfo, index) => {
                        let rowClass = 'roadSegOddRow'
                        if (index % 2 === 0) rowClass = 'roadSegEvenRow'
                        let rows = []
                        rows.push(
                          <tr key={edgeInfo.id} className={`roadSegDetailRow ${rowClass}`}
                            onClick={() => onEdgeExpand(edgeInfo)} >
                            <td>{edgeInfo.feature_type_name}</td>
                            <td>{edgeInfo.gid}</td>
                            <td>{(edgeInfo.edge_length).toFixed(2)}m</td>
                          </tr>
                        )
                        if (edgeInfo.id === selectedDetail) {
                          let attributes = 'loading'
                          if (detailsById[edgeInfo.id]) {
                            attributes = renderAttributesComponent(detailsById[edgeInfo.id])
                          }
                          rows.push(
                            <tr className={`${rowClass}`} key={`${edgeInfo.id}_detail`}>
                              <td className='roadSegDetailAttributeRow' colSpan="3">{attributes}</td>
                            </tr>
                          )
                        }
                        return rows
                      })
                    }
                  </tbody>
                </table>
              </>
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
  plan: state.plan.activePlan,
  user: state.user.loggedInUser,
})

const mapDispatchToProps = (dispatch) => ({
  activeViewModePanelAction: (value) => dispatch(ToolBarActions.activeViewModePanel(value)),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
  clearViewMode: (value) => dispatch(StateViewModeActions.clearViewMode(value)),
})

export default wrapComponentWithProvider(reduxStore, RoadSegmentDetail, mapStateToProps, mapDispatchToProps)
