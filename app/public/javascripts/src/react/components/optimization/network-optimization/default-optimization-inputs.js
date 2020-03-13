export default Object.freeze({
  // 'advancedAnalysis': false,
  'analysis_type': 'NETWORK_PLAN',
  'fronthaulOptimization': {
    'optimizationMode': 'INTER_WIRECENTER'
  },
  'locationConstraints': {
    // 'analysisLayerId': 0,
    'analysisSelectionMode': 'SELECTED_AREAS',
    'locationTypes': [
      'large'
    ]
  },
  'networkTypes': [
    'Fiber'
  ],
  'optimization': {
    'algorithm': 'UNCONSTRAINED',
    // 'algorithmType': 'DEFAULT',
    'budget': null,
    /*
    'customOptimization': {
      'map': {},
      'name': 'string'
    },
    */
    'preIrrThreshold': null,
    'threshold': null
  },
  // 'planId': 0,
  'routingMode': 'ODN_1'
})
