/* globals google */
import { useEffect } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import { constants } from './shared'
import PlanEditorActions from './plan-editor-actions'

let renderedSubnetId = ''
let mapObjects = []

export const FiberMapObjects = (props) => {
  const { selectedSubnetId, subnets, subnetFeatures, fiberRenderRequired, setFiberRenderRequired, googleMaps } = props

  useEffect(() => {
    if (subnets[selectedSubnetId]){
      const { subnetLinks, fiberType } = subnets[selectedSubnetId].fiber

      // don'r render if fiber is the same
      // fiber Renderrequired being true means the fiber should be rendered regardless
      if (renderedSubnetId !== selectedSubnetId || fiberRenderRequired) {
        renderedSubnetId = selectedSubnetId
        renderFiber(subnetLinks, fiberType)
      }
    } else if (
      subnetFeatures[selectedSubnetId]
      && subnets[subnetFeatures[selectedSubnetId].subnetId]
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
      if (subnetLinks){
        for (const subnetLink of subnetLinks) {
          const { geometry } = subnetLink
          if (geometry.type === 'LineString') {
            const path = WktUtils.getGoogleMapPathsFromWKTLineString(geometry)
            createMapObject(path, fiberType)
          } else if (geometry.type === 'MultiLineString') {
            const path = WktUtils.getGoogleMapPathsFromWKTMultiLineString(geometry)
            createMapObject(path, fiberType)
          }
        }
        setFiberRenderRequired(false)
      }
      
    }
    function createMapObject(path, fiberType) {
      const mapObject = new google.maps.Polyline({
        path,
        clickable: false,
        map: googleMaps,
        zIndex: constants.Z_INDEX_MAP_OBJECT,
        strokeColor: fiberType === 'DISTRIBUTION' ? '#FF0000' : '#1700ff',
        strokeOpacity: 1.0,
        strokeWeight: fiberType === 'DISTRIBUTION' ? 2 : 4,
      })
      mapObjects.push(mapObject)
    }
    
  }, [selectedSubnetId, subnets, subnetFeatures, fiberRenderRequired, setFiberRenderRequired, googleMaps, deleteMapObjects])

  // cleanup
  useEffect(() => () => deleteMapObjects(), [])

  function deleteMapObjects() {
    if (mapObjects.length) {
      mapObjects.forEach(mapObject => mapObject.setMap(null))
      mapObjects = []
    }
  }

  // No ui, only handles mapObjects
  return null
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
  selectedSubnetId: state.planEditor.selectedSubnetId,
  subnets: state.planEditor.subnets,
  subnetFeatures: state.planEditor.subnetFeatures,
  fiberRenderRequired: state.planEditor.fiberRenderRequired,
})

const mapDispatchToProps = dispatch => ({
  setFiberRenderRequired: (bool) => dispatch(PlanEditorActions.setFiberRenderRequired(bool))
})

const FiberMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(FiberMapObjects)
export default FiberMapObjectsComponent
