class RateReachEditorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

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

    this.rateReachRatios = [
      { id: 'RETAIL', description: 'Retail', value: 1.0 },
      { id: 'WHOLESALE', description: 'Wholesale', value: 0.75 },
      { id: 'TOWER', description: 'Tower', value: 0.5 }
    ]

    this.technologyTypes = [
      { id: 'Fiber', description: 'Fiber' },
      { id: 'Copper', description: 'Copper' },
      { id: 'Wireless', description: 'Wireless' }
    ]
    this.selectedTechnologyType = this.technologyTypes[1]

    this.onTechnologyTypeChanged()
  }

  onTechnologyTypeChanged() {
    this.calculationStrategies = []
    this.selectedCalculationStrategy = null
    this.networkStructures = []
    this.selectedNetworkStructure = null
    this.technologies = []
    this.selectedTechnology = null
    this.rateReachValues = {}
    Promise.all([
      this.$http.get(`/service/v1/rate-reach-matrix/calc-strategies?technology_type=${this.selectedTechnologyType.id}`),
      this.$http.get(`/service/v1/rate-reach-matrix/network-structures?technology_type=${this.selectedTechnologyType.id}`),
      this.$http.get(`/service/v1/rate-reach-matrix/technologies?technology_type=${this.selectedTechnologyType.id}`)
    ])
      .then(results => {
        this.calculationStrategies = results[0].data
        this.selectedCalculationStrategy = this.calculationStrategies[0]
        this.networkStructures = results[1].data
        this.selectedNetworkStructure = this.networkStructures[0]
        this.technologies = results[2].data
        this.selectedTechnology = this.technologies[0]
        this.rateReachValues = {}
        this.technologies.forEach(technology => {
          this.rateReachValues[technology.id] = {}
          this.categoryTypes.forEach(categoryType => {
            this.rateReachValues[technology.id][categoryType.id] = {}
            this.categories[categoryType.id].forEach(category => this.rateReachValues[technology.id][categoryType.id][category.id] = 0.0)
          })
        })

        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  $onChanges(changesObj) {
    if (changesObj.rateReachManagerId) {
      // this.reloadRoicManagerConfiguration()
    }
  }

  // Generates a rate reach configuration object that we can send to aro-service, based on the currently selected options.
  selectionToAroRateReachConfiguration() {
    var aroRateReachConfiguration = {
      resourceManagerId: this.rateReachManagerId,
      categoryType: this.selectedCategoryType.id,
      categories: angular.toJson(this.categories[this.selectedCategoryType.id])
    }

    var matrixInMetersMap = {}

    this.technologies.forEach(technology => {
      var matrixKey = `TechnologyRef(name=${technology.name}, id=${technology.id})`
      matrixInMetersMap[matrixKey] = []
      const rrValues = this.rateReachValues[technology.id][this.selectedCategoryType.id]
      Object.keys(rrValues).forEach(categoryKey => {
        matrixInMetersMap[matrixKey].push(+rrValues[categoryKey])
      })
    })
    var rateReachGroupMap = {}
    rateReachGroupMap[this.selectedTechnologyType.id] = {
      technologyType: this.selectedTechnologyType.id,
      calculationStrategy: this.selectedCalculationStrategy,
      matrixInMetersMap: matrixInMetersMap,
      proximityTypes: ['TODO'],
      networkStructure: this.selectedNetworkStructure
    }
    aroRateReachConfiguration.rateReachGroupMap = rateReachGroupMap

    aroRateReachConfiguration.marketAdjustmentFactorMap = {}
    this.rateReachRatios.forEach(rateReachRatio => {
      aroRateReachConfiguration.marketAdjustmentFactorMap[rateReachRatio.id] = rateReachRatio.value
    })
    return aroRateReachConfiguration
  }

  saveConfigurationToServer() {
    const aroRateReachConfiguration = this.selectionToAroRateReachConfiguration()
    console.log(aroRateReachConfiguration)
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
    setEditingMode: '&',
    rateReachManagerNameChanged: '&'
  },
  controller: RateReachEditorController
}

export default rateReachEditor