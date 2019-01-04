class RateReachEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.rateReachManager = { name: 'Default Rate Reach Manager' }
    this.categoryTypes = [
      { id: 'SPEED', description: 'Speeds' },
      { id: 'BAND', description: 'Speed Bands' }
    ]
    this.selectedCategoryType = this.categoryTypes[0]

    this.categories = {
      SPEED: [
        { id: 1, name: '1 Mbps', description: '1 Mbps' },
        { id: 3, name: '3 Mbps', description: '3 Mbps' },
        { id: 4, name: '4 Mbps', description: '4 Mbps' },
        { id: 6, name: '6 Mbps', description: '6 Mbps' },
        { id: 12, name: '12 Mbps', description: '12 Mbps' },
        { id: 15, name: '15 Mbps', description: '15 Mbps' },
        { id: 20, name: '20 Mbps', description: '20 Mbps' },
        { id: 24, name: '24 Mbps', description: '24 Mbps' },
        { id: 25, name: '25 Mbps', description: '25 Mbps' }
      ],
      BAND: [
        { id: 1001, name: 'Far net', description: 'Far net' },
        { id: 1002, name: 'Medium net', description: 'Medium net' },
        { id: 1003, name: 'On net', description: 'On net' }
      ]
    }

    this.rateReachRatioDescription = {
      RETAIL: 'Retail',
      WHOLESALE: 'Wholesale',
      TOWER: 'Tower'
    }
    this.selectedTechnologyType = 'Copper'

    this.proximityTypes = [
      { id: 'ROOT', description: 'Root' },
      { id: 'BACKBONE', description: 'Backbone' },
      { id: 'FEEDER', description: 'Feeder' },
      { id: 'DISTRIBUTION', description: 'Distribution' },
      { id: 'DROP', description: 'Drop' },
      { id: 'IOF', description: 'IOF' },
      { id: 'COPPER', description: 'Copper' }
    ]

    this.editingModes = Object.freeze({
      SPEEDS: 'SPEEDS',
      RATE_REACH_RATIOS: 'RATE_REACH_RATIOS'
    })
    this.selectedEditingMode = this.editingModes.SPEEDS

    this.rateReachValues = {
      resourceManagerId: 99,
      categoryType: 'SPEED',
      categories: [
        {
          id: 1,
          name: '1 MBps',
          description: '1 MBps'
        },
        {
          id: 5,
          name: '5 MBps',
          description: '5 MBps'
        }
      ],
      rateReachGroupMap: {
        Copper: {
          technologyType: 'Copper',
          matrixInMetersMap: {
            ADSL: [
              10001,
              5002
            ],
            VDSL: [
              10003,
              5004
            ]
          },
          calculationStrategy: 'NODE',
          proximityTypes: [
            'DISTRIBUTION'
          ],
          networkStructure: 'COPPER'
        },
        Fiber: {
          technologyType: 'Copper',
          matrixInMetersMap: {
            ADSL: [
              10005,
              5006
            ],
            VDSL: [
              10007,
              5008
            ]
          },
          calculationStrategy: 'NODE',
          proximityTypes: [
            'DISTRIBUTION'
          ],
          networkStructure: 'COPPER'
        },
        Wireless: {
          technologyType: 'Copper',
          matrixInMetersMap: {
            ADSL: [
              10000,
              5000
            ],
            VDSL: [
              10000,
              5000
            ]
          },
          calculationStrategy: 'NODE',
          proximityTypes: [
            'DISTRIBUTION'
          ],
          networkStructure: 'COPPER'
        }
      },
      marketAdjustmentFactorMap: {
        RETAIL: 1,
        WHOLESALE: 0.75,
        TOWER: 0.5
      }
    }

    this.loadAllTechnologyTypeDetails()
  }

  loadAllTechnologyTypeDetails() {
    this.technologyTypeDetails = {}
    var ttPromises = []
    Object.keys(this.rateReachValues.rateReachGroupMap).forEach(technologyType => {
      ttPromises.push(this.loadTechnologyTypeDetails(technologyType))
    })
    Promise.all(ttPromises)
      .then(results => this.$timeout())
      .catch(err => console.error(err))
  }

  loadTechnologyTypeDetails(technologyType) {
    Promise.all([
      this.$http.get(`/service/v1/rate-reach-matrix/calc-strategies?technology_type=${technologyType}`),
      this.$http.get(`/service/v1/rate-reach-matrix/network-structures?technology_type=${technologyType}`),
      this.$http.get(`/service/v1/rate-reach-matrix/technologies?technology_type=${technologyType}`)
    ])
      .then(results => {
        this.technologyTypeDetails[technologyType] = {
          calculationStrategies: results[0].data,
          networkStructures: results[1].data,
          technologies: results[2].data
        }
        return Promise.resolve()
      })
      .catch(err => console.error(err))
  }

  $onChanges(changesObj) {
    if (changesObj.rateReachManagerId) {
      // this.reloadRoicManagerConfiguration()
    }
  }

  saveConfigurationToServer() {
    console.log(JSON.parse(angular.toJson(this.rateReachValues)))
    // this.$http.put(`/service/v1/rate-reach-matrix/${this.rateReachManagerId}`, aroRateReachConfiguration)
    //   .then(res => console.log('Configuration saved successfully'))
    //   .catch(err => console.error(err))
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

RateReachEditorController.$inject = ['$http', '$timeout', 'state']

let rateReachEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-editor.html',
  bindings: {
    rateReachManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: RateReachEditorController
}

export default rateReachEditor