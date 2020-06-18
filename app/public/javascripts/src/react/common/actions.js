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
  COVERAGE_ADD_BOUNDARY_COVERAGE: 'COVERAGE_ADD_BOUNDARY_COVERAGE',
  COVERAGE_CLEAR_BOUNDARY_COVERAGE: 'COVERAGE_CLEAR_BOUNDARY_COVERAGE',
  COVERAGE_SET_BOUNDARY_COVERAGE_VISIBILITY: 'COVERAGE_SET_BOUNDARY_COVERAGE_VISIBILITY',

  // Full screen container
  FULL_SCREEN_SHOW_HIDE_CONTAINER: 'FULL_SCREEN_SHOW_HIDE_CONTAINER',

  // Map
  MAP_SET_GOOGLE_MAPS_REFERENCE: 'MAP_SET_GOOGLE_MAPS_REFERENCE',
  MAP_SET_SELECTED_FEATURES: 'MAP_SET_SELECTED_FEATURES',
  MAP_SET_ZOOM: 'MAP_SET_ZOOM',

  // Map layer
  LAYERS_SET_LOCATION: 'LAYERS_SET_LOCATION',
  LAYERS_SET_NETWORK_EQUIPMENT: 'LAYERS_SET_NETWORK_EQUIPMENT',
  LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY: 'LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY',
  LAYERS_SET_CABLE_CONDUIT_VISIBILITY: 'LAYERS_SET_CABLE_CONDUIT_VISIBILITY',
  LAYERS_SET_CONSTRUCTION_SITE: 'LAYERS_SET_CONSTRUCTION_SITE',
  LAYERS_SET_BOUNDARY: 'LAYERS_SET_BOUNDARY',
  LAYERS_SET_ALL_VISIBILITY: 'LAYERS_SET_ALL_VISIBILITY',
  LAYERS_SET_VISIBILITY_BY_KEY: 'LAYERS_SET_VISIBILITY_BY_KEY',
  LAYERS_SET_VISIBILITY: 'LAYERS_SET_VISIBILITY',
  LAYERS_SET_SELECTED_BOUNDARY_TYPE: 'LAYERS_SET_SELECTED_BOUNDARY_TYPE',
  LAYERS_SET_BOUNDARY_TYPES: 'LAYERS_SET_BOUNDARY_TYPES',
  LAYERS_SET_SITE_BOUNDARY: 'LAYERS_SET_SITE_BOUNDARY',
  LAYERS_SET_ANNOTATIONS: 'LAYERS_SET_ANNOTATIONS',
  LAYERS_ADD_ANNOTATION: 'LAYERS_ADD_ANNOTATION',
  LAYERS_UPDATE_ANNOTATION: 'LAYERS_UPDATE_ANNOTATION',
  LAYERS_REMOVE_ANNOTATION: 'LAYERS_REMOVE_ANNOTATION',
  LAYERS_CLEAR_OLD_ANNOTATIONS: 'LAYERS_CLEAR_OLD_ANNOTATIONS',

  // Map Reports
  MAP_REPORTS_SET_IS_COMMUNICATING: 'MAP_REPORTS_SET_IS_COMMUNICATING',
  MAP_REPORTS_SET_IS_DOWNLOADING: 'MAP_REPORTS_SET_IS_DOWNLOADING',
  MAP_REPORTS_SET_PAGES: 'MAP_REPORTS_SET_PAGES',
  MAP_REPORTS_SET_SHOW_MAP_OBJECTS: 'MAP_REPORTS_SET_SHOW_MAP_OBJECTS',
  MAP_REPORTS_SET_SHOW_PAGE_NUMBERS: 'MAP_REPORTS_SET_SHOW_PAGE_NUMBERS',
  MAP_REPORTS_SET_ACTIVE_PAGE_UUID: 'MAP_REPORTS_SET_ACTIVE_PAGE_UUID',
  MAP_REPORTS_SET_EDITING_PAGE_INDEX: 'MAP_REPORTS_SET_EDITING_PAGE_INDEX',
  MAP_REPORTS_CLEAR: 'MAP_REPORTS_CLEAR',

  // Network analysis
  NETWORK_ANALYSIS_SET_CONNECTIVITY: 'NETWORK_ANALYSIS_SET_CONNECTIVITY',
  NETWORK_ANALYSIS_SET_CONSTRAINTS: 'NETWORK_ANALYSIS_SET_CONSTRAINTS',
  NETWORK_ANALYSIS_SET_PRIMARY_SPATIAL_EDGE: 'NETWORK_ANALYSIS_SET_PRIMARY_SPATIAL_EDGE',
  NETWORK_ANALYSIS_SET_CHART_REPORT: 'NETWORK_ANALYSIS_SET_CHART_REPORT',
  NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA: 'NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA',
  NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION: 'NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION',
  NETWORK_ANALYSIS_CLEAR_WORMHOLE_FUSE_DEFINITION: 'NETWORK_ANALYSIS_CLEAR_WORMHOLE_FUSE_DEFINITION',
  NETWORK_ANALYSIS_SET_WORMHOLE_FUSE_DEFINITION: 'NETWORK_ANALYSIS_SET_WORMHOLE_FUSE_DEFINITION',

  // Network optimization
  NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS: 'NETWORK_OPTIMIZATION_SET_OPTIMIZATION_INPUTS',
  NETWORK_OPTIMIZATION_SET_ANALYSIS_TYPE: 'NETWORK_OPTIMIZATION_SET_ANALYSIS_TYPE',
  NETWORK_OPTIMIZATION_SET_LOCATION_TYPE: 'NETWORK_OPTIMIZATION_SET_LOCATION_TYPE',
  NETWORK_OPTIMIZATION_SET_IS_CANCELING: 'NETWORK_OPTIMIZATION_SET_IS_CANCELING',
  NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID: 'NETWORK_OPTIMIZATION_SET_OPTIMIZATION_ID',
  NETWORK_OPTIMIZATION_CLEAR_OPTIMIZATION_ID: 'NETWORK_OPTIMIZATION_CLEAR_OPTIMIZATION_ID',

  // Optimization reports
  OPTIMIZATION_REPORTS_SET_REPORTS_METADATA: 'OPTIMIZATION_REPORTS_SET_REPORTS_METADATA',
  OPTIMIZATION_REPORTS_CLEAR_OUTPUT: 'OPTIMIZATION_REPORTS_CLEAR_OUTPUT',
  OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL: 'OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL',
  OPTIMIZATION_REPORTS_SET_IS_DOWNLOADING: 'OPTIMIZATION_REPORTS_SET_IS_DOWNLOADING',

  // Plan
  PLAN_SET_ACTIVE_PLAN: 'PLAN_SET_ACTIVE_PLAN',
  PLAN_SET_ACTIVE_PLAN_STATE: 'PLAN_SET_ACTIVE_PLAN_STATE',
  PLAN_SET_DATA_ITEMS: 'PLAN_SET_DATA_ITEMS',
  PLAN_SET_SELECTED_DATA_ITEMS: 'PLAN_SET_SELECTED_DATA_ITEMS',
  PLAN_SET_ALL_LIBRARY_ITEMS: 'PLAN_SET_ALL_LIBRARY_ITEMS',
  PLAN_SET_HAVE_DATA_ITEMS_CHANGED: 'PLAN_SET_HAVE_DATA_ITEMS_CHANGED',

  // Plan editor
  PLAN_EDITOR_CLEAR_TRANSACTION: 'PLAN_EDITOR_CLEAR_TRANSACTION',
  PLAN_EDITOR_SET_TRANSACTION: 'PLAN_EDITOR_SET_TRANSACTION',
  PLAN_EDITOR_ADD_FEATURES: 'PLAN_EDITOR_ADD_FEATURES',
  PLAN_EDITOR_MODIFY_FEATURES: 'PLAN_EDITOR_MODIFY_FEATURES',
  PLAN_EDITOR_DELETE_TRANSACTION_FEATURE: 'PLAN_EDITOR_DELETE_TRANSACTION_FEATURE',
  PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR: 'PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR',
  PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS: 'PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS',
  PLAN_EDITOR_SET_IS_CREATING_OBJECT: 'PLAN_EDITOR_SET_IS_CREATING_OBJECT',
  PLAN_EDITOR_SET_IS_MODIFYING_OBJECT: 'PLAN_EDITOR_SET_IS_MODIFYING_OBJECT',
  PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP: 'PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP',
  PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES: 'PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES',
  PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION: 'PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION',
  PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION: 'PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION',

  // Resource Manager
  RESOURCE_MANAGER_SET_MANAGER_DEFINITION: 'RESOURCE_MANAGER_SET_MANAGER_DEFINITION',
  RESOURCE_MANAGER_SET_EDITING_MODE: 'RESOURCE_MANAGER_SET_EDITING_MODE',
  RESOURCE_MANAGER_SET_EDITING_MANAGER: 'RESOURCE_MANAGER_SET_EDITING_MANAGER_ID',
  RESOURCE_MANAGER_CLEAR_ALL: 'RESOURCE_MANAGER_CLEAR_ALL',
  RESOURCE_MANAGER_SET_CONNECTIVITY_DEFINITION: 'RESOURCE_MANAGER_SET_CONNECTIVITY_DEFINITION',
  RESOURCE_MANAGER_SET_PRIMARY_SPATIAL_EDGE: 'RESOURCE_MANAGER_SET_PRIMARY_SPATIAL_EDGE',
  RESOURCE_MANAGER_SET_WORMHOLE_FUSE_DEFINITION: 'RESOURCE_MANAGER_SET_WORMHOLE_FUSE_DEFINITION',

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
  SELECTION_SET_LOCATIONS: 'SELECTION_SET_LOCATIONS',
  SELECTION_SET_PLAN_EDITOR_FEATURES: 'SELECTION_SET_PLAN_EDITOR_FEATURES',

  // Tool
  TOOL_SET_TOOLBOX_VISIBILITY: 'TOOL_SET_TOOLBOX_VISIBILITY',
  TOOL_SET_ACTIVE_TOOL: 'TOOL_SET_ACTIVE_TOOL',

  // User
  USER_SET_LOGGED_IN_USER: 'USER_SET_LOGGED_IN_USER',
  USER_UPDATE_USER: 'USER_UPDATE_USER',
  USER_GET_SUPERUSER_FLAG: 'USER_GET_SUPERUSER_FLAG',
  USER_SET_SYSTEM_ACTORS: 'USER_SET_SYSTEM_ACTORS',
  USER_SET_AUTH_ROLES: 'USER_SET_AUTH_ROLES',
  USER_SET_AUTH_PERMISSIONS: 'USER_SET_AUTH_PERMISSIONS',
  USER_SET_CONFIGURATION: 'USER_SET_CONFIGURATION',
  USER_PROJECT_TEMPLATES: 'USER_PROJECT_TEMPLATES',
  USER_SET_GROUP: 'USER_SET_GROUP',
  USER_SET_USERLIST: 'USER_SET_USERLIST',
  USER_SET_SEND_MAIL_FLAG:'USER_SET_SEND_MAIL_FLAG',
  USER_SET_NEW_USER_FLAG: 'USER_SET_NEW_USER_FLAG',
  USER_HANDLE_PAGE_CLICK: 'USER_HANDLE_PAGE_CLICK',
  USER_SEARCH_USERS: 'USER_SEARCH_USERS',

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
  RING_UPDATE_RING: 'RING_UPDATE_RING',

  // Location Info
  LOCATION_INFO_SET_DETAILS: 'LOCATION_INFO_SET_DETAILS',
  LOCATION_INFO_SET_AUDIT_LOG: 'LOCATIONINFO_SHOW_AUDIT_LOG',

  // Access Control Lists
  ACL_SET_ACL: 'ACL_SET_ACL',

  // Project Template
  PROJECT_SET_CURRENT_PROJECT_TEMPLATE_ID: 'PROJECT_SET_CURRENT_PROJECT_TEMPLATE_ID',

  // Global Settings
  GLOBAL_SETTINGS_GET_RELEASE_NOTES: 'GLOBAL_SETTINGS_GET_RELEASE_NOTES',
  GLOBAL_SETTINGS_GET_OTP_STATUS: 'GLOBAL_SETTINGS_GET_OTP_STATUS',
  GLOBAL_SETTINGS_OVERWRITE_SECRET: 'GLOBAL_SETTINGS_OVERWRITE_SECRET',
  GLOBAL_SETTINGS_SHOW_SECRET: 'GLOBAL_SETTINGS_SHOW_SECRET',
  GLOBAL_SETTINGS_SEND_EMAIL_OTP: 'GLOBAL_SETTINGS_SEND_EMAIL_OTP',
  GLOBAL_SETTINGS_VERIFY_SECRET: 'GLOBAL_SETTINGS_VERIFY_SECRET',
  GLOBAL_SETTINGS_ERROR_SECRET: 'GLOBAL_SETTINGS_ERROR_SECRET',
  GLOBAL_SETTINGS_DISABLE_AUTH: 'GLOBAL_SETTINGS_DISABLE_AUTH',
  GLOBAL_SETTINGS_LOAD_PERMISSIONS:'GLOBAL_SETTINGS_LOAD_PERMISSIONS',
  GLOBAL_SETTINGS_LOAD_ACL: 'GLOBAL_SETTINGS_LOAD_ACL',
  GLOBAL_SETTINGS_LOAD_GROUPS: 'GLOBAL_SETTINGS_LOAD_GROUPS',
  GLOBAL_SETTINGS_RELOAD_GROUPS: 'GLOBAL_SETTINGS_RELOAD_GROUPS',
  GLOBAL_SETTINGS_ADD_GROUP: 'GLOBAL_SETTINGS_ADD_GROUP',
  GLOBAL_SETTINGS_EDIT_GROUP: 'GLOBAL_SETTINGS_EDIT_GROUP',
  GLOBAL_SETTINGS_SAVE_GROUP: 'GLOBAL_SETTINGS_SAVE_GROUP',
  GLOBAL_SETTINGS_DELETE_GROUP: 'GLOBAL_SETTINGS_DELETE_GROUP',
  GLOBAL_SETTINGS_LOAD_TAGS: 'GLOBAL_SETTINGS_LOAD_TAGS',
  GLOBAL_SETTINGS_TAG_FLAG: 'GLOBAL_SETTINGS_TAG_FLAG',
    
  // ETL Template
  ETL_TEMPLATE_GET_BY_TYPE: 'ETL_TEMPLATE_GET_BY_TYPE',
  ETL_TEMPLATE_CONFIG_VIEW: 'ETL_TEMPLATE_CONFIG_VIEW'
})

export default Actions
