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
