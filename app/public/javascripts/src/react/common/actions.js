const Actions = Object.freeze({

  // Plan
  PLAN_SET_ACTIVE_PLAN: 'PLAN_SET_ACTIVE_PLAN',
  PLAN_SET_ACTIVE_PLAN_STATE: 'PLAN_SET_ACTIVE_PLAN_STATE',

  // Configuration
  CONFIGURATION_SET_CONFIGURATION: 'CONFIGURATION_SET_CONFIGURATION',
  CONFIGURATION_SET_ASSET_KEYS: 'CONFIGURATION_SET_ASSET_KEYS',
  CONFIGURATION_SET_STYLEVALUES: 'CONFIGURATION_SET_STYLEVALUES',
  CONFIGURATION_SET_REPORTS_METADATA: 'CONFIGURATION_SET_REPORTS_METADATA',
  CONFIGURATION_SET_EDITING_REPORT_ID: 'CONFIGURATION_SET_EDITING_REPORT_ID',
  CONFIGURATION_SET_EDITING_REPORT_DEFINITION: 'CONFIGURATION_SET_EDITING_REPORT_DEFINITION',
  CONFIGURATION_SET_EDITING_REPORT_PRIMARY_DEFINITION: 'CONFIGURATION_SET_EDITING_REPORT_PRIMARY_DEFINITION',
  CONFIGURATION_SET_EDITING_REPORT_TYPE: 'CONFIGURATION_SET_EDITING_REPORT_TYPE',
  CONFIGURATION_SET_EDITING_REPORT_SUBDEFINITION: 'CONFIGURATION_SET_EDITING_REPORT_SUBDEFINITION',
  CONFIGURATION_ADD_EDITING_REPORT_SUBDEFINITION: 'CONFIGURATION_ADD_EDITING_REPORT_SUBDEFINITION',
  CONFIGURATION_REMOVE_EDITING_REPORT_SUBDEFINITION: 'CONFIGURATION_REMOVE_EDITING_REPORT_SUBDEFINITION',
  CONFIGURATION_SET_REPORT_VALIDATION: 'CONFIGURATION_SET_REPORT_VALIDATION',
  CONFIGURATION_CLEAR_EDITING_REPORT: 'CONFIGURATION_CLEAR_EDITING_REPORT',
  CONFIGURATION_SET_REPORT_TYPES: 'CONFIGURATION_SET_REPORT_TYPES',

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

  // Network analysis
  NETWORK_ANALYSIS_SET_CHART_REPORT: 'NETWORK_ANALYSIS_SET_CHART_REPORT',
  NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA: 'NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA',
  NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION: 'NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION',

  // Optimization reports
  OPTIMIZATION_REPORTS_SET_REPORTS_METADATA: 'OPTIMIZATION_REPORTS_SET_REPORTS_METADATA',
  OPTIMIZATION_REPORTS_CLEAR_OUTPUT: 'OPTIMIZATION_REPORTS_CLEAR_OUTPUT',
  OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL: 'OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL',

  // RFP Analysis
  RFP_INITIALIZE: 'RFP_INITIALIZE',
  RFP_START_ANALYSIS: 'RFP_START_ANALYSIS',
  RFP_CLEAR_STATE: 'RFP_CLEAR_STATE',
  RFP_SHOW_HIDE_STATUS_MODAL: 'RFP_SHOW_HIDE_STATUS_MODAL',

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
