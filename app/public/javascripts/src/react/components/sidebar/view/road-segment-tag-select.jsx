import React, { useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import { selectStyles } from '../../../common/view-utils.js'
// import MapLayerActions from '../../map-layers/map-layer-actions'

const RoadSegmentTagSelect = props => {

  const { showSegmentsByTag, roadSegment } = props

  const [options, setOptions] = useState([
    { label: 'Aerial', value: 0 },
    { label: 'Buried', value: 1 },
    { label: 'Untagged', value: 2 },
    { label: 'Special Type', value: 3 },
  ])

  const handleInputChange = (searchTerm, { action }) => {
    console.group('handleInputChange')
    console.log('searchTerm:', searchTerm)
    console.log('action:', action)
    console.groupEnd()
  }

  const handleChange = change => {
    console.group('handleChange')
    console.log('change:', change)
    console.groupEnd()
  }

  return showSegmentsByTag && roadSegment ?
    <>
    <div className="segments-tag-select">
      <h3>Tagged as:</h3>
      <div className="select">
        <Select
          options={options}
          placeholder="Select a tag..."
          onInputChange={handleInputChange}
          onChange={handleChange}
          styles={selectStyles}
        />
      </div>
    </div>
    <pre>{JSON.stringify(roadSegment, null, '  ')}</pre>
    </>
    : null
}

const mapStateToProps = state => ({
  showSegmentsByTag: state.mapLayers.showSegmentsByTag,
  roadSegment: [...(state.selection.mapFeatures.roadSegments || [undefined])][0],
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagSelect)
