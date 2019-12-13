import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Field, reduxForm } from 'redux-form'
import Constants from '../../common/constants'

/*
{
  "managerType": "network_architecture_manager",
  "networkConfigurations": {
    "ODN_3": {
      "fiberConstraintConfig": {
        "version": 7,
        "maxFiberDistance": 80000,
        "maxNetworkNodeToEdgeDistance": 500,
        "maxLocationToEdgeDistance": 500,
        "entityDistanceMap": {
          "celltower": 80000
        },
        "inferCoWhenAbsent": true
      },
      "bulkFiberConfig": {
        "version": 9,
        "bulkConnectorConfig": [
          {
            "assignmentStrategy": "DropCoil",
            "nodeType": "bulk_distribution_terminal",
            "equipmentCode": "drop_coil",
            "supportedFiberTypes": [
              "DISTRIBUTION"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          },
          {
            "assignmentStrategy": "MultiDwellingUnit",
            "nodeType": "multiple_dwelling_unit",
            "equipmentCode": "mxu_existing",
            "supportedFiberTypes": [
              "DISTRIBUTION"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          }
        ]
      },
      "hubConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 3,
          "target": 35,
          "max": 40,
          "types": [
            "FS_1X32"
          ]
        },
        "outputConfig": {
          "min": 50,
          "target": 100,
          "max": 128,
          "types": [
            "FS_1X1"
          ]
        },
        "maxDistanceMeters": 3000
      },
      "terminalConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 1,
          "target": 12,
          "max": 12,
          "types": [
            "FS_1X1"
          ]
        },
        "outputConfig": {
          "min": 1,
          "target": 12,
          "max": 12,
          "types": [
            "FS_1X1"
          ]
        },
        "maxDistanceMeters": 50
      },
      "fiberCapacityConfig": {
        "version": 0,
        "rules": [
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "small",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "medium",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "large",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "household",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "celltower",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          }
        ],
        "consolidationRules": [
          {
            "capacityType": "SingleConnection",
            "strategy": "UPGRADE",
            "threshold": 5,
            "updgradedCapacityType": "MultiDwellingUnit"
          }
        ]
      },
      "routingMode": "ODN_3"
    },
    "DIRECT_ROUTING": {
      "fiberConstraintConfig": {
        "version": 7,
        "maxFiberDistance": 80000,
        "maxNetworkNodeToEdgeDistance": 500,
        "maxLocationToEdgeDistance": 500,
        "entityDistanceMap": {
          "celltower": 80000
        },
        "inferCoWhenAbsent": true
      },
      "bulkFiberConfig": {
        "version": 9,
        "bulkConnectorConfig": [
          {
            "assignmentStrategy": "SingleConnection",
            "nodeType": "bulk_distribution_terminal",
            "equipmentCode": "drop_coil",
            "supportedFiberTypes": [
              "FEEDER"
            ],
            "supportedNetworkTypes": [
              "Fiber",
              "Copper",
              "FiveG"
            ]
          },
          {
            "assignmentStrategy": "DropCoil",
            "nodeType": "bulk_distribution_terminal",
            "equipmentCode": "drop_coil",
            "supportedFiberTypes": [
              "FEEDER"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          },
          {
            "assignmentStrategy": "MultiDwellingUnit",
            "nodeType": "multiple_dwelling_unit",
            "equipmentCode": "mxu_existing",
            "supportedFiberTypes": [
              "FEEDER"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          },
          {
            "assignmentStrategy": "MultiDwelingUnit",
            "nodeType": "bulk_distribution_terminal",
            "equipmentCode": "drop_coil",
            "supportedFiberTypes": [
              "FEEDER"
            ],
            "supportedNetworkTypes": [
              "Fiber",
              "Copper",
              "FiveG"
            ]
          }
        ]
      },
      "hubConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 0,
          "target": 0,
          "max": 0,
          "types": []
        },
        "outputConfig": {
          "min": 0,
          "target": 0,
          "max": 0,
          "types": []
        },
        "maxDistanceMeters": 2000
      },
      "terminalConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 0,
          "target": 0,
          "max": 0,
          "types": []
        },
        "outputConfig": {
          "min": 0,
          "target": 0,
          "max": 0,
          "types": []
        },
        "maxDistanceMeters": 2000
      },
      "fiberCapacityConfig": {
        "version": 0,
        "rules": [
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "small",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "medium",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "large",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "household",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "celltower",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          }
        ],
        "consolidationRules": [
          {
            "capacityType": "SingleConnection",
            "strategy": "UPGRADE",
            "threshold": 5,
            "updgradedCapacityType": "MultiDwellingUnit"
          }
        ]
      },
      "routingMode": "DIRECT_ROUTING"
    },
    "ODN_2": {
      "fiberConstraintConfig": {
        "version": 7,
        "maxFiberDistance": 80000,
        "maxNetworkNodeToEdgeDistance": 500,
        "maxLocationToEdgeDistance": 500,
        "entityDistanceMap": {
          "celltower": 80000
        },
        "inferCoWhenAbsent": true
      },
      "bulkFiberConfig": {
        "version": 9,
        "bulkConnectorConfig": [
          {
            "assignmentStrategy": "DropCoil",
            "nodeType": "bulk_distribution_terminal",
            "equipmentCode": "drop_coil",
            "supportedFiberTypes": [
              "FEEDER",
              "DISTRIBUTION"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          },
          {
            "assignmentStrategy": "MultiDwellingUnit",
            "nodeType": "multiple_dwelling_unit",
            "equipmentCode": "mxu_existing",
            "supportedFiberTypes": [
              "FEEDER",
              "DISTRIBUTION"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          }
        ]
      },
      "hubConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 3,
          "target": 35,
          "max": 40,
          "types": [
            "FS_1X32"
          ]
        },
        "outputConfig": {
          "min": 60,
          "target": 110,
          "max": 120,
          "types": [
            "FS_1X32"
          ]
        },
        "maxDistanceMeters": 3000
      },
      "terminalConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 1,
          "target": 1,
          "max": 1,
          "types": [
            "FS_1X4",
            "FS_1X8"
          ]
        },
        "outputConfig": {
          "min": 1,
          "target": 8,
          "max": 8,
          "types": [
            "FS_1X1"
          ]
        },
        "maxDistanceMeters": 50
      },
      "fiberCapacityConfig": {
        "version": 0,
        "rules": [
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "small",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "medium",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "large",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "household",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "celltower",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          }
        ],
        "consolidationRules": [
          {
            "capacityType": "SingleConnection",
            "strategy": "UPGRADE",
            "threshold": 5,
            "updgradedCapacityType": "MultiDwellingUnit"
          }
        ]
      },
      "routingMode": "ODN_2"
    },
    "ODN_1": {
      "fiberConstraintConfig": {
        "version": 7,
        "maxFiberDistance": 80000,
        "maxNetworkNodeToEdgeDistance": 500,
        "maxLocationToEdgeDistance": 500,
        "entityDistanceMap": {
          "celltower": 80000
        },
        "inferCoWhenAbsent": true
      },
      "bulkFiberConfig": {
        "version": 9,
        "bulkConnectorConfig": [
          {
            "assignmentStrategy": "DropCoil",
            "nodeType": "bulk_distribution_terminal",
            "equipmentCode": "drop_coil",
            "supportedFiberTypes": [
              "FEEDER"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          },
          {
            "assignmentStrategy": "MultiDwellingUnit",
            "nodeType": "multiple_dwelling_unit",
            "equipmentCode": "mxu_existing",
            "supportedFiberTypes": [
              "FEEDER"
            ],
            "supportedNetworkTypes": [
              "Fiber"
            ]
          }
        ]
      },
      "hubConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 3,
          "target": 40,
          "max": 35,
          "types": [
            "FS_1X32"
          ]
        },
        "outputConfig": {
          "min": 96,
          "target": 384,
          "max": 480,
          "types": [
            "FS_1X1"
          ]
        },
        "maxDistanceMeters": 3000
      },
      "terminalConfiguration": {
        "version": 3,
        "inputPort": {
          "min": 1,
          "target": 12,
          "max": 12,
          "types": [
            "FS_1X1"
          ]
        },
        "outputConfig": {
          "min": 1,
          "target": 12,
          "max": 12,
          "types": [
            "FS_1X1"
          ]
        },
        "maxDistanceMeters": 50
      },
      "fiberCapacityConfig": {
        "version": 0,
        "rules": [
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "small",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "medium",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "large",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "household",
            "fiberCapacityType": "SingleConnection",
            "atomicUnits": 1
          },
          {
            "ruleType": "AtomicUnitsPerEntity",
            "locationEntityType": "celltower",
            "fiberCapacityType": "DropCoil",
            "atomicUnits": 32
          }
        ],
        "consolidationRules": [
          {
            "capacityType": "SingleConnection",
            "strategy": "UPGRADE",
            "threshold": 5,
            "updgradedCapacityType": "MultiDwellingUnit"
          }
        ]
      },
      "routingMode": "ODN_1"
    }
  }
}
*/

export class NetworkArchitecture extends Component {
  render () {
    return <div>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <form className='d-flex flex-column rfp-options'
          style={{ height: '100%' }}
          onSubmit={event => event.preventDefault()}>
          <table className='table table-sm table-striped'>
            <tbody>

              <tr>
                <td colSpan={2}>stuff goes here</td>
              </tr>
              <tr>
                <td className='pl-4'>label</td>
                <td>
                  field
                </td>
              </tr>
              
            </tbody>
          </table>
        </form>
      </div>
    </div>
  }
}

let NetworkArchitectureForm = reduxForm({
  form: Constants.NETWORK_ARCHITECTURE
})(NetworkArchitecture)

export default NetworkArchitectureForm
