class ArpuEditorController {
  constructor($http) {
    this.$http = $http
    this.arpuManagerConfiguration = []
    this.pristineArpuManagerConfiguration = {}
    this.arpuManagerName = ''
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
      this.arpuManagerConfiguration = result.data
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
      console.log(changedModels)
      this.$http.put(`/service/v1/arpu-manager/${this.arpuManagerId}/configuration`, changedModels)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
    } else {
      console.log('ARPU Editor: No models were changed. Nothing to save.')
    }
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

ArpuEditorController.$inject = ['$http']

app.component('arpuEditor', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/arpu-editor-component.html',
  bindings: {
    arpuManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    arpuManagerNameChanged: '&'
  },
  controller: ArpuEditorController
})