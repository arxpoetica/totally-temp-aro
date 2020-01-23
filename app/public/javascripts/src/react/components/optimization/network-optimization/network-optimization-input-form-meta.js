const AnalysisTypes = [
  'UNDEFINED',
  'NETWORK_PLAN',
  'NETWORK_ANALYSIS',
  'COVERAGE', 'MANUAL',
  'POINT_TO_POINT',
  'LOCATION_ROIC',
  'RFP',
  'RING'
]

const RoutingModes = [
  'UNDEFINED',
  'DEFAULT',
  'DIRECT_ROUTING',
  'ODN_1',
  'ODN_2',
  'ODN_3'
]

const OptimizationModes = [
  'INTER_WIRECENTER',
  'INTRA_WIRECENTER'
]

const AnalysisSelectionModes = [
  'UNDEFINED',
  'SELECTED_LOCATIONS',
  'SELECTED_AREAS',
  'SELECTED_ANALYSIS_AREAS',
  'ALL_SERVICE_AREAS',
  'ALL_PLAN_AREAS'
]

const AlgorithmNames = [
  'UNCONSTRAINED',
  'SUPER_LAYER_ROUTING',
  'CAPEX',
  'COVERAGE',
  'IRR',
  'NPV',
  'CUSTOM'
]
/*
const AlgorithmTypes = [
  'DEFAULT',
  'PLANNING',
  'PRUNING',
  'ROUTING'
]
*/
const NetworkTypes = [ // swap out for grouped list
  'Fiber', // Fiber
  'FiveG', // 5G
  'Copper' // DSL
]

const NetworkOptimizationInputFormMeta = Object.freeze({
  '_meta': {
    'displayType': 'object',
    'displayName': '',
    'options': []
  },
  /*
  'advancedAnalysis': {
    '_meta': {
      'displayType': 'checkbox',
      'displayName': '',
      'options': []
    }
  },
  */
  'analysis_type': {
    '_meta': {
      'displayType': 'dropdownList',
      'displayName': '',
      'options': AnalysisTypes
    }
  },
  'fronthaulOptimization.optimizationMode': {
    '_meta': {
      'displayType': 'dropdownList',
      'displayName': '',
      'options': OptimizationModes
    }
  },
  'locationConstraints.analysisSelectionMode': {
    '_meta': {
      'displayType': 'dropdownList',
      'displayName': '',
      'options': AnalysisSelectionModes
    }
  },
  'networkTypes': {
    '_meta': {
      'displayType': 'multiSelect',
      'displayName': '',
      'options': NetworkTypes
    }
  },
  'optimization': {
    '_meta': {
      'displayType': 'object',
      'displayName': '',
      'options': []
    },
    'algorithm': {
      '_meta': {
        'displayType': 'dropdownList',
        'displayName': '',
        'options': AlgorithmNames
      }
    },
    /*
    'algorithmType': {
      '_meta': {
        'displayType': 'dropdownList',
        'displayName': '',
        'options': AlgorithmTypes
      }
    },
    */
    'budget': {
      '_meta': {
        'displayType': 'number',
        'displayName': '',
        'options': []
      }
    },
    /*
    'customOptimization': {
      '_meta': {
        'displayType': 'object',
        'displayName': '',
        'options': []
      },
      'map': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': []
        }
      },
      'name': {
        '_meta': {
          'displayType': 'text',
          'displayName': '',
          'options': []
        }
      }
    },
*/
    'preIrrThreshold': {
      '_meta': {
        'displayType': 'number',
        'displayName': '',
        'options': []
      }
    },
    'threshold': {
      '_meta': {
        'displayType': 'number',
        'displayName': '',
        'options': []
      }
    }
  },
  /*
  'planId': {
    '_meta': {
      'displayType': 'number',
      'displayName': '',
      'options': []
    }
  },
  */
  'routingMode': {
    '_meta': {
      'displayType': 'dropdownList',
      'displayName': '',
      'options': RoutingModes
    }
  }
})

export default NetworkOptimizationInputFormMeta
