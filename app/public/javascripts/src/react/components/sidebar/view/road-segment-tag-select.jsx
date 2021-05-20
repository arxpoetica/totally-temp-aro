import React, { useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import { selectStyles } from '../../../common/view-utils'
import SelectionActions from '../../selection/selection-actions'
// import AroHttp from '../../../common/aro-http'

const RoadSegmentTagSelect = props => {

  const { showSegmentsByTag, roadSegments, edgeConstructionTypes, setRoadSegments } = props

  const tagOptions = Object.values(edgeConstructionTypes).map(type => {
    return { label: type.displayName, value: type.id }
  })

  let selectedOption
  if (roadSegments.length === 1) {
    // FIXME: need untagged
    tagOptions.unshift({ label: 'Untagged', value: 1 })

    const constructionType = roadSegments[0].edge_construction_type
    selectedOption = tagOptions.find(option => {
      return option.value === constructionType
    })
  } else if (roadSegments.length > 1) {
    selectedOption = { label: 'multiple selected', value: 'multiple' }
    tagOptions.unshift(selectedOption)
  }

  const handleChange = async(change) => {
    console.group('handleChange')
    try {
      console.log('TODO: finish the actual POST of the body...')
      console.log('change:', change)
      // const body = {
      //   edgeSelection: {
      //     selectedObjectIds: {},
      //   },
      //   modifications: {
      //     attributes: {},
      //     constructionType: 'string',
      //     subType: 'string',
      //   },
      // }
      // const result = await AroHttp.post('/edges/cmd/tag', body)
      // console.log(result)

      const updatedRoadSegments = roadSegments.map(segment => {
        segment.edge_construction_type = change.value
        return segment
      })
      setRoadSegments(new Set(updatedRoadSegments))

    } catch (error) {
      console.error(error)
    }
    console.groupEnd()
  }

  return showSegmentsByTag && roadSegments.length ?
    <>
    <div className="segments-tag-select">
      <h3>Tagged as:</h3>
      <div className="select">
        <Select
          value={selectedOption}
          options={tagOptions}
          placeholder="Select a tag..."
          onChange={handleChange}
          styles={selectStyles}
        />
      </div>
    </div>
    <pre>{JSON.stringify(roadSegments, null, '  ')}</pre>
    </>
    : null
}

const mapStateToProps = state => ({
  showSegmentsByTag: state.mapLayers.showSegmentsByTag,
  // destructuring because `roadSegments` is a `Set()`
  roadSegments: [...(state.selection.mapFeatures.roadSegments || [])],
  edgeConstructionTypes: state.mapLayers.edgeConstructionTypes,
})

const mapDispatchToProps = dispatch => ({
  setRoadSegments: roadSegments => dispatch(SelectionActions.setRoadSegments(roadSegments)),
})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagSelect)
