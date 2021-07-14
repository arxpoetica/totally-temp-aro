import React from 'react'
import { connect } from 'react-redux'
import MapLayerActions from '../../map-layers/map-layer-actions'
import SelectionActions from '../../selection/selection-actions'
import cx from 'clsx'
import StrokeStyle from '../../../../shared-utils/stroke-styles'

const RoadSegmentTagPanel = props => {

  const {
    showSegmentsByTag,
    edgeConstructionTypes,
    mapFeatures,
    setShowSegmentsByTag,
    setEdgeConstructionTypeVisibility,
    setRoadSegments,
    cloneSelection,
    setMapSelection,
    setIsMapClicked,
  } = props

  function handleCheckbox(constructionType) {
    const checkedType = edgeConstructionTypes[constructionType]
    const { isVisible } = checkedType

    setEdgeConstructionTypeVisibility(constructionType, !isVisible)

    // unselect any road segments of any given unchecked type
    // note: for some reason this only works if we set both selection and road segments
    if (isVisible && mapFeatures.hasOwnProperty('roadSegments')) {
      const filteredSegments = [...mapFeatures.roadSegments].filter(segment => {
        return segment.edge_construction_type !== checkedType.id
      })
      const newRoadSegments = new Set([...filteredSegments])
      setRoadSegments(newRoadSegments)

      const newSelection = cloneSelection()
      newSelection.details.roadSegments = newRoadSegments
      setMapSelection(newSelection)
      setIsMapClicked(false)
    }
  }

  return (
    <div className="segments-tag-panel">
      <label className="header">
        <h3>Show Segments by Tag</h3>
        <input
          className="checkboxfill"
          type="checkbox"
          checked={showSegmentsByTag}
          onChange={() => setShowSegmentsByTag(!showSegmentsByTag)}
        />
      </label>
      <div className={cx('tag-rows', showSegmentsByTag && 'show')}>
        {Object.keys(edgeConstructionTypes).map((k) => {
          let constructionType = edgeConstructionTypes[k]
          return (
            <label key={k}>
              <h4>{constructionType.displayName}</h4>
              <div className="stroke-preview"
                style={{'backgroundImage': `url(${StrokeStyle[constructionType.strokeType].previewImg})`}}></div>
              <div className="checkbox">
                <input
                  className="checkboxfill"
                  type="checkbox"
                  checked={constructionType.isVisible}
                  onChange={() => handleCheckbox(k)}
                />
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  showSegmentsByTag: state.mapLayers.showSegmentsByTag,
  edgeConstructionTypes: state.mapLayers.edgeConstructionTypes,
  mapFeatures: state.selection.mapFeatures,
})

const mapDispatchToProps = dispatch => ({
  setShowSegmentsByTag: value => dispatch(MapLayerActions.setShowSegmentsByTag(value)),
  setEdgeConstructionTypeVisibility: (constructionType, isVisible) => {
    return dispatch(MapLayerActions.setEdgeConstructionTypeVisibility(constructionType, isVisible))
  },
  setRoadSegments: roadSegments => dispatch(SelectionActions.setRoadSegments(roadSegments)),
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setMapSelection: mapSelection => dispatch(SelectionActions.setMapSelection(mapSelection)),
  setIsMapClicked: mapFeatures => dispatch(SelectionActions.setIsMapClicked(mapFeatures)),
})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagPanel)
