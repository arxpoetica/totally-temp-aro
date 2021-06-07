import React, { useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import Loader from '../../common/Loader.jsx'
import { selectStyles } from '../../../common/view-utils'
import SelectionActions from '../../selection/selection-actions'
import AclActions from '../../acl/acl-actions'
import ToolBarActions from '../../header/tool-bar-actions'
import AroHttp from '../../../common/aro-http'

function setSelectedOption(tagOptions, roadSegments) {
  const constructionType = roadSegments[0].edge_construction_type
  return tagOptions.find(option => option.value === constructionType)
}

const RoadSegmentTagSelect = props => {

  const [loading, setLoading] = useState(false)

  const {
    showSegmentsByTag,
    roadSegments,
    edgeConstructionTypes,
    selectedLibraryItems,
    acl,
    writeBit,
    loggedInUser,
    setRoadSegments,
    getAcl,
    selectedDisplayMode,
  } = props

  let resourceType = 'LIBRARY'
  let canEdit = false

  const getCanEdit = (resourceId) => {
    let permissions = false
    let groupIds = loggedInUser.groupIds.concat([loggedInUser.id])
    if (acl.aclByType.hasOwnProperty(resourceType) 
      && acl.aclByType[resourceType].hasOwnProperty(resourceId)
    ){
      permissions = 'undefined' !== typeof (
        acl.aclByType[resourceType][resourceId].find(
          ele => groupIds.includes(ele.systemActorId) 
          && writeBit === (writeBit & ele.rolePermissions)
        )
      )
    }
    return permissions
  }

  // be sure we have permissions info
  if (selectedLibraryItems.length > 0 && writeBit) {
    // FIXME: this should NOT just assume the first edges library
    //          see related below fixme too...
    let resourceId = selectedLibraryItems[0].identifier
    getAcl(resourceType, resourceId)
    canEdit = getCanEdit(resourceId)
  }

  const tagOptions = Object.values(edgeConstructionTypes).map(type => {
    return { label: type.displayName, value: type.id, name: type.name }
  })
  
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
      setLoading(true)
      const result = await AroHttp.post('/service/edges/cmd/tag', body)

      const updatedRoadSegments = roadSegments.map(segment => {
        segment.edge_construction_type = change.value
        return segment
      })
      setRoadSegments(new Set(updatedRoadSegments))
      setLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  if (showSegmentsByTag && roadSegments.length > 0) {
    if (selectedLibraryItems.length > 1) {
      return (
        <>
          <div style={{'marginLeft': 'auto', 'marginRight': 'auto'}}>
            To edit a conduit library please select only one, {selectedLibraryItems.length} currently selected. 
            <br /><br />
            <button className="btn btn-primary" title="Plan Settings"
              onClick={() => selectedDisplayMode('PLAN_SETTINGS')}>
              <i className="fa fa-cog"></i> Plan Settings
            </button>
          </div>
        </>
      )
    }

    if (canEdit) {
      // showSegmentsByTag && roadSegments.length && canEdit
      return (
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
            <Loader loading={loading} title="saving tags..."/>
          </div>
          {/* <pre>{JSON.stringify(roadSegments, null, '  ')}</pre> */}
        </>
      )
    } else if (selectedLibraryItems.length) {
      // showSegmentsByTag && roadSegments.length && !canEdit
      return <div style={{'marginLeft': 'auto', 'marginRight': 'auto'}}>You do not have permission to edit: {selectedLibraryItems[0].name}</div>
    }
  }

  return null
}

const mapStateToProps = state => ({
  showSegmentsByTag: state.mapLayers.showSegmentsByTag,
  // destructuring because `roadSegments` is a `Set()`
  roadSegments: state.selection.mapFeatures.roadSegments 
    ? [...(state.selection.mapFeatures.roadSegments)]
    : [],
  edgeConstructionTypes: state.mapLayers.edgeConstructionTypes,
  // selectedLibraryItems: state.plan.dataItems?.edge?.selectedLibraryItems,
  selectedLibraryItems: state.plan.dataItems.edge
    ? state.plan.dataItems.edge.selectedLibraryItems
    : [],
  acl: state.acl,
  loggedInUser: state.user.loggedInUser,
  writeBit: state.user.authPermissions.RESOURCE_WRITE 
    ? state.user.authPermissions.RESOURCE_WRITE.permissionBits 
    : null,
})

const mapDispatchToProps = dispatch => ({
  setRoadSegments: roadSegments => dispatch(SelectionActions.setRoadSegments(roadSegments)),
  getAcl: (resourceType, resourceId, doForceUpdate = false) => dispatch(AclActions.getAcl(resourceType, resourceId, doForceUpdate)),
  selectedDisplayMode: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(RoadSegmentTagSelect)
