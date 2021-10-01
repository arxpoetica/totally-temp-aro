// FIXME: how to use get `state.configuration.system.ARO_CLIENT` in a constant like this
// build replace plugin?
const ARO_CLIENT = 'aro'

export const constants = Object.freeze({
  Z_INDEX_SELECTION: 1,
  Z_INDEX_MAP_OBJECT: 2,
  Z_INDEX_PIN: 3,

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

})
