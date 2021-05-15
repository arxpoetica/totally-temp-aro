import React, { useState } from 'react'
import { connect } from 'react-redux'
import MapLayerActions from '../../map-layers/map-layer-actions'

import cx from 'clsx'

const RoadSegmentTagPanel = props => {

  const { mapFeatures, showSegmentsByTag, setShowSegmentsByTag } = props

  const [rows, setRows] = useState([
    { label: 'Aerial', display: '', checked: false },
    { label: 'Buried', display: '', checked: false },
    { label: 'Untagged', display: '', checked: false },
    { label: 'Special Type', display: '', checked: false },
  ])

  function handleCheckbox(index) {
    const updatedRows = rows.map((row, mapIndex) => {
      if (mapIndex === index) {
        row.checked = !row.checked
      }
      return row
    })
    setRows(updatedRows)
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
        {rows.map((row, index) =>
          <label key={index}>
            <h4>{row.label}</h4>
            <div className="display"></div>
            <div className="checkbox">
              <input
                className="checkboxfill"
                type="checkbox"
                checked={row.checked}
                onChange={() => handleCheckbox(index)}
              />
            </div>
          </label>
        )}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  mapFeatures: state.selection.mapFeatures,
  showSegmentsByTag: state.mapLayers.showSegmentsByTag,
})

const mapDispatchToProps = dispatch => ({
  setShowSegmentsByTag: value => dispatch(MapLayerActions.setShowSegmentsByTag(value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagPanel)
