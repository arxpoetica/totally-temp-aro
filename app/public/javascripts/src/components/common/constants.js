// File to hold the various constants used throughout the application.

var Constants = Object.freeze({

  // Map tile size in pixels
  TILE_SIZE: 256,

  // Drag-and-drop editing on map
  DRAG_DROP_ENTITY_KEY: 'entity_type',
  DRAG_DROP_ENTITY_DETAILS_KEY: 'entity_details',
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
})

export default Constants
