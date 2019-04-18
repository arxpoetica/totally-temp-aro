const Actions = Object.freeze({

  // Plan
  PLAN_SET_PLAN: 'PLAN_SET_PLAN',

  // Configuration
  CONFIGURATION_SET_CONFIGURATION: 'CONFIGURATION_SET_CONFIGURATION',
  CONFIGURATION_SET_ASSET_KEYS: 'CONFIGURATION_SET_ASSET_KEYS',
  CONFIGURATION_SET_REPORTS_METADATA: 'CONFIGURATION_SET_REPORT_DEFINITIONS',
  CONFIGURATION_SET_EDITING_REPORT_ID: 'CONFIGURATION_SET_EDITING_REPORT_ID',
  CONFIGURATION_SET_EDITING_REPORT_DEFINITION: 'CONFIGURATION_SET_EDITING_REPORT_METADATA',
  CONFIGURATION_SET_EDITING_REPORT_PRIMARY_DEFINITION: 'CONFIGURATION_SET_EDITING_REPORT_PRIMARY_DEFINITION',
  CONFIGURATION_SET_EDITING_REPORT_SUBDEFINITION: 'CONFIGURATION_SET_EDITING_REPORT_SUBDEFINITION',

  // Coverage
  COVERAGE_SET_DETAILS: 'COVERAGE_SET_DETAILS',
  COVERAGE_SET_STATUS: 'UPDATE_COVERAGE_STATUS',
  COVERAGE_SET_REPORT: 'COVERAGE_SET_REPORT',
  COVERAGE_SET_INIT_PARAMS: 'COVERAGE_SET_INIT_PARAMS',
  COVERAGE_SET_PROGRESS: 'COVERAGE_SET_PROGRESS',
  COVERAGE_SET_COVERAGE_TYPE: 'COVERAGE_SET_COVERAGE_TYPE',
  COVERAGE_SET_GROUP_KEY_TYPE: 'COVERAGE_SET_GROUP_KEY_TYPE',
  COVERAGE_SET_LIMIT_MARKETABLE_TECHNOLOGIES: 'COVERAGE_SET_LIMIT_MARKETABLE_TECH',
  COVERAGE_SET_LIMIT_MAX_SPEED: 'COVERAGE_SET_LIMIT_MAX_SPEED',
  COVERAGE_SET_SITE_ASSIGNMENT: 'COVERAGE_SET_SITE_ASSIGNMENT',

  // Map layer
  LAYERS_SET_LOCATION: 'LAYERS_SET_LOCATION',
  LAYERS_SET_NETWORK_EQUIPMENT: 'LAYERS_SET_NETWORK_EQUIPMENT',
  LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY: 'LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY',
  LAYERS_SET_CONSTRUCTION_SITE: 'LAYERS_SET_CONSTRUCTION_SITE',
  LAYERS_SET_BOUNDARY: 'LAYERS_SET_BOUNDARY',
  LAYERS_SET_VISIBILITY: 'LAYERS_SET_VISIBILITY',
  LAYERS_SET_SELECTED_BOUNDARY_TYPE: 'LAYERS_SET_SELECTED_BOUNDARY_TYPE',
  LAYERS_SET_BOUNDARY_TYPES: 'LAYERS_SET_BOUNDARY_TYPES',
  LAYERS_SET_SITE_BOUNDARY: 'LAYERS_SET_SITE_BOUNDARY',

  // Selection
  SELECTION_SET_ACTIVE_MODE: 'SELECTION_SET_ACTIVE_MODE',
  SELECTION_CLEAR_ALL_PLAN_TARGETS: 'SELECTION_CLEAR_ALL_PLAN_TARGETS',
  SELECTION_ADD_PLAN_TARGETS: 'SELECTION_ADD_PLAN_TARGETS',
  SELECTION_REMOVE_PLAN_TARGETS: 'SELECTION_REMOVE_PLAN_TARGETS',
  SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS: 'SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS',

  // User
  USER_SET_LOGGED_IN_USER: 'USER_SET_LOGGED_IN_USER',
  USER_GET_SUPERUSER_FLAG: 'USER_GET_SUPERUSER_FLAG',
  USER_SET_SUPERUSER_FLAG: 'USER_SET_SUPERUSER_FLAG',

  // Broadcast
  BROADCAST_ACTION: 'BROADCAST_ACTION'

})

export default Actions
