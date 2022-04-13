import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import Boundary from './map-objects/boundary.jsx'
import EquipmentNode from './map-objects/equipment-node.jsx'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'
import { getMetersPerPixel } from './shared'

// TODO: in the future, might have abstract higher order component to wrap state.
// Basically, the contract is fragile if we want to reuse `Boundary` or
// `EquipmendNode` elsewhere. For now, just lifting state to this component
// for those actions.

const PlanEditorDrafts = props => {

  const {
    drafts,
    rootDrafts,
    googleMaps,
    selectedSubnetId,
    selectEditFeaturesById,
    equipments,
  } = props

  const [objects, setObjects] = useState([])

  const mapClickHandler = event => {
    const metersPerPixel = getMetersPerPixel(event.latLng.lat(), googleMaps.getZoom())
    // NOTE: this is a workaround to make sure we're selecting
    // equipment/boundaries that might be piled on top of one another
    const selectionCircle = new google.maps.Circle({
      map: googleMaps,
      center: event.latLng,
      // radius adjusted according to zoom level
      visible: false,
      radius: metersPerPixel * 15,
    })

    const equipmentIds = []
    for (const object of objects) {
      const { itemId, itemType } = object
      let isInside
      if (itemType === 'equipment') {
        isInside = selectionCircle.getBounds().contains(object.getPosition())
      } else if (itemType === 'boundary') {
        isInside = google.maps.geometry.poly.containsLocation(event.latLng, object)
      }
      if (isInside && itemId) equipmentIds.push(itemId)
    }
    selectionCircle.setMap(null)

    const uniqueEquipmentIds = [...new Set(equipmentIds)]
    uniqueEquipmentIds.sort(id => drafts[id].nodeType === 'central_office' ? 1 : -1)
    selectEditFeaturesById(uniqueEquipmentIds)
  }

  useEffect(() => {
    let listener
    if (objects.length) {
      listener = googleMaps.addListener('click', mapClickHandler)
    }
    return () => {
      if (listener) google.maps.event.removeListener(listener)
    }
  }, [objects])

  const draftsArray = Object.values(drafts)
  // get single list of all root draft equipment
  let allEquipment = [] // should probably put into selector
  Object.values(rootDrafts).forEach(draft => {
    allEquipment = allEquipment.concat(draft.equipment)
  })

  return <>
    {draftsArray.map(draft => {
      const { subnetId, subnetBoundary, nodeSynced } = draft
      const options = { strokeOpacity: nodeSynced ? 1 : 0.5 }

      if (selectedSubnetId !== subnetId) { // do NOT show selected boundary, it's editable and handled elsewhere
        return (
          <Boundary
            key={subnetId}
            id={subnetId}
            polygon={subnetBoundary.polygon}
            options={options}
            // using functional approach to avoid race conditions
            onLoad={object => setObjects(state => [...state, object])}
          />
        )
      }
      return null
    })}

    {allEquipment.map(node => {
      const { id, point, networkNodeType } = node
      const nodeSynced = drafts[id] && drafts[id].nodeSynced
      if (
        nodeSynced
        && selectedSubnetId !== id
        && networkNodeType !== 'bulk_distribution_terminal'
        && networkNodeType !== 'multiple_dwelling_unit'
      ) {
        return (
          <EquipmentNode
            key={id}
            id={id}
            point={point}
            iconUrl={equipments[networkNodeType].iconUrl}
            // using functional approach to avoid race conditions
            onLoad={object => setObjects(state => [...state, object])}
          />
        )
      }
      return null
    })}
  </>
}

const mapStateToProps = state => ({
  drafts: state.planEditor.drafts,
  rootDrafts: PlanEditorSelectors.getRootDrafts(state), 
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  equipments: state.mapLayers.networkEquipment.equipments,
})
const mapDispatchToProps = dispatch => ({
  selectEditFeaturesById: ids => dispatch(PlanEditorActions.selectEditFeaturesById(ids)),
})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorDrafts)
