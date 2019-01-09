class RateReachEditorController {
  constructor($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.categoryDescription = {
      SPEED: 'Speeds',
      BAND: 'Speed Bands'
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

  reloadRateReachManagerConfiguration() {
    this.$http.get(`/service/rate-reach-matrix/resource/${this.rateReachManagerId}`)
      .then(result => this.rateReachManager = result.data)
      .catch(err => console.error(err))

    this.$http.get(`/service/rate-reach-matrix/resource/${this.rateReachManagerId}/config`)
      .then(result => {
        this.rateReachConfig = result.data
        this.loadAllTechnologyTypeDetails()
        this.$timeout()
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
    return Promise.all([
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
      this.reloadRateReachManagerConfiguration()
    }
  }

  saveConfigurationToServer() {
    const configuration = JSON.parse(angular.toJson(this.rateReachConfig))  // Remove angularjs-specific properties from object
    this.$http.put(`/service/rate-reach-matrix/resource/${this.rateReachManagerId}/config`, configuration)
      .then(result => this.exitEditingMode())
      .catch(err => console.error(err))
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

RateReachEditorController.$inject = ['$http', '$timeout']

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