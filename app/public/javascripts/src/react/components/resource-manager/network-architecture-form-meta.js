// these should be retrieved dynamically
// really NetworkArchitectureFormMeta should be too

const FsTypes = [
  'FS_1X1',
  'FS_1X4',
  'FS_1X8',
  'FS_1X16',
  'FS_1X32'
]

const FiberTypes = [
  'DISTRIBUTION',
  'FEEDER'
]

const NetworkTypes = [
  'Fiber',
  'Copper',
  'FiveG'
]

const FiberCapacityTypes = [
  'SingleConnection',
  'DropCoil'
]

const DistanceConstraintTypes = [
  'HONOR_DISTANCE',
  'ALWAYS_CONNECT'
]

const NetworkArchitectureFormMeta = Object.freeze({
  '_meta': {
    'displayType': 'object',
    'displayName': '',
    'options': [

    ]
  },
  'managerType': {
    '_meta': {
      'displayOnly': true,
      'displayType': 'text',
      'displayName': '',
      'options': [

      ]
    }
  },
  'networkConfigurations': {
    '_meta': {
      'displayType': 'object',
      'displayName': '',
      'options': [

      ]
    },
    'DIRECT_ROUTING': {
      '_meta': {
        'displayType': 'object',
        'displayName': '',
        'options': [

        ]
      },
      'fiberConstraintConfig': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'maxFiberDistance': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'maxNetworkNodeToEdgeDistance': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'maxLocationToEdgeDistance': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'entityDistanceMap': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'celltower': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          }
        },
        'equipmentDistanceMap': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'fiber_distribution_hub': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'multiple_dwelling_unit': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'olt': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          }
        },
        'inferCoWhenAbsent': {
          '_meta': {
            'displayType': 'checkbox',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'bulkFiberConfig': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'bulkConnectorConfig': {
          '0': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'assignmentStrategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'nodeType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'equipmentCode': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'supportedFiberTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': FiberTypes
              }
            },
            'supportedNetworkTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': NetworkTypes
              }
            }
          },
          '1': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'assignmentStrategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'nodeType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'equipmentCode': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'supportedFiberTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': FiberTypes
              }
            },
            'supportedNetworkTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': NetworkTypes
              }
            }
          },
          '2': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'assignmentStrategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'nodeType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'equipmentCode': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'supportedFiberTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': FiberTypes
              }
            },
            'supportedNetworkTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': NetworkTypes
              }
            }
          },
          '3': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'assignmentStrategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'nodeType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'equipmentCode': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'supportedFiberTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': FiberTypes
              }
            },
            'supportedNetworkTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': NetworkTypes
              }
            }
          },
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'hubConfiguration': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'inputPort': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'outputConfig': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'maxDistanceMeters': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'terminalConfiguration': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'inputPort': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'outputConfig': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'maxDistanceMeters': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'optimizeSpans': {
          '_meta': {
            'displayType': 'checkbox',
            'displayName': '',
            'options': [

            ]
          }
        },
        'distanceConstraintStrategy': {
          '_meta': {
            'displayType': 'dropdownList',
            'displayName': 'Distance Constraint Strategy',
            'options': DistanceConstraintTypes,
          },
        },
      },
      'fiberCapacityConfig': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'rules': {
          '0': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '1': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '2': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '3': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '4': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          }
        },
        'consolidationRules': {
          '0': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'capacityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
              }
            },
            'strategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'threshold': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            },
            'updgradedCapacityType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'routingMode': {
        '_meta': {
          'displayOnly': true,
          'displayType': 'text',
          'displayName': '',
          'options': [

          ]
        }
      }
    },
    'ODN_1': {
      '_meta': {
        'displayType': 'object',
        'displayName': '',
        'options': [

        ]
      },
      'fiberConstraintConfig': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'maxFiberDistance': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'maxNetworkNodeToEdgeDistance': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        // 'maxLocationToEdgeDistance': {
        //   '_meta': {
        //     'displayType': 'number',
        //     'displayName': '',
        //     'options': [

        //     ]
        //   }
        // },
        'entityDistanceMap': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'celltower': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          }
        },
        'equipmentDistanceMap': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'fiber_distribution_hub': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'multiple_dwelling_unit': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'olt': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          }
        },
        'inferCoWhenAbsent': {
          '_meta': {
            'displayType': 'checkbox',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'bulkFiberConfig': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'bulkConnectorConfig': {
          '0': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'assignmentStrategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'nodeType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'equipmentCode': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'supportedFiberTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': FiberTypes
              }
            },
            'supportedNetworkTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': NetworkTypes
              }
            }
          },
          '1': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'assignmentStrategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'nodeType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'equipmentCode': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'supportedFiberTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': FiberTypes
              }
            },
            'supportedNetworkTypes': {
              '_meta': {
                'displayType': 'multiSelect',
                'displayName': '',
                'options': NetworkTypes
              }
            }
          },
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'hubConfiguration': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'inputPort': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'outputConfig': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'maxDistanceMeters': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'terminalConfiguration': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'inputPort': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'outputConfig': {
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          },
          'min': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'target': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'max': {
            '_meta': {
              'displayType': 'number',
              'displayName': '',
              'options': [

              ]
            }
          },
          'types': {
            '_meta': {
              'displayType': 'multiSelect',
              'displayName': '',
              'options': FsTypes
            }
          }
        },
        'maxDistanceMeters': {
          '_meta': {
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'optimizeSpans': {
          '_meta': {
            'displayType': 'checkbox',
            'displayName': '',
            'options': [

            ]
          }
        },
        'distanceConstraintStrategy': {
          '_meta': {
            'displayType': 'dropdownList',
            'displayName': 'Distance Constraint Strategy',
            'options': DistanceConstraintTypes,
          },
        },
      },
      'fiberCapacityConfig': {
        '_meta': {
          'displayType': 'object',
          'displayName': '',
          'options': [

          ]
        },
        'version': {
          '_meta': {
            'displayOnly': true,
            'displayType': 'number',
            'displayName': '',
            'options': [

            ]
          }
        },
        'rules': {
          '0': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '1': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '2': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '3': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '4': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'ruleType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'locationEntityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'fiberCapacityType': {
              '_meta': {
                'displayType': 'dropdownList',
                'displayName': '',
                'options': FiberCapacityTypes
              }
            },
            'atomicUnits': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          }
        },
        'consolidationRules': {
          '0': {
            '_meta': {
              'displayType': 'object',
              'displayName': '',
              'options': [

              ]
            },
            'capacityType': {
              '_meta': {
                'displayOnly': true,
                'displayType': 'text',
                'displayName': '',
              }
            },
            'strategy': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            },
            'threshold': {
              '_meta': {
                'displayType': 'number',
                'displayName': '',
                'options': [

                ]
              }
            },
            'updgradedCapacityType': {
              '_meta': {
                'displayType': 'text',
                'displayName': '',
                'options': [

                ]
              }
            }
          },
          '_meta': {
            'displayType': 'object',
            'displayName': '',
            'options': [

            ]
          }
        }
      },
      'routingMode': {
        '_meta': {
          'displayOnly': true,
          'displayType': 'text',
          'displayName': '',
          'options': [

          ]
        }
      }
    }
  }
})

export default NetworkArchitectureFormMeta
