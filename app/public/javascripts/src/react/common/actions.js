const Actions = Object.freeze({

  // Context menu
  CONTEXT_MENU_SHOW: 'CONTEXT_MENU_SHOW',
  CONTEXT_MENU_HIDE: 'CONTEXT_MENU_HIDE',
  CONTEXT_MENU_SET_ITEMS: 'CONTEXT_MENU_SET_ITEMS',

  // Configuration
  CONFIGURATION_SET_CONFIGURATION: 'CONFIGURATION_SET_CONFIGURATION',
  CONFIGURATION_SET_CLIENT_ID: 'CONFIGURATION_SET_CLIENT_ID',
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

  // Data edit
  DATA_SET_IS_EDIT_PROCESSING: 'DATA_SET_IS_EDIT_PROCESSING',
  DATA_DUCT_SET_SELECTED_DUCT_ID: 'DATA_DUCT_SET_SELECTED_DUCT_ID',
  DATA_DUCT_SET_DUCT: 'DATA_DUCT_SET_DUCT',
  DATA_DUCT_DELETE_DUCT: 'DATA_DUCT_DELETE_DUCT',
  DATA_DUCT_SET_DUCTS: 'DATA_DUCT_SET_DUCTS',

  // Full screen container
  FULL_SCREEN_SHOW_HIDE_CONTAINER: 'FULL_SCREEN_SHOW_HIDE_CONTAINER',

  // Map
  MAP_SET_GOOGLE_MAPS_REFERENCE: 'MAP_SET_GOOGLE_MAPS_REFERENCE',
  MAP_SET_SELECTED_FEATURES: 'MAP_SET_SELECTED_FEATURES',
  MAP_SET_ZOOM: 'MAP_SET_ZOOM',
  MAP_SET_REQUEST_SET_MAP_CENTER: 'MAP_SET_REQUEST_SET_MAP_CENTER',
  MAP_SET_MAP_TOOLS: 'MAP_SET_MAP_TOOLS',
  MAP_SET_LOCATION_LAYER_STATE: 'MAP_SET_LOCATION_LAYER_STATE',
  MAP_SET_ARE_TILES_RENDERING: 'MAP_SET_ARE_TILES_RENDERING',

  // Map layer
  LAYERS_SET_LOCATION: 'LAYERS_SET_LOCATION',
  LAYERS_SET_LOCATION_FILTERS: 'LAYERS_SET_LOCATION_FILTERS',
  LAYERS_SET_LOCATION_FILTER_CHECKED: 'LAYERS_SET_LOCATION_FILTER_CHECKED',
  LAYERS_SET_COPPER: 'LAYERS_SET_COPPER',
  LAYERS_SET_COPPER_VISIBILITY: 'LAYERS_SET_COPPER_VISIBILITY',
  LAYERS_SET_NETWORK_EQUIPMENT: 'LAYERS_SET_NETWORK_EQUIPMENT',
  LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY: 'LAYERS_SET_NETWORK_EQUIPMENT_VISIBILITY',
  LAYERS_SET_CONSTRUCTION_AREAS: 'LAYERS_SET_CONSTRUCTION_AREAS',
  LAYERS_SET_CONSTRUCTION_AREAS_VISIBILITY: 'LAYERS_SET_CONSTRUCTION_AREAS_VISIBILITY',
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
  LAYERS_SET_TYPE_VISIBILITY: 'LAYERS_SET_TYPE_VISIBILITY',
  LAYERS_SET_SHOW_SEGMENTS_BY_TAG: 'LAYERS_SET_SHOW_SEGMENTS_BY_TAG',
  LAYERS_SET_EDGE_CONSTRUCTION_TYPE_VISIBILITY: 'LAYERS_SET_EDGE_CONSTRUCTION_TYPE_VISIBILITY',
  LAYERS_SET_EDGE_CONSTRUCTION_TYPE_IDS: 'LAYERS_SET_EDGE_CONSTRUCTION_TYPE_IDS',
  LAYERS_SET_ACTIVE_MAP_LAYERS: 'LAYERS_SET_ACTIVE_MAP_LAYERS',
  LAYERS_SET_ANGULAR_MAP_LAYER_SUBSCRIBER: 'LAYERS_SET_ANGULAR_MAP_LAYER_SUBSCRIBER',
  LAYERS_SET_MAP_READY_PROMISE: 'LAYERS_SET_MAP_READY_PROMISE',

  // Map Reports
  MAP_REPORTS_SET_IS_COMMUNICATING: 'MAP_REPORTS_SET_IS_COMMUNICATING',
  MAP_REPORTS_SET_IS_DOWNLOADING: 'MAP_REPORTS_SET_IS_DOWNLOADING',
  MAP_REPORTS_SET_PAGES: 'MAP_REPORTS_SET_PAGES',
  MAP_REPORTS_SET_WAIT_TIME_PER_PAGE: 'MAP_REPORTS_SET_WAIT_TIME_PER_PAGE',
  MAP_REPORTS_SET_MANUAL_WAIT: 'MAP_REPORTS_SET_MANUAL_WAIT',
  MAP_REPORTS_SET_SHOW_MAP_OBJECTS: 'MAP_REPORTS_SET_SHOW_MAP_OBJECTS',
  MAP_REPORTS_SET_SHOW_PAGE_NUMBERS: 'MAP_REPORTS_SET_SHOW_PAGE_NUMBERS',
  MAP_REPORTS_SET_ACTIVE_PAGE_UUID: 'MAP_REPORTS_SET_ACTIVE_PAGE_UUID',
  MAP_REPORTS_SET_EDITING_PAGE_INDEX: 'MAP_REPORTS_SET_EDITING_PAGE_INDEX',
  MAP_REPORTS_CLEAR: 'MAP_REPORTS_CLEAR',
  MAP_REPORTS_SET_IS_REPORT_MODE: 'MAP_REPORTS_SET_IS_REPORT_MODE',

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
  NETWORK_OPTIMIZATION_SET_FILTERS: 'NETWORK_OPTIMIZATION_SET_FILTERS',
  NETWORK_OPTIMIZATION_SET_ACTIVE_FILTERS: 'NETWORK_OPTIMIZATION_SET_ACTIVE_FILTERS',
  NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING: 'NETWORK_OPTIMIZATION_SET_IS_PREVIEW_LOADING',
  NETWORK_OPTIMIZATION_ADD_ENUM_OPTIONS: 'NETWORK_OPTIMIZATION_ADD_ENUM_OPTIONS',

  // UI Notification
  NOTIFICATION_POST: 'NOTIFICATION_POST',
  NOTIFICATION_UPDATE: 'NOTIFICATION_UPDATE',
  NOTIFICATION_REMOVE: 'NOTIFICATION_REMOVE',

  // Optimization reports
  OPTIMIZATION_REPORTS_SET_REPORTS_METADATA: 'OPTIMIZATION_REPORTS_SET_REPORTS_METADATA',
  OPTIMIZATION_REPORTS_CLEAR_OUTPUT: 'OPTIMIZATION_REPORTS_CLEAR_OUTPUT',
  OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL: 'OPTIMIZATION_REPORTS_SHOW_HIDE_REPORT_MODAL',
  OPTIMIZATION_REPORTS_SET_IS_DOWNLOADING: 'OPTIMIZATION_REPORTS_SET_IS_DOWNLOADING',

  // Plan
  PLAN_SET_ACTIVE_PLAN: 'PLAN_SET_ACTIVE_PLAN',
  PLAN_SET_ACTIVE_PLAN_STATE: 'PLAN_SET_ACTIVE_PLAN_STATE',
  PLAN_SET_ACTIVE_PLAN_ERRORS: 'PLAN_SET_ACTIVE_PLAN_ERRORS',
  PLAN_SET_DATA_ITEMS: 'PLAN_SET_DATA_ITEMS',
  PLAN_SET_SELECTED_DATA_ITEMS: 'PLAN_SET_SELECTED_DATA_ITEMS',
  PLAN_SET_ALL_LIBRARY_ITEMS: 'PLAN_SET_ALL_LIBRARY_ITEMS',
  PLAN_SET_ALL_LIBRARY_ITEMS_ADD: 'PLAN_SET_ALL_LIBRARY_ITEMS_ADD',
  PLAN_APPEND_ALL_LIBRARY_ITEMS: 'PLAN_APPEND_ALL_LIBRARY_ITEMS',
  PLAN_SET_HAVE_DATA_ITEMS_CHANGED: 'PLAN_SET_HAVE_DATA_ITEMS_CHANGED',
  PLAN_SET_RESOURCE_ITEMS: 'PLAN_SET_RESOURCE_ITEMS',
  PLAN_SET_IS_RESOURCE_SELECTION: 'PLAN_SET_IS_RESOURCE_SELECTION',
  PLAN_SET_IS_DATA_SELECTION: 'PLAN_SET_IS_DATA_SELECTION',
  PLAN_SET_ALL_PROJECT: 'PLAN_SET_ALL_PROJECT',
  PLAN_SET_SELECTED_PROJECT_ID: 'PLAN_SET_SELECTED_PROJECT_ID',
  PLAN_SET_IS_DELETING: 'PLAN_SET_IS_DELETING',
  PLAN_SET_PROJECT_MODE: 'PLAN_SET_PROJECT_MODE',
  PLAN_SET_IS_DATASOURCE_EDITABLE: 'PLAN_SET_IS_DATASOURCE_EDITABLE',
  PLAN_SET_PARENT_PROJECT_FOR_NEW_PROJECT: 'PLAN_SET_PARENT_PROJECT_FOR_NEW_PROJECT',
  PLAN_UPDATE_DEFAULT_PLAN_COORDINATES: 'PLAN_UPDATE_DEFAULT_PLAN_COORDINATES',
  PLAN_SET_UPLOAD_NAME: 'PLAN_SET_UPLOAD_NAME',

  // Plan editor
  PLAN_EDITOR_CLEAR_TRANSACTION: 'PLAN_EDITOR_CLEAR_TRANSACTION',
  PLAN_EDITOR_SET_TRANSACTION_ID_ONLY: 'PLAN_EDITOR_SET_TRANSACTION_ID_ONLY',
  PLAN_EDITOR_SET_TRANSACTION: 'PLAN_EDITOR_SET_TRANSACTION',
  PLAN_EDITOR_SET_SOCKET_UNSUBSCRIBER: 'PLAN_EDITOR_SET_SOCKET_UNSUBSCRIBER',
  PLAN_EDITOR_CLEAR_SOCKET_UNSUBSCRIBER: 'PLAN_EDITOR_CLEAR_SOCKET_UNSUBSCRIBER',
  PLAN_EDITOR_ADD_FEATURES: 'PLAN_EDITOR_ADD_FEATURES',
  PLAN_EDITOR_MODIFY_FEATURES: 'PLAN_EDITOR_MODIFY_FEATURES',
  PLAN_EDITOR_CLEAR_FEATURES: 'PLAN_EDITOR_CLEAR_FEATURES',
  PLAN_EDITOR_DELETE_TRANSACTION_FEATURE: 'PLAN_EDITOR_DELETE_TRANSACTION_FEATURE',
  PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR: 'PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR',
  PLAN_EDITOR_SET_IS_RECALCULATING: 'PLAN_EDITOR_SET_IS_RECALCULATING',
  PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS: 'PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS',
  PLAN_EDITOR_SET_IS_CALCULATING_BOUNDARY: 'PLAN_EDITOR_SET_IS_CALCULATING_BOUNDARY',
  PLAN_EDITOR_SET_IS_CREATING_OBJECT: 'PLAN_EDITOR_SET_IS_CREATING_OBJECT',
  PLAN_EDITOR_SET_IS_MODIFYING_OBJECT: 'PLAN_EDITOR_SET_IS_MODIFYING_OBJECT',
  PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP: 'PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP',
  PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES: 'PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES',
  PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION: 'PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION',
  PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION: 'PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION',
  PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS: 'PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS',
  PLAN_EDITOR_DESELECT_EDIT_FEATURE: 'PLAN_EDITOR_DESELECT_EDIT_FEATURE',
  PLAN_EDITOR_DESELECT_EDIT_FEATURES: 'PLAN_EDITOR_DESELECT_EDIT_FEATURES',
  PLAN_EDITOR_SET_DRAFTS: 'PLAN_EDITOR_SET_DRAFTS',
  PLAN_EDITOR_CLEAR_DRAFTS: 'PLAN_EDITOR_CLEAR_DRAFTS',
  PLAN_EDITOR_UPDATE_DRAFT: 'PLAN_EDITOR_UPDATE_DRAFT',
  PLAN_EDITOR_REMOVE_DRAFT: 'PLAN_EDITOR_REMOVE_DRAFT',
  PLAN_EDITOR_SET_DRAFTS_STATE: 'PLAN_EDITOR_SET_DRAFTS_STATE',
  PLAN_EDITOR_SET_DRAFTS_PROGRESS_TUPLE: 'PLAN_EDITOR_SET_DRAFTS_PROGRESS_TUPLE',
  PLAN_EDITOR_MERGE_DRAFT_PROPS: 'PLAN_EDITOR_MERGE_DRAFT_PROPS',
  PLAN_EDITOR_SET_DRAFT_LOCATIONS: 'PLAN_EDITOR_SET_DRAFT_LOCATIONS',
  PLAN_EDITOR_ADD_SUBNETS: 'PLAN_EDITOR_ADD_SUBNETS',
  PLAN_EDITOR_UPDATE_SUBNET_BOUNDARY: 'PLAN_EDITOR_UPDATE_SUBNET_BOUNDARY',
  PLAN_EDITOR_SET_SUBNET_FEATURES: 'PLAN_EDITOR_SET_SUBNET_FEATURES',
  PLAN_EDITOR_UPDATE_SUBNET_FEATURES: 'PLAN_EDITOR_UPDATE_SUBNET_FEATURES',
  PLAN_EDITOR_REMOVE_SUBNET_FEATURES: 'PLAN_EDITOR_REMOVE_SUBNET_FEATURES',
  PLAN_EDITOR_REMOVE_SUBNET_FEATURE: 'PLAN_EDITOR_REMOVE_SUBNET_FEATURE',
  PLAN_EDITOR_REMOVE_SUBNETS: 'PLAN_EDITOR_REMOVE_SUBNETS',
  PLAN_EDITOR_CLEAR_SUBNETS: 'PLAN_EDITOR_CLEAR_SUBNETS',
  PLAN_EDITOR_SET_SELECTED_SUBNET_ID: 'PLAN_EDITOR_SET_SELECTED_SUBNET_ID',
  PLAN_EDITOR_SET_VISIBLE_EQUIPMENT_TYPES: 'PLAN_EDITOR_SET_VISIBLE_EQUIPMENT_TYPES',
  PLAN_EDITOR_SET_BOUNDARY_DEBOUNCE: 'PLAN_EDITOR_SET_BOUNDARY_DEBOUNCE',
  PLAN_EDITOR_CLEAR_BOUNDARY_DEBOUNCE: 'PLAN_EDITOR_CLEAR_BOUNDARY_DEBOUNCE',
  PLAN_EDITOR_SET_CURSOR_LOCATION_IDS: 'PLAN_EDITOR_SET_CURSOR_LOCATION_IDS',
  PLAN_EDITOR_ADD_CURSOR_EQUIPMENT_IDS: 'PLAN_EDITOR_ADD_CURSOR_EQUIPMENT_IDS',
  PLAN_EDITOR_CLEAR_CURSOR_EQUIPMENT_IDS: 'PLAN_EDITOR_CLEAR_CURSOR_EQUIPMENT_IDS',
  PLAN_EDIT_ACTIVE_PLAN: 'PLAN_EDIT_ACTIVE_PLAN',
  PLAN_EDITOR_SET_FIBER_SELECTION: 'PLAN_EDITOR_SET_FIBER_SELECTION',
  PLAN_EDITOR_SET_FIBER_ANNOTATIONS: 'PLAN_EDITOR_SET_FIBER_ANNOTATIONS',
  PLAN_EDITOR_SET_CLICK_LATLNG: 'PLAN_EDITOR_SET_CLICK_LATLNG',
  PLAN_EDITOR_SET_PLAN_THUMB_INFORMATION: 'PLAN_EDITOR_SET_PLAN_THUMB_INFORMATION',
  PLAN_EDITOR_UPDATE_PLAN_THUMB_INFORMATION: 'PLAN_EDITOR_UPDATE_PLAN_THUMB_INFORMATION',

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
  RFP_SET_OPTIMIZATION_PROGRESS_PERCENT: 'RFP_SET_OPTIMIZATION_PROGRESS_PERCENT',
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
  RFP_FULL_SCREEN_SHOW_HIDE_CONTAINER: 'RFP_FULL_SCREEN_SHOW_HIDE_CONTAINER',

  // Selection
  SELECTION_SET_ACTIVE_MODE: 'SELECTION_SET_ACTIVE_MODE',
  SELECTION_CLEAR_ALL_PLAN_TARGETS: 'SELECTION_CLEAR_ALL_PLAN_TARGETS',
  SELECTION_ADD_PLAN_TARGETS: 'SELECTION_ADD_PLAN_TARGETS',
  SELECTION_REMOVE_PLAN_TARGETS: 'SELECTION_REMOVE_PLAN_TARGETS',
  SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS: 'SELECTION_ADD_PLAN_TARGET_DESCRIPTIONS',
  SELECTION_SET_LOCATIONS: 'SELECTION_SET_LOCATIONS',
  SELECTION_SET_MAP_FEATURES: 'SELECTION_SET_MAP_FEATURES',
  SELECTION_SET_ROAD_SEGMENTS: 'SELECTION_SET_ROAD_SEGMENTS',
  SELECTION_SET_PLAN_EDITOR_FEATURES: 'SELECTION_SET_PLAN_EDITOR_FEATURES',// DEPRICATED
  SELECTION_SET_MAP_SELECTION: 'SELECTION_SET_MAP_SELECTION',
  SELECTION_SET_IS_MAP_CLICKED: 'SELECTION_SET_IS_MAP_CLICKED',
  SELECTION_SET_SELECTED_MAP_OBJECT: 'SELECTION_SET_SELECTED_MAP_OBJECT',
  SELECTION_SET_OBJECTID_TO_MAP_OBJECT: 'SELECTION_SET_OBJECTID_TO_MAP_OBJECT',
  SELECTION_SET_POLYGON_COORDINATES: 'SELECTION_SET_POLYGON_COORDINATES',

  // Tool
  TOOL_SET_TOOLBOX_VISIBILITY: 'TOOL_SET_TOOLBOX_VISIBILITY',
  TOOL_SET_ACTIVE_TOOL: 'TOOL_SET_ACTIVE_TOOL',

  // User
  USER_SET_LOGGED_IN_USER: 'USER_SET_LOGGED_IN_USER',
  USER_SET_LOGGED_IN_USER_PROJECT: 'USER_SET_LOGGED_IN_USER_PROJECT',
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

  // View Settings
  VIEW_SETTINGS_SET_SHOW_LOCATION_LABELS: 'VIEW_SETTINGS_SET_SHOW_LOCATION_LABELS',
  VIEW_SETTINGS_DELETE_LOCATION_WITH_ID: 'VIEW_SETTINGS_DELETE_LOCATION_WITH_ID',
  VIEW_SETTINGS_SELECT_SERVICE_AREA: 'VIEW_SETTINGS_SELECT_SERVICE_AREA',
  VIEW_SETTINGS_EDIT_SERVICE_AREA: 'VIEW_SETTINGS_EDIT_SERVICE_AREA',
  VIEW_SETTINGS_DELETE_SERVICE_AREA: 'VIEW_SETTINGS_DELETE_SERVICE_AREA',
  VIEW_SETTINGS_CREATE_MULTI_POLYGON: 'VIEW_SETTINGS_CREATE_MULTI_POLYGON',
  VIEW_SETTINGS_IS_RECREATE_TILE_AND_CACHE: 'VIEW_SETTINGS_IS_RECREATE_TILE_AND_CACHE',
  VIEW_SETTINGS_SET_SERVICE_AREA_BOUNDARY_DETAILS: 'VIEW_SETTINGS_SET_SERVICE_AREA_BOUNDARY_DETAILS',

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
  RING_SET_IS_EDITING: 'RING_SET_IS_EDITING',

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
  GLOBAL_SETTINGS_SHOW_GLOBAL_SETTINGS: 'GLOBAL_SETTINGS_SHOW_GLOBAL_SETTINGS',
  GLOBAL_SETTINGS_NOTIFY_BROADCAST: 'GLOBAL_SETTINGS_NOTIFY_BROADCAST',
  GLOBAL_SETTINGS_SET_CURRENT_VIEW: 'GLOBAL_SETTINGS_SET_CURRENT_VIEW',
  GLOBAL_SETTINGS_SET_NEW_USER_CURRENT_VIEW: 'GLOBAL_SETTINGS_SET_NEW_USER_CURRENT_VIEW',
  GLOBAL_SETTINGS_SET_USER_GROUPS_MSG: 'GLOBAL_SETTINGS_SET_USER_GROUPS_MSG',

  // RESOURCE_EDITOR
  RESOURCE_EDITOR_SET_RESOURCE_TYPES: 'RESOURCE_EDITOR_SET_RESOURCE_TYPES',
  RESOURCE_EDITOR_SET_RESOURCE_MANAGERS: 'RESOURCE_EDITOR_SET_RESOURCE_MANAGERS',
  RESOURCE_EDITOR_HANDLE_PAGE_CLICK: 'RESOURCE_EDITOR_HANDLE_PAGE_CLICK',
  RESOURCE_EDITOR_SEARCH_MANAGERS: 'RESOURCE_EDITOR_SEARCH_MANAGERS',
  RESOURCE_EDITOR_CAN_MAKE_NEW_FILTER: 'RESOURCE_EDITOR_CAN_MAKE_NEW_FILTER',
  RESOURCE_EDITOR_IS_RESOURCE_EDITOR: 'RESOURCE_EDITOR_IS_RESOURCE_EDITOR',
  RESOURCE_EDITOR_GET_PRICEBOOK_STRATEGY: 'RESOURCE_EDITOR_GET_PRICEBOOK_STRATEGY',
  RESOURCE_EDITOR_ARPU_MANAGER: 'RESOURCE_EDITOR_ARPU_MANAGER',
  RESOURCE_EDITOR_SET_ARPU_MODELS: 'RESOURCE_EDITOR_SET_ARPU_MODELS',
  RESOURCE_EDITOR_GET_REGIONS: 'RESOURCE_EDITOR_GET_REGIONS',
  RESOURCE_EDITOR_CARRIERS_BY_PCT: 'RESOURCE_EDITOR_CARRIERS_BY_PCT',
  RESOURCE_EDITOR_STRENGTH_COLS: 'RESOURCE_EDITOR_STRENGTH_COLS',
  RESOURCE_EDITOR_COMP_MAN_META: 'RESOURCE_EDITOR_COMP_MAN_META',
  RESOURCE_EDITOR_EQUIPMENT_TAGS: 'RESOURCE_EDITOR_EQUIPMENT_TAGS',
  RESOURCE_EDITOR_CURRENT_PRICEBOOK: 'RESOURCE_EDITOR_CURRENT_PRICEBOOK',
  RESOURCE_EDITOR_STATES_STRATEGY: 'RESOURCE_EDITOR_STATES_STRATEGY',
  RESOURCE_EDITOR_PRICEBOOK_DEFINITION: 'RESOURCE_EDITOR_PRICEBOOK_DEFINITION',
  RESOURCE_EDITOR_CONSTRUCTION_RATIOS: 'RESOURCE_EDITOR_CONSTRUCTION_RATIOS',
  RESOURCE_EDITOR_ROIC_MANAGER: 'RESOURCE_EDITOR_ROIC_MANAGER',
  RESOURCE_EDITOR_ROIC_MANAGER_CONFIG: 'RESOURCE_EDITOR_ROIC_MANAGER_CONFIG',
  RESOURCE_EDITOR_IMPEDANCE_MANAGER: 'RESOURCE_EDITOR_IMPEDANCE_MANAGER',
  RESOURCE_EDITOR_IMPEDANCE_MANAGER_CONFIG: 'RESOURCE_EDITOR_IMPEDANCE_MANAGER_CONFIG',
  RESOURCE_EDITOR_TSM_MANAGER: 'RESOURCE_EDITOR_TSM_MANAGER',
  RESOURCE_EDITOR_TSM_MANAGER_CONFIG: 'RESOURCE_EDITOR_TSM_MANAGER_CONFIG',
  RESOURCE_EDITOR_RATE_REACH_MANAGER: 'RESOURCE_EDITOR_RATE_REACH_MANAGER',
  RESOURCE_EDITOR_RATE_REACH_MANAGER_CONFIG: 'RESOURCE_EDITOR_RATE_REACH_MANAGER_CONFIG',
  RESOURCE_EDITOR_MODAL_TITLE: 'RESOURCE_EDITOR_MODAL_TITLE',
  RESOURCE_EDITOR_IS_RRM_MANAGER: 'RESOURCE_EDITOR_IS_RRM_MANAGER',

  // ETL Template
  ETL_TEMPLATE_GET_BY_TYPE: 'ETL_TEMPLATE_GET_BY_TYPE',
  ETL_TEMPLATE_CONFIG_VIEW: 'ETL_TEMPLATE_CONFIG_VIEW',

  // DATA UPLOAD
  DATA_UPLOAD_TOGGLE_VIEW: 'DATA_UPLOAD_TOGGLE_VIEW',
  DATA_UPLOAD_SET_EDGE_TYPE: 'DATA_UPLOAD_SET_EDGE_TYPE',
  DATA_UPLOAD_SET_CABLE_TYPE: 'DATA_UPLOAD_SET_CABLE_TYPE',
  DATA_UPLOAD_UPDATE_DATASOURCES: 'DATA_UPLOAD_UPDATE_DATASOURCES',
  DATA_UPLOAD_SET_IS_UP_LOADING : 'DATA_UPLOAD_SET_IS_UP_LOADING',

  // Tool bar
  TOOL_BAR_SET_SAVE_PLAN_AS: 'TOOL_BAR_SET_SAVE_PLAN_AS',
  TOOL_BAR_SET_SELECTED_DISPLAY_MODE: 'TOOL_BAR_SET_SELECTED_DISPLAY_MODE',
  TOOL_BAR_SET_ACTIVE_VIEW_MODE_PANEL: 'TOOL_BAR_SET_ACTIVE_VIEW_MODE_PANEL',
  TOOL_BAR_SELECTED_TOOL_BAR_ACTION: 'TOOL_BAR_SELECTED_TOOL_BAR_ACTION',
  TOOL_BAR_SELECTED_TARGET_SELECTION_MODE: 'TOOL_BAR_SELECTED_TARGET_SELECTION_MODE',
  TOOL_BAR_IS_RULER_ENABLED: 'TOOL_BAR_IS_RULER_ENABLED',
  TOOL_BAR_IS_VIEW_SETTINGS_ENABLED: 'TOOL_BAR_IS_VIEW_SETTINGS_ENABLED',
  TOOL_BAR_SHOW_DIRECTED_CABLE: 'TOOL_BAR_SHOW_DIRECTED_CABLE',
  TOOL_BAR_SHOW_EQUIPMENT_LABELS: 'TOOL_BAR_SHOW_EQUIPMENT_LABELS',
  TOOL_BAR_SHOW_FIBER_SIZE: 'TOOL_BAR_SHOW_FIBER_SIZE',
  TOOL_BAR_SET_APP_CONFIGURATION: 'TOOL_BAR_SET_APP_CONFIGURATION',
  TOOL_BAR_LIST_OF_PLAN_TAGS: 'TOOL_BAR_LIST_OF_PLAN_TAGS',
  TOOL_BAR_SET_CURRENT_PLAN_TAGS: 'TOOL_BAR_SET_CURRENT_PLAN_TAGS',
  TOOL_BAR_SET_CURRENT_PLAN_SA_TAGS: 'TOOL_BAR_SET_CURRENT_PLAN_SA_TAGS',
  TOOL_BAR_LOAD_SERVICE_LAYERS: 'TOOL_BAR_LOAD_SERVICE_LAYERS',
  TOOL_BAR_LIST_OF_SERVICE_AREA_TAGS: 'TOOL_BAR_LIST_OF_SERVICE_AREA_TAGS',
  TOOL_BAR_SET_HEAT_MAP_OPTION: 'TOOL_BAR_SET_HEAT_MAP_OPTION',
  TOOL_BAR_SET_VIEW_SETTING: 'TOOL_BAR_SET_VIEW_SETTING',
  TOOL_BAR_SET_DELETED_UNCOMMITED_MAP_OBJECTS: 'TOOL_BAR_SET_DELETED_UNCOMMITED_MAP_OBJECTS',
  TOOL_BAR_SET_SIDEBAR_WIDTH: 'TOOL_BAR_SET_SIDEBAR_WIDTH',

  // ROIC-REPORTS
  ROIC_REPORTS_SET_ENUM_STRINGS: 'ROIC_REPORTS_SET_ENUM_STRINGS',
  ROIC_REPORTS_NETWORK_NODE_TYPE_ENTITY: 'ROIC_REPORTS_NETWORK_NODE_TYPE_ENTITY',
  ROIC_REPORTS_NETWORK_NODE_TYPES: 'ROIC_REPORTS_NETWORK_NODE_TYPES',
  ROIC_REPORTS_SHOW_ROIC_REPORT_MODAL: 'ROIC_REPORTS_SHOW_ROIC_REPORT_MODAL',
  ROIC_REPORTS_SET_ROIC_RESULTS_FOR_PLAN: 'ROIC_REPORTS_SET_ROIC_RESULTS_FOR_PLAN',
  ROIC_REPORTS_SET_XAXIS_LABELS: 'ROIC_REPORTS_SET_XAXIS_LABELS',

  // EXPERT MODE
  EXPERT_MODE_SELECTED_EXPERT_MODE: 'EXPERT_MODE_SELECTED_EXPERT_MODE',
  EXPERT_MODE_GET_SCOPE_CONTEXT: 'EXPERT_MODE_GET_SCOPE_CONTEXT',
  EXPERT_MODE_GET_SUPER_CONTEXT_KEYS: 'EXPERT_MODE_GET_SUPER_CONTEXT_KEYS',
  EXPERT_MODE_SET_EXPERT_MODE: 'EXPERT_MODE_SET_EXPERT_MODE',
  EXPERT_MODE_SET_EXPERT_MODE_TYPES: 'EXPERT_MODE_SET_EXPERT_MODE_TYPES',

  // STATE_VIEW_MODE
  STATE_VIEW_MODE_GET_ENTITY_TYPE_LIST: 'STATE_VIEW_MODE_GET_ENTITY_TYPE_LIST',
  STATE_VIEW_MODE_GET_ENTITY_TYPE_BOUNDRY_LIST: 'STATE_VIEW_MODE_GET_ENTITY_TYPE_BOUNDRY_LIST',
  STATE_VIEW_MODE_SET_LAYER_CATEGORIES: 'STATE_VIEW_MODE_SET_LAYER_CATEGORIES',
  STATE_VIEW_MODE_CLEAR_VIEW_MODE: 'STATE_VIEW_MODE_CLEAR_VIEW_MODE',
})

export default Actions
