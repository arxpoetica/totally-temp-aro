import { useEffect } from 'react'
import { connect } from 'react-redux'
// import PlanEditorActions from '../plan-editor-actions'
import WktUtils from '../../../../shared-utils/wkt-utils'
// import PlanEditorSelectors from '../plan-editor-selectors'
import { constants, getIconUrl } from '../shared'

const EquipmentNode = props => {

  const { id, node, googleMaps, equipments } = props

  useEffect(() => {

    const options = {
      mouseoverTimer: null,
      position: WktUtils.getGoogleMapLatLngFromWKTPoint(node.point),
    // FIXME: ...this is bad...it's a workaround hack...
    // we have slated at some point to work on all the icons
    // https://www.pivotaltracker.com/story/show/179782874
    // ...when we do, we should also fix this code.
    // TODO:: use shared utility function getIconUrl which has alerts...???
      icon: { url: equipments[node.networkNodeType].iconUrl },
      // draggable: !feature.locked, // Allow dragging only if feature is not locked
      draggable: false,
      opacity: 0.4,
      map: googleMaps,
      zIndex: constants.Z_INDEX_MAP_OBJECT,
      optimized: !ARO_GLOBALS.MABL_TESTING,
    }
    // these two properties are for our convenience, not used by google maps
    options.type = 'equipment'
    if (id) options.id = id
    // // TODO: generecize this with Object
    // Object.assign(options, optionOverrides)

    const mapObject = new google.maps.Marker(options)

    mapObject.addListener('click', event => {
      // NOTE: this is a workaround to make sure we're selecting
      // equipment that might be piled on top of one another
      const selectionCircle = new google.maps.Circle({
        map: googleMaps,
        center: event.latLng,
        radius: 25,
        visible: false,
      })
      selectionCircle.setMap(null)
    })

    return () => { mapObject.setMap(null) }

  }, [])

  // no ui for this component
  return null
}

const mapStateToProps = state => ({
  googleMaps: state.map.googleMaps,
  equipments: state.mapLayers.networkEquipment.equipments,
  // constructionAreas: state.mapLayers.constructionAreas.construction_areas,
})
const mapDispatchToProps = dispatch => ({
})
export default connect(mapStateToProps, mapDispatchToProps)(EquipmentNode)
