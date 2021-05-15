import React, { useState } from 'react'
import { connect } from 'react-redux'
import MapLayerActions from '../../map-layers/map-layer-actions'

const RoadSegmentTagSelect = props => {

  const { showSegmentsByTag, roadSegment } = props

  const [options, setOptions] = useState([
    'Aerial',
    'Buried',
    'Untagged',
    'Special Type',
  ])


  return showSegmentsByTag && roadSegment ?
    <div className="segments-tag-select">
      <h3>Tagged as:</h3>
      <select name="foo" id="bar">
        {options.map(option =>
          <option key={option} value={option}>
            {option}
          </option>
        )}
      </select>
      <pre>{JSON.stringify(roadSegment, null, '  ')}</pre>
    </div>
    : null
}

const mapStateToProps = state => ({
  showSegmentsByTag: state.mapLayers.showSegmentsByTag,
  roadSegment: [...(state.selection.mapFeatures.roadSegments || [undefined])][0],
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagSelect)
