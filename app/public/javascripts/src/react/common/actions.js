const Actions = Object.freeze({

  // Plan
  PLAN_SET_PLAN: 'PLAN_SET_PLAN',

  // Coverage
  COVERAGE_SET_DETAILS: 'COVERAGE_SET_DETAILS',
  COVERAGE_SET_STATUS: 'UPDATE_COVERAGE_STATUS',
  COVERAGE_SET_REPORT: 'COVERAGE_SET_REPORT',
  COVERAGE_SET_INIT_PARAMS: 'COVERAGE_SET_INIT_PARAMS',
  COVERAGE_SET_PROGRESS: 'COVERAGE_SET_PROGRESS',
  COVERAGE_SET_COVERAGE_TYPE: 'COVERAGE_SET_COVERAGE_TYPE',
  COVERAGE_SET_SAVE_SITE_COVERAGE: 'COVERAGE_SET_SAVE_SITE_COVERAGE',
  COVERAGE_SET_LIMIT_MARKETABLE_TECHNOLOGIES: 'COVERAGE_SET_LIMIT_MARKETABLE_TECH',
  COVERAGE_SET_LIMIT_MAX_SPEED: 'COVERAGE_SET_LIMIT_MAX_SPEED',
  COVERAGE_SET_SITE_ASSIGNMENT: 'COVERAGE_SET_SITE_ASSIGNMENT',

  // Map layer
  LAYERS_SET_LOCATION: 'LAYERS_SET_LOCATION',
  LAYERS_SET_BOUNDARY: 'LAYERS_SET_BOUNDARY',
  LAYERS_SET_VISIBILITY: 'LAYERS_SET_VISIBILITY',

  // Selection
  SELECTION_SET_ACTIVE_MODE: 'SELECTION_SET_ACTIVE_MODE',

  // User
  USER_SET_LOGGED_IN_USER: 'USER_SET_LOGGED_IN_USER',
  USER_GET_SUPERUSER_FLAG: 'USER_GET_SUPERUSER_FLAG',
  USER_SET_SUPERUSER_FLAG: 'USER_SET_SUPERUSER_FLAG',

  // Websocket communication with server
  SOCKET_SUBSCRIBE_TO_ROOM: 'SOCKET_SUBSCRIBE_TO_ROOM'

})

export default Actions