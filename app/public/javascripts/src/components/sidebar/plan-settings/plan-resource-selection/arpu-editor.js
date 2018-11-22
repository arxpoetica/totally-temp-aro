class ArpuEditorController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.arpuManagerConfiguration = []
    this.pristineArpuManagerConfiguration = {}
    this.arpuManagerName = ''
    this.speedCategoryHelp = null
  }

  $onChanges(changesObj) {
    if (changesObj.arpuManagerId) {
      this.reloadArpuManagerConfiguration()
    }
  }

  reloadArpuManagerConfiguration() {
    this.$http.get(`/service/v1/arpu-manager/${this.arpuManagerId}`)
    .then((result) => {
      this.arpuManagerName = result.data.name
      this.arpuManagerNameChanged({ name: this.arpuManagerName })
    })

    this.$http.get(`/service/v1/arpu-manager/${this.arpuManagerId}/configuration`)
    .then((result) => {
      var arpuModels = []
      // Sort the arpu models based on the locationTypeEntity
      const locationEntityOrder = ['household', 'small', 'medium', 'large', 'celltower']
      locationEntityOrder.forEach(locationEntity => {
        const filteredModels = result.data.arpuModels
                                .filter(item => item.id.locationEntityType === locationEntity)
                                .sort((a, b) => (a.id.speedCategory < b.id.speedCategory) ? -1 : 1)
        arpuModels = arpuModels.concat(filteredModels)
      })
      this.arpuManagerConfiguration = { arpuModels: arpuModels }
      this.selectedArpuModelIndex = 0
      this.pristineArpuManagerConfiguration = {}
      var copyOfModels = angular.copy(this.arpuManagerConfiguration.arpuModels)
      copyOfModels.forEach((arpuModel) => {
        // Create a key from the "id" object
        var arpuKey = JSON.stringify(arpuModel.id)
        this.pristineArpuManagerConfiguration[arpuKey] = arpuModel
      })
    })
    .catch((err) => console.error(err))
  }

  selectArpuModel(index) {
    this.selectedArpuModelIndex = index
  }

  saveConfigurationToServer() {

    // Only save those configurations that have changed
    var changedModels = []
    this.arpuManagerConfiguration.arpuModels.forEach((arpuModel) => {
      var arpuKey = JSON.stringify(arpuModel.id)
      var pristineModel = this.pristineArpuManagerConfiguration[arpuKey]
      if (pristineModel) {
        // Check to see if the model has changed
        if (JSON.stringify(pristineModel) !== angular.toJson(arpuModel)) {
          changedModels.push(arpuModel)
        }
      }
    })

    if (changedModels.length > 0) {
      this.$http.put(`/service/v1/arpu-manager/${this.arpuManagerId}/configuration`, changedModels)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
    } else {
      console.log('ARPU Editor: No models were changed. Nothing to save.')
    }
  }

  showSpeedCategoryHelp(category) {
    this.speedCategoryHelp = this.state.configuration.resourceEditors.speedCategoryHelp[category] || this.state.configuration.resourceEditors.speedCategoryHelp.default
  }

  hideSpeedCategoryHelp() {
    this.speedCategoryHelp = null
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

ArpuEditorController.$inject = ['$http', 'state']

let arpuEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/arpu-editor.html',
  bindings: {
    arpuManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    arpuManagerNameChanged: '&'
  },
  controller: ArpuEditorController
}

export default arpuEditor