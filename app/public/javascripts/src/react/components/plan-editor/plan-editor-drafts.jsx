import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import Boundary from './map-objects/boundary.jsx'
import EquipmentNode from './map-objects/equipment-node.jsx'
import PlanEditorActions from './plan-editor-actions.js'

// TODO: in the future, might have abstract higher order component to wrap state.
// Basically, the contract is fragile if we want to reuse `Boundary` or
// `EquipmendNode` elsewhere. For now, just lifting state to this component
// for those actions.

const PlanEditorDrafts = props => {

  const { drafts, googleMaps, selectedSubnetId, selectEditFeaturesById } = props
  const [objects, setObjects] = useState([])

  const mapClickHandler = event => {
    event.domEvent.stopPropagation()

    // guard against selection if skeleton equipment not displayed
    if (selectedSubnetId) return

    // NOTE: let's abstract this functionality somewhere, so we can reuse
    const zoom = googleMaps.getZoom()
    const latitude = event.latLng.lat()
    // SEE: https://medium.com/techtrument/how-many-miles-are-in-a-pixel-a0baf4611fff
    const metersBySinglePixel
      = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom)
    // NOTE: this is a workaround to make sure we're selecting
    // equipment/boundaries that might be piled on top of one another
    const circle = new google.maps.Circle({
      map: googleMaps,
      center: event.latLng,
      // radius adjusted according to zoom level
      radius: metersBySinglePixel * 20,
      visible: false,
    })

    const featureIds = []
    for (const object of objects) {
      const { itemId, itemType } = object
      let isInside
      if (itemType === 'equipment') {
        isInside = circle.getBounds().contains(object.getPosition())
      } else if (itemType === 'boundary') {
        isInside = google.maps.geometry.poly.containsLocation(event.latLng, object)
      }
      if (isInside) featureIds.push(itemId)
    }

    circle.setMap(null)

    const uniqueFeatureIds = [...new Set(featureIds)]
    selectEditFeaturesById(uniqueFeatureIds)
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

  return Object.values(drafts).map(draft =>
    <React.Fragment key={draft.subnetId}>
      {selectedSubnetId !== draft.subnetId &&
        <Boundary
          id={draft.subnetId}
          polygon={draft.boundary.polygon}
          // using functional approach to avoid race conditions
          onLoad={object => setObjects(state => [...state, object])}
        />
      }
        <EquipmentNode
          key={node.id}
          id={node.id}
          node={node}
          // using functional approach to avoid race conditions
          onLoad={object => setObjects(state => [...state, object])}
        />
      )}
    </React.Fragment>
  )
}

const mapStateToProps = state => ({
  drafts: state.planEditor.drafts,
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
})
const mapDispatchToProps = dispatch => ({
  selectEditFeaturesById: ids => dispatch(PlanEditorActions.selectEditFeaturesById(ids)),
})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorDrafts)
