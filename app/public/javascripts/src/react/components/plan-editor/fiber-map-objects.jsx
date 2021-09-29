/* globals google */
import { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import { constants } from './constants'
import PlanEditorActions from './plan-editor-actions'

export const FiberMapObjects = (props) => {
  const { selectedSubnetId, subnets, subnetFeatures, fiberRenderRequired, setFiberRenderRequired, googleMaps } = props
  const renderedSubnet = useRef('')
  const mapObjects = useRef([])

  useEffect(() => {
    if (subnets[selectedSubnetId]){
      const { subnetLinks, fiberType } = subnets[selectedSubnetId].fiber

      // don'r render if fiber is the same
      // fiber Renderrequired being true means the fiber should be rendered regardless
      if (renderedSubnet.current !== selectedSubnetId || fiberRenderRequired) {
        renderedSubnet.current = selectedSubnetId
        renderFiber(subnetLinks, fiberType)
      }
    } 
    else if (subnetFeatures[selectedSubnetId]) {
      //if it is a terminal get parent id and render that fiber
      const { subnetId: parentId } = subnetFeatures[selectedSubnetId]
      const { subnetLinks, fiberType } = subnets[parentId].fiber

      if (renderedSubnet.current !== parentId || fiberRenderRequired) {
        renderedSubnet.current = parentId
        renderFiber(subnetLinks, fiberType)
      }
    }

    function renderFiber(subnetLinks, fiberType) {
      if (mapObjects.current.length) {
        deleteMapObject()
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
      mapObjects.current = [...mapObjects.current, mapObject]
    }
    
  }, [selectedSubnetId, subnets, subnetFeatures, fiberRenderRequired, setFiberRenderRequired, googleMaps, deleteMapObject])

  useEffect(() => {
    // cleanup
    return deleteMapObject()
  }, [])

  function deleteMapObject() {
    if (mapObjects.current.length) {
      mapObjects.current.forEach(mapObject => mapObject.setMap(null))
      mapObjects.current = []
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
