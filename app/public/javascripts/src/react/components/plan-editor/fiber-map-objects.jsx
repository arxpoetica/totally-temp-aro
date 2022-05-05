/* globals google */
import { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import { constants } from './shared'
import PlanEditorActions from './plan-editor-actions'
import PlanEditorSelectors from './plan-editor-selectors'

let mapObjects = []

export const FiberMapObjects = (props) => {
  const {
    selectedSubnetId,
    subnets,
    subnetFeatures,
    googleMaps,
    setSelectedFiber,
    selectedFiber,
    fiberAnnotations,
    cableLayers,
    conduitStyles,
    rootSubnetId,
    rootDrafts,
  } = props

  useEffect(() => {
    // get subnet for selected ID 
    //  if feature is edge_construction_area get root ? does an edge_construction_area have a parent? 
    let subnetLinks = []
    let fiberType = ''
    
    if (selectedSubnetId) {
      let subnetId = selectedSubnetId
      const feature = subnetFeatures[selectedSubnetId]
      if (feature) {
        if (feature.feature.dataType === 'edge_construction_area') {
          const rootList = Object.values(rootDrafts)
          if (rootList.length) { // we have at least 1 root
            if (rootList.length === 1) { // we have ONLY 1 root
              subnetId = rootList[0].subnetId
            } else { // we ahve more than 1 root
              // get the subnet by lat long
            }
          }
        } 
        // in case of terminal or other feature that isn't a subnet itself
        if (!subnets[subnetId]) subnetId = feature.subnetId
        if (subnets[subnetId].fiber) { 
          subnetLinks = subnets[subnetId].fiber.subnetLinks
          fiberType = subnets[subnetId].fiber.fiberType
        }
      }
    }
    
    // debounce?
    renderFiber(subnetLinks, fiberType)
  }, [
    selectedSubnetId,
    //rootSubnetId,
    subnets,
    subnetFeatures,
    fiberAnnotations,
    selectedFiber,
    cableLayers,
    googleMaps,
  ])

  function renderFiber(subnetLinks, fiberType) {
    deleteMapObjects()
    
    if (subnetLinks) {
      for (const subnetLink of subnetLinks) {
        const { geometry, fromNode, toNode, conduitLinkSummary } = subnetLink
        // use conduitLinkSummary.spanningEdgeType to get say "road"
        //  there is also conduitLinkSummary.planConduits[0].ref.spatialEdgeTypeReference not sure how this differs
        const conduitType = conduitLinkSummary.spanningEdgeType
        if (geometry.type === 'LineString') {
          const path = WktUtils.getGoogleMapPathsFromWKTLineString(geometry)
          createMapObject(path, fromNode, toNode, fiberType, conduitType)
        } else if (geometry.type === 'MultiLineString') {
          const path = WktUtils.getGoogleMapPathsFromWKTMultiLineString(geometry)
          createMapObject(path, fromNode, toNode, fiberType, conduitType)
        }
      }
    }
  }

  function createMapObject(path, fromNode, toNode, fiberType, conduitType = null) {
    let strokeColor = cableLayers[fiberType].drawingOptions.strokeStyle
    let strokeWeight = fiberType === 'DISTRIBUTION' ? 2 : 3
    let selected = false

    // if this cable type is being colored by conduit type
    if (conduitType 
      && conduitType in conduitStyles
      && conduitType in cableLayers[fiberType].conduitVisibility // has prop
      && cableLayers[fiberType].conduitVisibility[conduitType] // value === true
    ){
      strokeColor = conduitStyles[conduitType].drawingOptions.strokeStyle
    } 

    let highlightColor = null
    let highlightWeight = null
    // set color purple if there are annotations
    if (
      fiberAnnotations[rootSubnetId] &&
      fiberAnnotations[rootSubnetId].some(
        (fiber) => fiber.fromNode === fromNode && fiber.toNode === toNode,
      )
    ){
      highlightColor = '#ff55da'
      strokeWeight = 2
      highlightWeight = 5
    }

    // set color pink, increase stroke and set selected true if selected
    if (
      selectedFiber.some(
        (fiber) => fiber.fromNode === fromNode && fiber.toNode === toNode,
      )
    ) {
      strokeWeight = 5
      selected = true
      if (highlightWeight) highlightWeight += 2
    }

    const newMapObject = new google.maps.Polyline({
      selected,
      fromNode,
      toNode,
      path,
      clickable: fiberType === 'FEEDER',
      map: googleMaps,
      zIndex: constants.Z_INDEX_MAP_OBJECT,
      strokeColor,
      strokeOpacity: 1.0,
      strokeWeight,
    })
    mapObjects.push(newMapObject)

    if (highlightColor) {
      const newHighlightObject = new google.maps.Polyline({
        selected,
        fromNode,
        toNode,
        path,
        clickable: false,
        map: googleMaps,
        zIndex: constants.Z_INDEX_MAP_OBJECT - 1,
        strokeColor: highlightColor,
        strokeOpacity: 1.0,
        strokeWeight: highlightWeight,
      })
      mapObjects.push(newHighlightObject)
    }

    newMapObject.addListener('click', (event) => {
      const { shiftKey } = event.domEvent // Bool, true if shift key is held down
      const selectedFiberNodes = []

      if (shiftKey) {
        // loop to find all other selected routes if shift key is held
        mapObjects.forEach((mapObject) => {
          // if selected and not the clicked route add to redux selected list
          // This is because if you pull selected from state it will be stale
          if (
            mapObject.selected &&
            (mapObject.fromNode !== fromNode || mapObject.toNode !== toNode)
          ) {
            selectedFiberNodes.push({
              fromNode: mapObject.fromNode,
              toNode: mapObject.toNode,
            })
          }
        })
        // if the clicked route was not selected, add it to selected state
        if (!newMapObject.selected) {
          selectedFiberNodes.push({
            fromNode: newMapObject.fromNode,
            toNode: newMapObject.toNode,
          })
        }
      } else {
        // if other routes are selected or none are selected still select the clicked route
        if (
          mapObjects.some(
            (mapObject) =>
              mapObject.selected &&
              (mapObject.fromNode !== fromNode ||
                mapObject.toNode !== toNode),
          ) ||
          !newMapObject.selected
        ) {
          // adds clicked route to selected
          selectedFiberNodes.push({
            fromNode: newMapObject.fromNode,
            toNode: newMapObject.toNode,
          })
        }
      }

      setSelectedFiber(selectedFiberNodes)
    })
  }

  // cleanup
  useEffect(() => () => deleteMapObjects(), [])

  function deleteMapObjects() {
    mapObjects.forEach((mapObject) => mapObject.setMap(null))
    mapObjects = []
  }

  // No ui, only handles mapObjects
  return null
}

const mapStateToProps = (state) => ({
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnets: state.planEditor.subnets,
  subnetFeatures: state.planEditor.subnetFeatures,
  selectedFiber: state.planEditor.selectedFiber,
  fiberAnnotations: state.planEditor.fiberAnnotations,
  cableLayers: state.mapLayers.networkEquipment.cables,
  conduitStyles: {...state.mapLayers.networkEquipment.roads, ...state.mapLayers.networkEquipment.conduits},
  rootSubnetId: PlanEditorSelectors.getRootSubnetIdForSelected(state),
  rootDrafts: PlanEditorSelectors.getRootDrafts(state),
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedFiber: (fiberNames) =>
    dispatch(PlanEditorActions.setSelectedFiber(fiberNames)),
})

const FiberMapObjectsComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FiberMapObjects)
export default FiberMapObjectsComponent
