import React, { useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import { selectStyles } from '../../../common/view-utils'
import SelectionActions from '../../selection/selection-actions'
import AroHttp from '../../../common/aro-http'

function setSelectedOption(tagOptions, roadSegments) {
  const constructionType = roadSegments[0].edge_construction_type
  return tagOptions.find(option => option.value === constructionType)
}

const RoadSegmentTagSelect = props => {

  const {
    showSegmentsByTag,
    roadSegments,
    edgeConstructionTypes,
    setRoadSegments,
    selectedLibraryItems,
  } = props

  const tagOptions = Object.values(edgeConstructionTypes).map(type => {
    return { label: type.displayName, value: type.id, name: type.name }
  })
  // FIXME: need untagged
  tagOptions.unshift({ label: 'Untagged', value: 1 })

  let selectedOption
  if (roadSegments.length === 1) {
    selectedOption = setSelectedOption(tagOptions, roadSegments)
  } else if (roadSegments.length > 1) {
    const types = roadSegments.map(segment => segment.edge_construction_type)
    const uniqueTypesLength = [...new Set(types)].length
    if (uniqueTypesLength === 1) {
      selectedOption = setSelectedOption(tagOptions, roadSegments)
    } else {
      selectedOption = { label: 'multiple selected', value: 'multiple' }
      tagOptions.unshift(selectedOption)
    }
  }

  const handleChange = async(change) => {
    try {
      const body = {
        // FIXME: this should NOT just assume the first edges library
        // FIXME: it will likely break if mutliple conduit libraries are in place
        // FIXME: the alternatives are to somehow include the aro.edge `datasource`
        //          column on the tile or have the service auto figure out which
        //          associated libraryId goes w/ which selected object ids
        libraryId: selectedLibraryItems[0].identifier,
        edgeSelection: {
          selectedObjectIds: roadSegments.map(segment => segment.object_id),
        },
        modifications: {
          // attributes: {},
          constructionType: change.name,
          // subType: '',
        },
      }
      const result = await AroHttp.post('/service/edges/cmd/tag', body)

      const updatedRoadSegments = roadSegments.map(segment => {
        segment.edge_construction_type = change.value
        return segment
      })
      setRoadSegments(new Set(updatedRoadSegments))

    } catch (error) {
      console.error(error)
    }
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
  selectedLibraryItems: state.plan.dataItems?.edge?.selectedLibraryItems,
})

const mapDispatchToProps = dispatch => ({
  setRoadSegments: roadSegments => dispatch(SelectionActions.setRoadSegments(roadSegments)),
})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagSelect)
