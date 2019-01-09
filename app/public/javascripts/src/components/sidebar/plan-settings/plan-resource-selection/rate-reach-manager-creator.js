class RateReachManagerCreatorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state

    this.categoryTypes = [
      { id: 'SPEED', description: 'Speeds' },
      { id: 'BAND', description: 'Speed Bands' }
    ]
    this.selectedCategoryType = this.categoryTypes[0]
    this.newRateReachManagerName = 'New Rate Reach Manager'
    this.newRateReachManagerDescription = 'New Rate Reach Manager Description'
    this.sourceRateReachManager = null
  }

  $onInit() {
    if (this.sourceRateReachManagerId) {
      this.$http.get(`/service/v1/rate-reach-matrix/${this.sourceRateReachManagerId}`)
        .then(result => this.sourceRateReachManager = result.data)
        .catch(err => console.error(err))
    }
  }

  createRateReachManager() {
    // Create a new rate reach manager with the specified name and description
    var createUrl = '/service/rate-reach-matrix/resource'
    if (this.sourceRateReachManagerId) {
      createUrl += `?source_resource_manager=${this.sourceRateReachManagerId}`
    }
    var createdRateReachManager = null
    return this.$http.post(createUrl, { name: this.newRateReachManagerName, description: this.newRateReachManagerDescription })
      .then(result => {
        createdRateReachManager = result.data
        return this.getDefaultConfiguration()
      })
      .then((defaultConfiguration) => this.$http.put(`/service/rate-reach-matrix/resource/${createdRateReachManager.id}/config`, defaultConfiguration))
      .then(() => {
        this.onManagersChanged && this.onManagersChanged()
        this.setEditingMode && this.setEditingMode({ mode: this.listMode })
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  getDefaultConfiguration() {
    const technologyTypes = ['Copper', 'Fiber', 'FiveG', 'Mixed']
    const configuration = {
      managerType: 'rate_reach_manager',
      categoryType: this.selectedCategoryType.id,
      categories: [],
      rateReachGroupMap: {},
      marketAdjustmentFactorMap: {}
    }

    var configPromises = []
    technologyTypes.forEach(technologyType => {
      configuration.rateReachGroupMap[technologyType] = {
        technologyType: technologyType
      }

      const configPromise = Promise.all([
        this.$http.get(`/service/rate-reach-matrix/calc-strategies?technology_type=${technologyType}`),
        this.$http.get(`/service/rate-reach-matrix/network-structures?technology_type=${technologyType}`),
        this.$http.get(`/service/rate-reach-matrix/technologies?technology_type=${technologyType}`)
      ])
        .then(results => {
          configuration.rateReachGroupMap[technologyType].calculationStrategy = results[0].data[0]
          configuration.rateReachGroupMap[technologyType].networkStructure = results[1].data[0]
          if (configuration.rateReachGroupMap[technologyType].calculationStrategy === 'CABLE_PROXIMITY') {
            configuration.rateReachGroupMap[technologyType].proximityTypes = ['DISTRIBUTION']
          }
          configuration.rateReachGroupMap[technologyType].matrixInMetersMap = {}
          results[2].data.forEach(technology => {
            configuration.rateReachGroupMap[technologyType].matrixInMetersMap[technology.id] = []
          })
        })
        .catch(err => console.error(err))

      configPromises.push(configPromise)
    })

    return Promise.all(configPromises)
      .then(() => { console.log(configuration); return Promise.resolve()})
      .then(() => Promise.resolve(configuration))
      .catch(err => console.error(err))
  }

  closeDialog() {
    this.setEditingMode && this.setEditingMode({ mode: this.listMode })
  }
}

RateReachManagerCreatorController.$inject = ['$http', '$timeout', 'state']

let rateReachManagerCreator = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-manager-creator.html',
  bindings: {
    sourceRateReachManagerId: '<',
    technologyTypeDetails: '<',
    onManagersChanged: '&',
    listMode: '<',
    setEditingMode: '&'
  },
  controller: RateReachManagerCreatorController
}

export default rateReachManagerCreator