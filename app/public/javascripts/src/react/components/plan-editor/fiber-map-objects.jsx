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
    selectedFiberNames,
    fiberAnnotations,
  } = props

  useEffect(() => {
    if (subnets[selectedSubnetId]) {
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
          const { geometry, name } = subnetLink
          if (geometry.type === 'LineString') {
            const path = WktUtils.getGoogleMapPathsFromWKTLineString(geometry)
            createMapObject(path, name, fiberType)
          } else if (geometry.type === 'MultiLineString') {
            const path =
              WktUtils.getGoogleMapPathsFromWKTMultiLineString(geometry)
            createMapObject(path, name, fiberType)
          }
        }
        setFiberRenderRequired(false)
      }
    }
    function createMapObject(path, name, fiberType) {
      let strokeColor = fiberType === 'DISTRIBUTION' ? '#FF0000' : '#1700ff'
      let strokeWeight = fiberType === 'DISTRIBUTION' ? 2 : 4
      let selected = false

      // set color purple if there are annotations
      if (fiberAnnotations[name]) strokeColor = '#a73cff'

      // set color pink, increase stroke and set selected true if selected
      if (selectedFiberNames.includes(name)) {
        strokeColor = '#ff55da'
        strokeWeight = 5
        selected = true
      }

      const newMapObject = new google.maps.Polyline({
        selected,
        name,
        path,
        clickable: fiberType === 'FEEDER',
        map: googleMaps,
        zIndex: constants.Z_INDEX_MAP_OBJECT,
        strokeColor,
        strokeOpacity: 1.0,
        strokeWeight,
      })
      mapObjects.push(newMapObject)

      newMapObject.addListener('click', (event) => {
        const { shiftKey } = event.domEvent // Bool, true if shift key is held down
        const selectedFiberNames = []

        if (shiftKey) {
          // loop to find all other selected routes if shift key is held
          mapObjects.forEach((mapObject) => {
            // if selected and not the clicked route add to redux selected list
            // This is because if I pull selected from state it will be stale
            if (mapObject.selected && mapObject.name !== name) {
              selectedFiberNames.push(mapObject.name)
            }
          })
          // if the clicked route was not selected, add it to selected state
          if (!newMapObject.selected) {
            selectedFiberNames.push(newMapObject.name)
          }
        } else {
          // if other routes are selected or none are selected still select the clicked route
          if (mapObjects.some((mapObject) => mapObject.selected && mapObject.name !== name)
              || !newMapObject.selected) {
            // adds clicked route to selected
            selectedFiberNames.push(newMapObject.name)
          }
        }
        // if not already selected, add to selected

        setSelectedFiber(selectedFiberNames)
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
  selectedFiberNames: state.planEditor.selectedFiber,
  fiberAnnotations: state.planEditor.fiberAnnotations,
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
