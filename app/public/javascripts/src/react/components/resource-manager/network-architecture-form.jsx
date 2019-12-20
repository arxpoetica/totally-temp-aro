import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'
import ObjectEditor from '../common/editor-interface/object-editor.jsx'

/*
{
  'managerType': 'network_architecture_manager',
  'networkConfigurations': {
    'ODN_3': {
      'fiberConstraintConfig': {
        'version': 7,
        'maxFiberDistance': 80000,
        'maxNetworkNodeToEdgeDistance': 500,
        'maxLocationToEdgeDistance': 500,
        'entityDistanceMap': {
          'celltower': 80000
        },
        'inferCoWhenAbsent': true
      },
      'bulkFiberConfig': {
        'version': 9,
        'bulkConnectorConfig': [
          {
            'assignmentStrategy': 'DropCoil',
            'nodeType': 'bulk_distribution_terminal',
            'equipmentCode': 'drop_coil',
            'supportedFiberTypes': [
              'DISTRIBUTION'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          },
          {
            'assignmentStrategy': 'MultiDwellingUnit',
            'nodeType': 'multiple_dwelling_unit',
            'equipmentCode': 'mxu_existing',
            'supportedFiberTypes': [
              'DISTRIBUTION'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          }
        ]
      },
      'hubConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 3,
          'target': 35,
          'max': 40,
          'types': [
            'FS_1X32'
          ]
        },
        'outputConfig': {
          'min': 50,
          'target': 100,
          'max': 128,
          'types': [
            'FS_1X1'
          ]
        },
        'maxDistanceMeters': 3000
      },
      'terminalConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 1,
          'target': 12,
          'max': 12,
          'types': [
            'FS_1X1'
          ]
        },
        'outputConfig': {
          'min': 1,
          'target': 12,
          'max': 12,
          'types': [
            'FS_1X1'
          ]
        },
        'maxDistanceMeters': 50
      },
      'fiberCapacityConfig': {
        'version': 0,
        'rules': [
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'small',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'medium',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'large',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'household',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'celltower',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          }
        ],
        'consolidationRules': [
          {
            'capacityType': 'SingleConnection',
            'strategy': 'UPGRADE',
            'threshold': 5,
            'updgradedCapacityType': 'MultiDwellingUnit'
          }
        ]
      },
      'routingMode': 'ODN_3'
    },
    'DIRECT_ROUTING': {
      'fiberConstraintConfig': {
        'version': 7,
        'maxFiberDistance': 80000,
        'maxNetworkNodeToEdgeDistance': 500,
        'maxLocationToEdgeDistance': 500,
        'entityDistanceMap': {
          'celltower': 80000
        },
        'inferCoWhenAbsent': true
      },
      'bulkFiberConfig': {
        'version': 9,
        'bulkConnectorConfig': [
          {
            'assignmentStrategy': 'SingleConnection',
            'nodeType': 'bulk_distribution_terminal',
            'equipmentCode': 'drop_coil',
            'supportedFiberTypes': [
              'FEEDER'
            ],
            'supportedNetworkTypes': [
              'Fiber',
              'Copper',
              'FiveG'
            ]
          },
          {
            'assignmentStrategy': 'DropCoil',
            'nodeType': 'bulk_distribution_terminal',
            'equipmentCode': 'drop_coil',
            'supportedFiberTypes': [
              'FEEDER'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          },
          {
            'assignmentStrategy': 'MultiDwellingUnit',
            'nodeType': 'multiple_dwelling_unit',
            'equipmentCode': 'mxu_existing',
            'supportedFiberTypes': [
              'FEEDER'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          },
          {
            'assignmentStrategy': 'MultiDwelingUnit',
            'nodeType': 'bulk_distribution_terminal',
            'equipmentCode': 'drop_coil',
            'supportedFiberTypes': [
              'FEEDER'
            ],
            'supportedNetworkTypes': [
              'Fiber',
              'Copper',
              'FiveG'
            ]
          }
        ]
      },
      'hubConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 0,
          'target': 0,
          'max': 0,
          'types': []
        },
        'outputConfig': {
          'min': 0,
          'target': 0,
          'max': 0,
          'types': []
        },
        'maxDistanceMeters': 2000
      },
      'terminalConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 0,
          'target': 0,
          'max': 0,
          'types': []
        },
        'outputConfig': {
          'min': 0,
          'target': 0,
          'max': 0,
          'types': []
        },
        'maxDistanceMeters': 2000
      },
      'fiberCapacityConfig': {
        'version': 0,
        'rules': [
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'small',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'medium',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'large',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'household',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'celltower',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          }
        ],
        'consolidationRules': [
          {
            'capacityType': 'SingleConnection',
            'strategy': 'UPGRADE',
            'threshold': 5,
            'updgradedCapacityType': 'MultiDwellingUnit'
          }
        ]
      },
      'routingMode': 'DIRECT_ROUTING'
    },
    'ODN_2': {
      'fiberConstraintConfig': {
        'version': 7,
        'maxFiberDistance': 80000,
        'maxNetworkNodeToEdgeDistance': 500,
        'maxLocationToEdgeDistance': 500,
        'entityDistanceMap': {
          'celltower': 80000
        },
        'inferCoWhenAbsent': true
      },
      'bulkFiberConfig': {
        'version': 9,
        'bulkConnectorConfig': [
          {
            'assignmentStrategy': 'DropCoil',
            'nodeType': 'bulk_distribution_terminal',
            'equipmentCode': 'drop_coil',
            'supportedFiberTypes': [
              'FEEDER',
              'DISTRIBUTION'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          },
          {
            'assignmentStrategy': 'MultiDwellingUnit',
            'nodeType': 'multiple_dwelling_unit',
            'equipmentCode': 'mxu_existing',
            'supportedFiberTypes': [
              'FEEDER',
              'DISTRIBUTION'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          }
        ]
      },
      'hubConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 3,
          'target': 35,
          'max': 40,
          'types': [
            'FS_1X32'
          ]
        },
        'outputConfig': {
          'min': 60,
          'target': 110,
          'max': 120,
          'types': [
            'FS_1X32'
          ]
        },
        'maxDistanceMeters': 3000
      },
      'terminalConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 1,
          'target': 1,
          'max': 1,
          'types': [
            'FS_1X4',
            'FS_1X8'
          ]
        },
        'outputConfig': {
          'min': 1,
          'target': 8,
          'max': 8,
          'types': [
            'FS_1X1'
          ]
        },
        'maxDistanceMeters': 50
      },
      'fiberCapacityConfig': {
        'version': 0,
        'rules': [
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'small',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'medium',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'large',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'household',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'celltower',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          }
        ],
        'consolidationRules': [
          {
            'capacityType': 'SingleConnection',
            'strategy': 'UPGRADE',
            'threshold': 5,
            'updgradedCapacityType': 'MultiDwellingUnit'
          }
        ]
      },
      'routingMode': 'ODN_2'
    },
    'ODN_1': {
      'fiberConstraintConfig': {
        'version': 7,
        'maxFiberDistance': 80000,
        'maxNetworkNodeToEdgeDistance': 500,
        'maxLocationToEdgeDistance': 500,
        'entityDistanceMap': {
          'celltower': 80000
        },
        'inferCoWhenAbsent': true
      },
      'bulkFiberConfig': {
        'version': 9,
        'bulkConnectorConfig': [
          {
            'assignmentStrategy': 'DropCoil',
            'nodeType': 'bulk_distribution_terminal',
            'equipmentCode': 'drop_coil',
            'supportedFiberTypes': [
              'FEEDER'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          },
          {
            'assignmentStrategy': 'MultiDwellingUnit',
            'nodeType': 'multiple_dwelling_unit',
            'equipmentCode': 'mxu_existing',
            'supportedFiberTypes': [
              'FEEDER'
            ],
            'supportedNetworkTypes': [
              'Fiber'
            ]
          }
        ]
      },
      'hubConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 3,
          'target': 40,
          'max': 35,
          'types': [
            'FS_1X32'
          ]
        },
        'outputConfig': {
          'min': 96,
          'target': 384,
          'max': 480,
          'types': [
            'FS_1X1'
          ]
        },
        'maxDistanceMeters': 3000
      },
      'terminalConfiguration': {
        'version': 3,
        'inputPort': {
          'min': 1,
          'target': 12,
          'max': 12,
          'types': [
            'FS_1X1'
          ]
        },
        'outputConfig': {
          'min': 1,
          'target': 12,
          'max': 12,
          'types': [
            'FS_1X1'
          ]
        },
        'maxDistanceMeters': 50
      },
      'fiberCapacityConfig': {
        'version': 0,
        'rules': [
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'small',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'medium',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'large',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'household',
            'fiberCapacityType': 'SingleConnection',
            'atomicUnits': 1
          },
          {
            'ruleType': 'AtomicUnitsPerEntity',
            'locationEntityType': 'celltower',
            'fiberCapacityType': 'DropCoil',
            'atomicUnits': 32
          }
        ],
        'consolidationRules': [
          {
            'capacityType': 'SingleConnection',
            'strategy': 'UPGRADE',
            'threshold': 5,
            'updgradedCapacityType': 'MultiDwellingUnit'
          }
        ]
      },
      'routingMode': 'ODN_1'
    }
  }
}
*/

