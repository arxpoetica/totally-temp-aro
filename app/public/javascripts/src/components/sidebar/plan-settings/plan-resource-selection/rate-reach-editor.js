class RateReachEditorController {
  constructor($http, $timeout) {
    this.$http = $http
    this.$timeout = $timeout
    this.categoryDescription = {
      SPEED: 'Speeds',
      BAND: 'Bands'
    }

    this.rateReachRatioDescription = {
      RETAIL: 'Retail',
      WHOLESALE: 'Wholesale',
      TOWER: 'Tower'
    }
    this.selectedTechnologyType = 'Copper'

    this.editingModes = Object.freeze({
      SPEEDS: 'SPEEDS',
      RATE_REACH_RATIOS: 'RATE_REACH_RATIOS'
    })
    this.selectedEditingMode = this.editingModes.SPEEDS
    this.matrixOrders = {}
  }

  reloadRateReachManagerConfiguration() {
    this.$http.get(`/service/rate-reach-matrix/resource/${this.rateReachManagerId}`)
      .then(result => this.rateReachManager = result.data)
      .catch(err => console.error(err))

    this.$http.get(`/service/rate-reach-matrix/resource/${this.rateReachManagerId}/config`)
      .then(result => {
        this.rateReachConfig = result.data
        return this.loadAllTechnologyTypeDetails()
      })
      .then(() => {
        this.rateReachConfig = this.matrixMapsToOrderedArray(this.rateReachConfig)
        this.$timeout()
      })
      .catch(err => console.error(err))
  }

  // Replaces matrix maps with ordered arrays and returns a new rate reach configuration. Used to show
  // matrix maps in the correct order in the UI
  matrixMapsToOrderedArray(rateReachConfig) {
    Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      var matrixMap = rateReachConfig.rateReachGroupMap[technologyType].matrixMap
      var orderedMatrixMap = []  // Note, we are converting to an array
      Object.keys(matrixMap).forEach(key => {
        orderedMatrixMap.push({
          id: key,
          value: matrixMap[key]
        })
      })
      // At the point the array is unordered. Order it!
      orderedMatrixMap.sort((a, b) => {
        // Slow check for indexOfs, but the array is small
        const aIndex = this.matrixOrders[technologyType].findIndex(item => item.id === a.id)
        const bIndex = this.matrixOrders[technologyType].findIndex(item => item.id === b.id)
        return (aIndex < bIndex) ? -1 : 1
      })
      rateReachConfig.rateReachGroupMap[technologyType].matrixMap = orderedMatrixMap
    })
    return rateReachConfig
  }

  // Replaces ordered arrays with matrix maps and returns a new rate reach configuration. Used to convert
  // from ui-specific arrays to something that aro-service can process.
  orderedArrayToMatrixMaps(rateReachConfig) {
    Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      var matrixMapArray = rateReachConfig.rateReachGroupMap[technologyType].matrixMap
      var matrixMap = {}
      matrixMapArray.forEach(item => {
        matrixMap[item.id] = item.value
      })
      rateReachConfig.rateReachGroupMap[technologyType].matrixMap = matrixMap
    })
    return rateReachConfig
  }

  loadAllTechnologyTypeDetails() {
    this.technologyTypeDetails = {}
    var ttPromises = []
    Object.keys(this.rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      ttPromises.push(this.loadTechnologyTypeDetails(technologyType))
    })
    return Promise.all(ttPromises)
      .then(results => this.$timeout())
      .catch(err => console.error(err))
  }

  loadTechnologyTypeDetails(technologyType) {
    return Promise.all([
      this.$http.get(`/service/rate-reach-matrix/network-structures?technology_type=${technologyType}`),
      this.$http.get(`/service/rate-reach-matrix/technologies?technology_type=${technologyType}`)
    ])
      .then(results => {
        this.technologyTypeDetails[technologyType] = {
          networkStructures: results[0].data,
          technologies: {}
        }
        this.matrixOrders[technologyType] = results[1].data
        results[1].data.forEach(technology => {
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
    var configuration = JSON.parse(angular.toJson(this.rateReachConfig))  // Remove angularjs-specific properties from object
    configuration = this.orderedArrayToMatrixMaps(configuration)          // Transform object in aro-service format
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