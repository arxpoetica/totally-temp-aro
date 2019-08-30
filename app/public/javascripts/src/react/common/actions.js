const Actions = Object.freeze({

  // Context menu
  CONTEXT_MENU_SHOW: 'CONTEXT_MENU_SHOW',
  CONTEXT_MENU_HIDE: 'CONTEXT_MENU_HIDE',
  CONTEXT_MENU_SET_ITEMS: 'CONTEXT_MENU_SET_ITEMS',

  // Configuration
  CONFIGURATION_SET_CONFIGURATION: 'CONFIGURATION_SET_CONFIGURATION',
  CONFIGURATION_SET_ASSET_KEYS: 'CONFIGURATION_SET_ASSET_KEYS',
  CONFIGURATION_SET_STYLEVALUES: 'CONFIGURATION_SET_STYLEVALUES',
  CONFIGURATION_SET_PERSPECTIVE: 'CONFIGURATION_SET_PERSPECTIVE',
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
  COVERAGE_SET_EXISTING_FIBER: 'COVERAGE_SET_EXISTING_FIBER',
  COVERAGE_SET_PLANNED_FIBER: 'COVERAGE_SET_PLANNED_FIBER',
  COVERAGE_SET_SITE_ASSIGNMENT: 'COVERAGE_SET_SITE_ASSIGNMENT',

  // Full screen container
  FULL_SCREEN_SHOW_HIDE_CONTAINER: 'FULL_SCREEN_SHOW_HIDE_CONTAINER',

  // Map
  MAP_SET_GOOGLE_MAPS_REFERENCE: 'MAP_SET_GOOGLE_MAPS_REFERENCE',
  MAP_SET_SELECTED_FEATURES: 'MAP_SET_SELECTED_FEATURES',

  // Map layer
  LAYERS_SET_LOCATION: 'LAYERS_SET_LOCATION',
  LAYERS_SET_NETWORK_EQUIPMENT: 'LAYERS_SET_NETWORK_EQUIPMENT',
  LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY: 'LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY',
  LAYERS_SET_CABLE_CONDUIT_VISIBILITY: 'LAYERS_SET_CABLE_CONDUIT_VISIBILITY',
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

  // Plan
  PLAN_SET_ACTIVE_PLAN: 'PLAN_SET_ACTIVE_PLAN',
  PLAN_SET_ACTIVE_PLAN_STATE: 'PLAN_SET_ACTIVE_PLAN_STATE',
  PLAN_SET_DATA_ITEMS: 'PLAN_SET_DATA_ITEMS',
  PLAN_SET_SELECTED_DATA_ITEMS: 'PLAN_SET_SELECTED_DATA_ITEMS',
  PLAN_SET_ALL_LIBRARY_ITEMS: 'PLAN_SET_ALL_LIBRARY_ITEMS',

  // Plan editor
  PLAN_EDITOR_CLEAR_TRANSACTION: 'PLAN_EDITOR_CLEAR_TRANSACTION',
  PLAN_EDITOR_SET_TRANSACTION: 'PLAN_EDITOR_SET_TRANSACTION',
  PLAN_EDITOR_ADD_EQUIPMENT_NODES: 'PLAN_EDITOR_ADD_EQUIPMENT_NODES',
  PLAN_EDITOR_MODIFY_EQUIPMENT_NODES: 'PLAN_EDITOR_MODIFY_EQUIPMENT_NODES',
  PLAN_EDITOR_REMOVE_TRANSACTION_FEATURE: 'PLAN_EDITOR_REMOVE_TRANSACTION_FEATURE',
  PLAN_EDITOR_ADD_EQUIPMENT_BOUNDARY: 'PLAN_EDITOR_ADD_EQUIPMENT_BOUNDARY',
  PLAN_EDITOR_MODIFY_EQUIPMENT_BOUNDARIES: 'PLAN_EDITOR_MODIFY_EQUIPMENT_BOUNDARY',
  PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR: 'PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR',
  PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS: 'PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS',
  PLAN_EDITOR_SET_IS_CREATING_OBJECT: 'PLAN_EDITOR_SET_IS_CREATING_OBJECT',
  PLAN_EDITOR_SET_IS_MODIFYING_OBJECT: 'PLAN_EDITOR_SET_IS_MODIFYING_OBJECT',
  PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP: 'PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP',

  // RFP Analysis
  RFP_START_ANALYSIS: 'RFP_START_ANALYSIS',
  RFP_CLEAR_STATE: 'RFP_CLEAR_STATE',
  RFP_ADD_TARGETS: 'RFP_ADD_TARGETS',
  RFP_REMOVE_TARGET: 'RFP_REMOVE_TARGET',
  RFP_REPLACE_TARGET: 'RFP_REPLACE_TARGET',
  RFP_SET_STATUS: 'RFP_SET_STATUS',
  RFP_SET_PLANS: 'RFP_SET_PLANS',
  RFP_SET_PLAN_LIST_OFFSET: 'RFP_SET_PLAN_LIST_OFFSET',
  RFP_SHOW_HIDE_ALL_RFP_STATUS: 'RFP_SHOW_HIDE_ALL_RFP_STATUS',
  RFP_SET_CLICK_MAP_TO_ADD_TARGET: 'RFP_SET_CLICK_MAP_TO_ADD_TARGET',
  RFP_SET_SELECTED_TARGET: 'RFP_SET_SELECTED_TARGET',
  RFP_SET_IS_LOADING_RFP_PLANS: 'RFP_SET_IS_LOADING_RFP_PLANS',
  RFP_SET_SELECTED_TAB_ID: 'RFP_SET_SELECTED_TAB',
  RFP_SET_TEMPLATES: 'RFP_SET_TEMPLATES',
  RFP_SET_SELECTED_TEMPLATE_ID: 'RFP_SET_SELECTED_TEMPLATE_ID',
  RFP_SET_IS_SUBMITTING_RESULT: 'RFP_SET_IS_SUBMITTING_RESULT',
  RFP_SET_SUBMIT_RESULT: 'RFP_SET_SUBMIT_RESULT',
  RFP_START_DOWNLOADING_REPORT: 'RFP_START_DOWNLOADING_REPORT',
  RFP_END_DOWNLOADING_REPORT: 'RFP_END_DOWNLOADING_REPORT',

  // Selection
  SELECTION_SET_ACTIVE_MODE: 'SELECTION_SET_ACTIVE_MODE',
  SELECTION_CLEAR_ALL_PLAN_TARGETS: 'SELECTION_CLEAR_ALL_PLAN_TARGETS',
  SELECTION_ADD_PLAN_TARGETS: 'SELECTION_ADD_PLAN_TARGETS',
  SELECTION_REMOVE_PLAN_TARGETS: 'SELECTION_REMOVE_PLAN_TARGETS',
  SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS: 'SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS',
  SELECTION_SET_PLAN_EDITOR_FEATURES: 'SELECTION_SET_PLAN_EDITOR_FEATURES',

  // User
  USER_SET_LOGGED_IN_USER: 'USER_SET_LOGGED_IN_USER',
  USER_GET_SUPERUSER_FLAG: 'USER_GET_SUPERUSER_FLAG',
  USER_SET_SUPERUSER_FLAG: 'USER_SET_SUPERUSER_FLAG',
  USER_SET_SYSTEM_ACTORS: 'USER_SET_SYSTEM_ACTORS',

  // Broadcast
  BROADCAST_ACTION: 'BROADCAST_ACTION',

  // Ring Edit
  RING_SET_ANALYSIS_STATUS: 'RING_SET_ANALYSIS_STATUS',
  RING_SET_ANALYSIS_PROGRESS: 'RING_SET_ANALYSIS_PROGRESS',
  RING_SET_ANALYSIS_REPORT: 'RING_SET_ANALYSIS_REPORT',
  RING_SET_SELECTED_RING_ID: 'RING_SET_SELECTED_RING_ID',
  RING_ADD_RINGS: 'RING_ADD_RINGS',
  RING_REMOVE_RING: 'RING_REMOVE_RING',
  RING_REMOVE_ALL_RINGS: 'RING_REMOVE_ALL_RINGS',
  RING_UPDATE_RING: 'RING_UPDATE_RING'

})

export default Actions
