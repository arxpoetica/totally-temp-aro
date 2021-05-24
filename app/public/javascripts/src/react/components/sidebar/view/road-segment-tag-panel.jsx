import React, { useState } from 'react'
import { connect } from 'react-redux'
import MapLayerActions from '../../map-layers/map-layer-actions'

import cx from 'clsx'
import StrokeStyle from '../../../../shared-utils/stroke-styles'

const RoadSegmentTagPanel = props => {

  const {
    showSegmentsByTag, edgeConstructionTypes,
    setShowSegmentsByTag, setEdgeConstructionTypeVisibility } = props

  function handleCheckbox(constructionType) {
    let isVisible = !edgeConstructionTypes[constructionType].isVisible
    setEdgeConstructionTypeVisibility(constructionType, isVisible)
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
  edgeConstructionTypes: state.mapLayers.edgeConstructionTypes
})

const mapDispatchToProps = dispatch => ({
  setShowSegmentsByTag: value => dispatch(MapLayerActions.setShowSegmentsByTag(value)),
  setEdgeConstructionTypeVisibility: (constructionType, isVisible) => dispatch(MapLayerActions.setEdgeConstructionTypeVisibility(constructionType, isVisible))
})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagPanel)