export class NetworkArchitecture extends Component {
  constructor (props) {
    super(props)
    console.log(props)
    this.meta = {
      'networkConfigurations': {
        _meta: { displayType: 'object' },
        'ODN_3': {
          _meta: { displayType: 'object' },
          'fiberConstraintConfig': {
            _meta: { displayType: 'object' },
            'maxFiberDistance': { _meta: { displayType: 'number' } },
            'maxNetworkNodeToEdgeDistance': { _meta: { displayType: 'number' } },
            'maxLocationToEdgeDistance': { _meta: { displayType: 'number' } },
            'inferCoWhenAbsent': { _meta: { displayType: 'checkbox' } },
            'entityDistanceMap': {
              _meta: { displayType: 'object' },
              'celltower': { _meta: { displayType: 'number' } }
            }
          },
          'hubConfiguration': {
            _meta: { displayType: 'object' },
            'inputPort': {
              _meta: { displayType: 'object' },
              'min': { _meta: { displayType: 'number' } },
              'target': { _meta: { displayType: 'number' } },
              'max': { _meta: { displayType: 'number' } },
              'types': {
                _meta: { 
                  displayType: 'multiSelect',
                  options: [
                    'FS_1X1',
                    'FS_1X4',
                    'FS_1X8',
                    'FS_1X32'
                  ]
                }
              }
            }
          }
        },
        'DIRECT_ROUTING': {
          _meta: { displayType: 'object' },
          'bulkFiberConfig': {
            _meta: { displayType: 'object' },
            'bulkConnectorConfig': {
              _meta: { displayType: 'object' },
              0: {
                _meta: { displayType: 'object' },
                'supportedFiberTypes': {
                  _meta: { 
                    displayType: 'multiSelect',
                    options: [
                      'FEEDER', 'TEST1', 'UNKNOWN'
                    ]
                  }
                },
                'supportedNetworkTypes': {
                  _meta: { 
                    displayType: 'multiSelect',
                    options: [
                      'Fiber',
                      'Copper',
                      'FiveG'
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  render () {
    // ToDo: the maxHeight style bit needs to go into the parent modal
    //  along with the close button
    return <div>
      <div style={{ maxHeight: 'calc(100vh - 17rem)', overflow: 'scroll', paddingRight: '16px', marginRight: '-16px' }}>
        <form className='d-flex flex-column rfp-options'
          style={{ height: '100%' }}
          onSubmit={event => event.preventDefault()}>
          <ObjectEditor metaData={this.meta} title={'Net Config'}></ObjectEditor>
        </form>
      </div>
    </div>
  }

  // we're using recursion so we gaurd against edge case
  /*
  renderObject (meta, name, nameChain, depth) {
    if (depth > 200) return <div>...</div>
    var jsxItems = []
    Object.keys(meta).forEach(key => {
      if (key !== '_meta') {
        var prop = meta[key]
        var newNameChain = nameChain + key
        if (prop._meta.type === 'object') {
          jsxItems.push(this.renderObject(prop, key, newNameChain + '.', depth + 1))
        } else {
          jsxItems.push(
            <div className='ei-property-item' key={newNameChain}>
              <div className='ei-property-label'>
                {key}
              </div>
              <div>
                <Field name={newNameChain}
                  className='form-control form-control-sm' component='input' type={prop._meta.type} />
              </div>
            </div>
          )
        }
      }
    })

    return (
      <div className='ei-items-contain' key={nameChain}>
        <div className='ei-foldout'>
          <div className='ei-header' style={{ cursor: 'unset' }}>
            {name}
          </div>
          <div className='ei-gen-level' style={{ paddingLeft: '21px', paddingRight: '10px' }}>
            <div className='ei-items-contain'>
              {jsxItems}
            </div>
          </div>
        </div>
      </div>
    )
  }
*/
/*
  renderItem (item) {
    return <div className='ei-property-item'>
      <div class='ei-property-label'>
        Cash Flow Strategy Type
      </div>
      <div>
        <Field name='wormholeCostCode'
          className='form-control form-control-sm' component='input' type='text' />
      </div>
    </div>
  }
*/
}

let NetworkArchitectureForm = reduxForm({
  form: Constants.NETWORK_ARCHITECTURE
})(NetworkArchitecture)

export default NetworkArchitectureForm
