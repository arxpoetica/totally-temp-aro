class TsmEditorController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.tsmManagerConfiguration = []
    this.pristineTsmManagerConfiguration = {}
    this.tsmManagerName = ''
  }

  $onChanges(changesObj) {
    if (changesObj.tsmManagerId) {
      this.reloadTsmManagerConfiguration()
    }
  }

  reloadTsmManagerConfiguration() {
    this.$http.get(`/service/v1/tsm-manager/${this.tsmManagerId}`)
    .then((result) => {
      this.tsmManagerName = result.data.name
      this.tsmManagerNameChanged({ name: this.tsmManagerName })
    })

    this.$http.get(`/service/v1/tsm-manager/${this.tsmManagerId}/strengths`)
    .then((result) => {
      this.tsmManagerConfiguration = result.data
      this.pristineTsmManagerConfiguration = angular.copy(result.data)
    })
    .catch((err) => console.error(err))
  }

  saveConfigurationToServer() {

    // Only save those configurations that have changed
    var changedModels = []
    this.tsmManagerConfiguration.forEach((tsmModel, index) => {
      var pristineModel = this.pristineTsmManagerConfiguration[index]
      if (pristineModel) {
        // Check to see if the model has changed
        if (JSON.stringify(pristineModel) !== angular.toJson(tsmModel)) {
          var tsmModelToSend = angular.copy(tsmModel)
          delete tsmModelToSend.dimensionName   // Can't send this over to aro-service
          changedModels.push(tsmModelToSend)
        }
      }
    })

    if (changedModels.length > 0) {
      this.$http.put(`/service/v1/tsm-manager/${this.tsmManagerId}/spends`, changedModels)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
    } else {
      console.log('TSM Editor: No models were changed. Nothing to save.')
    }
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

TsmEditorController.$inject = ['$http', 'state']

let tsmEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/tsm-editor.html',
  bindings: {
    tsmManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    tsmManagerNameChanged: '&'
  },
  controller: TsmEditorController
}

export default tsmEditor