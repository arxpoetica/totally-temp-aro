export default Object.freeze({
  'advancedAnalysis': true,
  'analysis_type': 'NETWORK_PLAN',
  'backhaulOptimization': {
    'backhaulOptimizationType': 'LINKED_NODES'
  },
  'fronthaulOptimization': {
    'optimizationMode': 'INTER_WIRECENTER'
  },
  'generatedDataRequest': {
    'aggregatedBOM': true,
    'generateFiberLinks': true,
    'generateOptimizationAnalysis': true,
    'generatePlanLocationLinks': true,
    'generatePrunnedNetwork': true,
    'generateSubnetLinking': true,
    'persistJunctionNodes': true,
    'selectedCalcTypes': [
      'undefined'
    ]
  },
  'locationConstraints': {
    'analysisLayerId': 0,
    'analysisSelectionMode': 'SELECTED_AREAS',
    'locationTypes': [
      'large'
    ]
  },
  'networkTypes': [
    'Undefined'
  ],
  'optimization': {
    'algorithm': 'UNCONSTRAINED',
    'algorithmType': 'DEFAULT',
    'budget': 0,
    'customOptimization': {
      'map': {},
      'name': 'string'
    },
    'preIrrThreshold': 0,
    'threshold': 0
  },
  'planId': 0,
  'projectTemplateId': 1,
  'routingMode': 'ODN_1'
})

/*
export default Object.freeze({
  'analysis_type': 'NETWORK_PLAN',
  'uiAlgorithms': [],
  'uiSelectedAlgorithm': null,
  'networkConstraints': {
    'routingMode': 'ODN_1',
    'networkTypes': [
      'Fiber'
    ],
    'cellNodeConstraints': {
      'cellRadius': 300.0,
      'cellGranularityRatio': 0.5,
      'minimumRayLength': 45,
      'polygonStrategy': 'FIXED_RADIUS',
      'tiles': [],
      'selectedTile': null
    },
    'dslamNodeConstraints': {
      'cellRadius': 300.0,
      'optimizationSpeedMbs': 1
    },
    'routeFromFiber': false,
    'fiberRoutingMode': null
  },
  'financialConstraints': {
    'cashFlowStrategyType': 'EXTERNAL',
    'discountRate': 0.06,
    'years': 15,
    'terminalValueStrategy': {
      'value': 0.0,
      'terminalValueStrategyType': 'NONE'
    },
    'penetrationAnalysisStrategy': 'SCURVE',
    'connectionCostStrategy': 'NEW_CONNECTION'
  },
  'fronthaulOptimization': {
    'optimizationMode': 'INTER_WIRECENTER'
  },
  'locationConstraints': {
    'locationTypes': ['small', 'medium', 'large', 'household', 'celltower'],
    'analysisSelectionMode': 'SELECTED_AREAS'
  },
  'threshold': 0,
  'preIrrThreshold': 1.0,
  'budget': 10000,
  'customOptimization': null,
  'routeGenerationOptions': [
    {
      'id': 'T',
      'value': 'A Route',
      'checked': false
    },
    {
      'id': 'A',
      'value': 'B Route',
      'checked': false
    },
    {
      'id': 'B',
      'value': 'C Route',
      'checked': false
    },
    {
      'id': 'C',
      'value': 'D Route',
      'checked': false
    }
  ],
  'technologies': {
    'Fiber': {
      'label': 'Fiber',
      'checked': true
    },
    'FiveG': {
      'label': '5G',
      'checked': false
    },
    'Copper': {
      'label': 'DSL',
      'checked': false
    }
  },
  'selectedLayer': null,
  'generatedDataRequest': {
    'generatePlanLocationLinks': false,
    'generateSubnetLinking': false
  },
  'analysisSelectionMode': 'SELECTED_AREAS',
  'optimization': {
    'algorithmType': 'DEFAULT',
    'algorithm': 'UNCONSTRAINED'
  },
  'competitionConfiguration': {
    'providerStrength': 1.0
  }
})
*/
