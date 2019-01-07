class RateReachManagerCreatorController {
  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
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
    var createUrl = '/service/v1/rate-reach-matrix'
    if (this.sourceRateReachManagerId) {
      createUrl += `?source_resource_manager=${this.sourceRateReachManagerId}`
    }
    // return this.$http.post(createUrl, { name: this.newRateReachManagerName, description: this.newRateReachManagerDescription })
    //   .then(() => {
    //     this.onManagersChanged && this.onManagersChanged()
    //     this.setEditingMode && this.setEditingMode({ mode: this.listMode })
    //     this.$timeout()
    //   })
    //   .catch((err) => console.error(err))
    this.onManagersChanged && this.onManagersChanged()
    this.setEditingMode && this.setEditingMode({ mode: this.listMode })
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
    onManagersChanged: '&',
    listMode: '<',
    setEditingMode: '&'
  },
  controller: RateReachManagerCreatorController
}

export default rateReachManagerCreator