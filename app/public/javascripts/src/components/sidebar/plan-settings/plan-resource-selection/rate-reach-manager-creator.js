class RateReachManagerCreatorController {
  constructor ($http, $timeout, state) {
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

  $onInit () {
    if (this.sourceRateReachManagerId) {
      this.$http.get(`/service/rate-reach-matrix/resource/${this.sourceRateReachManagerId}?user_id=${this.state.loggedInUser.id}`)
        .then(result => this.sourceRateReachManager = result.data)
        .catch(err => console.error(err))
    }
  }

  createRateReachManager () {
    // Create a new rate reach manager with the specified name and description
    var createUrl = `/service/rate-reach-matrix/resource?user_id=${this.state.loggedInUser.id}`
    if (this.sourceRateReachManagerId) {
      createUrl += `&source_resource_manager=${this.sourceRateReachManagerId}`
    }
    var createdRateReachManager = null
    return this.$http.post(createUrl, { name: this.newRateReachManagerName, description: this.newRateReachManagerDescription })
      .then(result => {
        createdRateReachManager = result.data
        return this.getDefaultConfiguration()
      })
      .then((defaultConfiguration) => this.$http.put(`/service/rate-reach-matrix/resource/${createdRateReachManager.id}/config?user_id=${this.state.loggedInUser.id}`, defaultConfiguration))
      .then(() => {
        this.onManagerCreated && this.onManagerCreated({ newId: createdRateReachManager.id })
        this.onManagersChanged && this.onManagersChanged()
        this.setEditingMode && this.setEditingMode({ mode: this.listMode })
        this.$timeout()
      })
      .catch((err) => console.error(err))
  }

  getDefaultConfiguration () {
    const technologyTypes = ['Fiber', 'FiberProximity', 'Copper', 'CellTower']
    const configuration = {
      managerType: 'rate_reach_manager',
      categoryType: this.selectedCategoryType.id,
      categories: [],
      rateReachGroupMap: {},
      marketAdjustmentFactorMap: {
        RETAIL: 1,
        WHOLESALE: 1,
        TOWER: 1
      }
    }

    var configPromises = []
    technologyTypes.forEach(technologyType => {
      configuration.rateReachGroupMap[technologyType] = {
        technologyType: technologyType
      }

      const configPromise = Promise.all([
        this.$http.get(`/service/rate-reach-matrix/network-structures?technology_type=${technologyType}&user_id=${this.state.loggedInUser.id}`),
        this.$http.get(`/service/rate-reach-matrix/technologies?technology_type=${technologyType}&user_id=${this.state.loggedInUser.id}`)
      ])
        .then(results => {
          configuration.rateReachGroupMap[technologyType].active = false
          configuration.rateReachGroupMap[technologyType].networkStructure = results[0].data[0]
          configuration.rateReachGroupMap[technologyType].matrixMap = {}
          results[1].data.forEach(technology => {
            configuration.rateReachGroupMap[technologyType].matrixMap[technology.id] = []
          })
        })
        .catch(err => console.error(err))

      configPromises.push(configPromise)
    })

    return Promise.all(configPromises)
      .then(() => Promise.resolve(configuration))
      .catch(err => console.error(err))
  }

  closeDialog () {
    this.setEditingMode && this.setEditingMode({ mode: this.listMode })
  }
}

RateReachManagerCreatorController.$inject = ['$http', '$timeout', 'state']

let rateReachManagerCreator = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/rate-reach-manager-creator.html',
  bindings: {
    sourceRateReachManagerId: '<',
    technologyTypeDetails: '<',
    onManagerCreated: '&',
    onManagersChanged: '&',
    listMode: '<',
    setEditingMode: '&'
  },
  controller: RateReachManagerCreatorController
}

export default rateReachManagerCreator
