class CompetitorEditorController {
  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.competitorManagerConfiguration = []
    this.pristineCompetitorManagerConfiguration = {}
  }

  $onChanges(changesObj) {
    if (changesObj.competitorManagerId) {
      this.reloadCompetitionManagerConfiguration()
    }
  }

  reloadCompetitionManagerConfiguration() {
    this.$http.get(`/service/v1/competitor-manager/${this.competitorManagerId}`)
      .then((result) => {
        this.competitorManager = result.data
      })
      .catch(err => console.error(err))

    this.$http.get(`/service/v1/competitor-manager/${this.competitorManagerId}/strengths`)
    .then((result) => {
      this.competitorManagerConfiguration = result.data
      this.pristineCompetitorManagerConfiguration = angular.copy(result.data)
    })
    .catch((err) => console.error(err))
  }

  saveConfigurationToServer() {

    // Only save those configurations that have changed
    var changedModels = []
    this.competitorManagerConfiguration.forEach((competitorModel, index) => {
      var pristineModel = this.pristineCompetitorManagerConfiguration[index]
      if (pristineModel) {
        // Check to see if the model has changed
        if (JSON.stringify(pristineModel) !== angular.toJson(competitorModel)) {
          // Only copy over the properties that we can send to aro-service
          const changedModel = {
            carrierId: competitorModel.carrierId,
            providerTypeId: competitorModel.providerTypeId,
            resourceManagerId: competitorModel.resourceManagerId,
            strength: competitorModel.strength
          }
          changedModels.push(changedModel)
        }
      }
    })

    if (changedModels.length > 0) {
      this.$http.put(`/service/v1/competitor-manager/${this.competitorManagerId}/strengths`, changedModels)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
    } else {
      console.log('Competitor Editor: No models were changed. Nothing to save.')
    }
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

CompetitorEditorController.$inject = ['$http', 'state']

let competitorEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/competitor-editor.html',
  bindings: {
    competitorManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: CompetitorEditorController
}

export default competitorEditor