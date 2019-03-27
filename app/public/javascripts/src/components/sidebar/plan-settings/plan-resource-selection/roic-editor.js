class RoicEditorController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
    this.roicManagerConfiguration = []
  }

  $onChanges (changesObj) {
    if (changesObj.roicManagerId) {
      this.reloadRoicManagerConfiguration()
    }
  }

  reloadRoicManagerConfiguration () {
    this.$http.get(`/service/v1/roic-manager/${this.roicManagerId}?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        this.roicManager = result.data
      })

    this.$http.get(`/service/v1/roic-manager/${this.roicManagerId}/configuration?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        var roicModels = []
        // Sort the roic models based on the locationTypeEntity
        const locationEntityOrder = ['household', 'smallBusiness', 'mediumBusiness', 'largeBusiness', 'cellTower']
        locationEntityOrder.forEach(locationEntity => {
          const filteredModels = result.data.inputs
            .filter(item => item.id.entityType === locationEntity)
            .sort((a, b) => (a.id.speedCategory < b.id.speedCategory) ? -1 : 1)
          roicModels = roicModels.concat(filteredModels)
        })
        this.roicManagerConfiguration = { inputs: roicModels }
        this.selectedRoicModelIndex = 0
      })
      .catch((err) => console.error(err))
  }

  selectRoicModel (index) {
    this.selectedRoicModelIndex = index
  }

  saveConfigurationToServer () {
    this.$http.put(`/service/v1/roic-manager/${this.roicManagerId}/configuration?user_id=${this.state.loggedInUser.id}`, this.roicManagerConfiguration)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
  }

  exitEditingMode () {
    this.setEditingMode({ mode: this.listMode })
  }

  showSpeedCategoryHelp (category) {
    this.speedCategoryHelp = this.state.configuration.resourceEditors.speedCategoryHelp[category] || this.state.configuration.resourceEditors.speedCategoryHelp.default
  }

  hideSpeedCategoryHelp () {
    this.speedCategoryHelp = null
  }
}

RoicEditorController.$inject = ['$http', 'state']

let roicEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/roic-editor.html',
  bindings: {
    roicManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: RoicEditorController
}

export default roicEditor
