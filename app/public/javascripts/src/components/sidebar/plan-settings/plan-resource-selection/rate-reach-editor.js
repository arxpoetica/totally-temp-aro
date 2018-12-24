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
        { id: 1, description: '1 Mbps' },
        { id: 3, description: '3 Mbps' },
        { id: 4, description: '4 Mbps' },
        { id: 6, description: '6 Mbps' },
        { id: 12, description: '12 Mbps' },
        { id: 15, description: '15 Mbps' },
        { id: 20, description: '20 Mbps' },
        { id: 24, description: '24 Mbps' },
        { id: 25, description: '25 Mbps' }
      ],
      BAND: [
        { id: 1001, description: 'Far net' },
        { id: 1002, description: 'Medium net' },
        { id: 1003, description: 'On net' }
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
            this.categories[categoryType.id].forEach(category => this.rateReachValues[technology.id][category.id] = 0.0)
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