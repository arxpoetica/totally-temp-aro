class RateReachEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.rateReachManager = { name: 'Default Rate Reach Manager' }
    this.categoryDescription = {
      SPEED: 'Speeds',
      BAND: 'Speed Bands'
    }

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
  }

  $onInit() {
    this.$http.get(`/service/rate-reach-matrix/resource/${this.rateReachManagerId}/config`)
      .then(result => {
        this.rateReachConfig = result.data
        this.loadAllTechnologyTypeDetails()
      })
      .catch(err => console.error(err))
  }

  loadAllTechnologyTypeDetails() {
    this.technologyTypeDetails = {}
    var ttPromises = []
    Object.keys(this.rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      ttPromises.push(this.loadTechnologyTypeDetails(technologyType))
    })
    Promise.all(ttPromises)
      .then(results => this.$timeout())
      .catch(err => console.error(err))
  }

  loadTechnologyTypeDetails(technologyType) {
    Promise.all([
      this.$http.get(`/service/rate-reach-matrix/calc-strategies?technology_type=${technologyType}`),
      this.$http.get(`/service/rate-reach-matrix/network-structures?technology_type=${technologyType}`),
      this.$http.get(`/service/rate-reach-matrix/technologies?technology_type=${technologyType}`)
    ])
      .then(results => {
        this.technologyTypeDetails[technologyType] = {
          calculationStrategies: results[0].data,
          networkStructures: results[1].data,
          technologies: {}
        }
        results[2].data.forEach(technology => {
          this.technologyTypeDetails[technologyType].technologies[technology.id] = technology
        })
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
    console.log(JSON.parse(angular.toJson(this.rateReachConfig)))
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