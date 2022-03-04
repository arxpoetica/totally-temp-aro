// FIXME: how to use get `state.configuration.system.ARO_CLIENT` in a constant like this
// build replace plugin?
const ARO_CLIENT = 'aro'

export const constants = Object.freeze({
  Z_INDEX_CO_SUBNET: 5,
  Z_INDEX_HUB_SUBNET: 6,
  Z_INDEX_SELECTION: 10,
  Z_INDEX_MAP_OBJECT: 20,
  Z_INDEX_PIN: 30,

  // Construction Area Constants
  BLOCKER: {
    COST_MULTIPLIER: 1000,
    PRIORITY: 5,
    KEY: "Avoid" 
  },
  INCLUSION: {
    COST_MULTIPLIER: 0,
    PRIORITY: 2,
    KEY: "Include"
  },

  // Drag-and-drop editing on map
  // TODO: go through and figure out what is used and what is not
  DRAG_DROP_ENTITY_KEY: 'entity_type',
  DRAG_DROP_ENTITY_DETAILS_KEY: 'entity_details',
  DRAG_DROP_NETWORK_EQUIPMENT: 'networkEquipment',
  DRAG_IS_BOUNDARY: 'dragged_object_is_a_boundary',
  SPATIAL_EDGE_ROAD: 'road',
  SPATIAL_EDGE_COPPER: 'copper',
  MAP_OBJECT_CREATE_KEY_NETWORK_NODE_TYPE: 'MAP_OBJECT_CREATE_KEY_NETWORK_NODE_TYPE',
  MAP_OBJECT_CREATE_KEY_OBJECT_ID: 'MAP_OBJECT_CREATE_KEY_OBJECT_ID',
  MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY: 'MAP_OBJECT_CREATE_KEY_EQUIPMENT_BOUNDARY',
  MAP_OBJECT_CREATE_SERVICE_AREA: 'MAP_OBJECT_CREATE_SERVICE_AREA',
  DRAG_DROP_GRAB_OFFSET_X: 'grabOffsetX',
  DRAG_DROP_GRAB_OFFSET_Y: 'grabOffsetY',
  DRAG_DROP_GRAB_ICON_W: 'grabIconW',
  DRAG_DROP_GRAB_ICON_H: 'grabIconH',

  ALERT_TYPES: {
    // location alerts
    ABANDONED_LOCATION: {
      key: 'ABANDONED_LOCATION',
      displayName: 'Abandoned Location',
      // FIXME: move to proper location
      iconUrl: '/svg/alert-panel-location.svg',
    },
    // terminal alerts
    MAX_TERMINAL_HOMES_EXCEEDED: {
      key: 'MAX_TERMINAL_HOMES_EXCEEDED',
      displayName: 'Maximum Terminal Homes Exceeded',
      iconUrl: `/images/map_icons/${ARO_CLIENT}/equipment/fiber_distribution_terminal_alert.svg`,
    },
    MAX_DROP_LENGTH_EXCEEDED: {
      key: 'MAX_DROP_LENGTH_EXCEEDED',
      displayName: 'Drop Cable Length Exceeded',
      iconUrl: '/svg/alert-panel-location.svg',
    },
    // TODO: is this even a thing?
    // MAX_TERMINAL_DISTANCE_EXCEEDED: {
    //   key: 'MAX_TERMINAL_DISTANCE_EXCEEDED',
    //   displayName: 'Maximum Terminal Distance Exceeded',
    //   iconUrl: `/images/map_icons/${ARO_CLIENT}/equipment/fiber_distribution_terminal_alert.svg`,
    // },
    // hub alerts
    MAX_HUB_HOMES_EXCEEDED: {
      key: 'MAX_HUB_HOMES_EXCEEDED',
      displayName: 'Maximum Hub Homes Exceeded',
      iconUrl: `/images/map_icons/${ARO_CLIENT}/equipment/fiber_distribution_hub_alert.svg`,
    },
    MAX_HUB_DISTANCE_EXCEEDED: {
      key: 'MAX_HUB_DISTANCE_EXCEEDED',
      displayName: 'Maximum Hub Distance Exceeded',
      iconUrl: `/images/map_icons/${ARO_CLIENT}/equipment/fiber_distribution_hub_alert.svg`,
    },
  },

  DRAFT_STATES: {
    START_INITIALIZATION: 'START_INITIALIZATION',
    INITIAL_STRUCTURE_UPDATE: 'INITIAL_STRUCTURE_UPDATE',
    START_SUBNET_TREE: 'START_SUBNET_TREE',
    SUBNET_NODE_SYNCED: 'SUBNET_NODE_SYNCED',
    END_SUBNET_TREE: 'END_SUBNET_TREE',
    END_INITIALIZATION: 'END_INITIALIZATION',
  },

})

const { DRAFT_STATES } = constants
export const isDraftLoadingOrLoaded = draftsState => {
  return (
    draftsState === DRAFT_STATES.START_SUBNET_TREE
    || draftsState === DRAFT_STATES.SUBNET_NODE_SYNCED
    || draftsState === DRAFT_STATES.END_SUBNET_TREE
    || draftsState === DRAFT_STATES.END_INITIALIZATION
  )
}

export const getIconUrl = (feature, { equipments, constructionAreas, locationAlerts, ARO_CLIENT }) => {
  const { objectId, networkNodeType, dataType } = feature
  let { iconUrl } = networkNodeType ? equipments[networkNodeType] : constructionAreas[dataType]
  const alert = locationAlerts[objectId]
  if (alert) {
    // FIXME: ...this is bad...it's a workaround hack...
    // we have slated at some point to work on all the icons
    // https://www.pivotaltracker.com/story/show/179782874
    // ...when we do, we should also fix this code.
    iconUrl = iconUrl
      .split('.').join('_alert.')
      .split(`/${ARO_CLIENT}/`).join(`/${ARO_CLIENT}/equipment/`)
  }
  return iconUrl
}
