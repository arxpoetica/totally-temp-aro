/* globals google */
import { useEffect } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import { constants } from './shared'
import PlanEditorActions from './plan-editor-actions'

let renderedSubnetId = ''
let mapObjects = []

export const FiberMapObjects = (props) => {
  const {
    selectedSubnetId,
    subnets,
    subnetFeatures,
    fiberRenderRequired,
    setFiberRenderRequired,
    googleMaps,
    setSelectedFiber,
    selectedFiber,
    fiberAnnotations,
    layerEquipment,
  } = props

  const conduitStyles = {...layerEquipment.roads, ...layerEquipment.conduits}

  useEffect(() => {
    if (subnets[selectedSubnetId] && subnets[selectedSubnetId].fiber) {
      const { subnetLinks, fiberType } = subnets[selectedSubnetId].fiber

      // don'r render if fiber is the same
      // fiber Renderrequired being true means the fiber should be rendered regardless
      if (renderedSubnetId !== selectedSubnetId || fiberRenderRequired) {
        renderedSubnetId = selectedSubnetId
        renderFiber(subnetLinks, fiberType)
      }
    } else if (
      subnetFeatures[selectedSubnetId] &&
      subnets[subnetFeatures[selectedSubnetId].subnetId]
    ) {
      //if it is a terminal get parent id and render that fiber
      const { subnetId: parentId } = subnetFeatures[selectedSubnetId]
      const { subnetLinks, fiberType } = subnets[parentId].fiber

      if (renderedSubnetId !== parentId || fiberRenderRequired) {
        renderedSubnetId = parentId
        renderFiber(subnetLinks, fiberType)
      }
    } else {
      deleteMapObjects()
    }

    function renderFiber(subnetLinks, fiberType) {
      if (mapObjects.length) {
        deleteMapObjects()
      }
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
        setFiberRenderRequired(false)
      }
    }
    function createMapObject(path, fromNode, toNode, fiberType, conduitType = null) {
      let strokeColor = layerEquipment.cables[fiberType].drawingOptions.strokeStyle
      let strokeWeight = fiberType === 'DISTRIBUTION' ? 2 : 3
      let selected = false

      if (conduitType 
        && conduitType in conduitStyles
        && conduitType in layerEquipment.cables[fiberType].conduitVisibility
        && layerEquipment.cables[fiberType].conduitVisibility[conduitType]
      ){
        strokeColor = conduitStyles[conduitType].drawingOptions.strokeStyle
      } 

      let highlightColor = null
      let highlightWeight = null
      // set color purple if there are annotations
      if (
        fiberAnnotations[selectedSubnetId] &&
        fiberAnnotations[selectedSubnetId].some(
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
  }, [
    selectedSubnetId,
    subnets,
    subnetFeatures,
    fiberRenderRequired,
    setFiberRenderRequired,
    googleMaps,
    deleteMapObjects,
  ])

  // cleanup
  useEffect(() => () => deleteMapObjects(), [])

  function deleteMapObjects() {
    if (mapObjects.length) {
      mapObjects.forEach((mapObject) => mapObject.setMap(null))
      mapObjects = []
    }
  }

  // No ui, only handles mapObjects
  return null
}

const mapStateToProps = (state) => ({
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnets: state.planEditor.subnets,
  subnetFeatures: state.planEditor.subnetFeatures,
  fiberRenderRequired: state.planEditor.fiberRenderRequired,
  selectedFiber: state.planEditor.selectedFiber,
  fiberAnnotations: state.planEditor.fiberAnnotations,
  layerEquipment: state.mapLayers.networkEquipment,
})

const mapDispatchToProps = (dispatch) => ({
  setFiberRenderRequired: (bool) =>
    dispatch(PlanEditorActions.setFiberRenderRequired(bool)),
  setSelectedFiber: (fiberNames) =>
    dispatch(PlanEditorActions.setSelectedFiber(fiberNames)),
})

const FiberMapObjectsComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FiberMapObjects)
export default FiberMapObjectsComponent
