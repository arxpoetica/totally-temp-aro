export default Object.freeze({
  NETWORK_ANALYSIS_CONSTRAINTS: 'networkAnalysisConstraints',
  MAP_REPORTS_PAGE_FORM: 'mapReportsPage',
  PLANNING_CONSTRAINTS_FORM: 'planningConstraints',
  FUSION_FORM: 'fusion',
  NETWORK_ARCHITECTURE: 'networkArchitecture',
  REPORT_DEFINITION_EDITOR_FORM: 'reportDefinitionEditor',
  RFP_OPTIONS_FORM: 'rfpOptions',
  RING_OPTIONS_BASIC_FORM: 'ringOptionsBasic',
  RING_OPTIONS_CONNECTIVITY_DEFINITION: 'ringOptionsConnectivityDefinition',
  NETWORK_OPTIMIZATION_INPUT_FORM: 'NetworkOptimizationInputForm',
  LAT_LONG_DISPLAY_PRECISION: 5, // Number of decimal places to show

  // Plan states
  PLAN_STATE: Object.freeze({
    INITIALIZED: 'INITIALIZED',
    START_STATE: 'START_STATE',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELED: 'CANCELED'
  }),

  // Broadcast constants
  BROADCAST_LOCAL_STORAGE: 'showBroadcast',
  BROADCAST_EXPIRY_TIME: 259200000, // in milliseconds (72 hrs)
  BROADCAST_INTERVAL_TIME: 14400000, // in milliseconds (4 hrs)
})
