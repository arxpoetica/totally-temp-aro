class RoicEditorController {
  constructor($http) {
    this.$http = $http
    this.roicManagerConfiguration = []
    this.roicManagerName = ''
  }

  $onChanges(changesObj) {
    if (changesObj.roicManagerId) {
      this.reloadRoicManagerConfiguration()
    }
  }

  reloadRoicManagerConfiguration() {
    this.$http.get(`/service/v1/roic-manager/${this.roicManagerId}/configuration`)
    .then((result) => this.roicManagerConfiguration = result.data)
    .catch((err) => console.error(err))
  }

  saveConfigurationToServer() {
    this.$http.put(`/service/v1/roic-manager/${this.roicManagerId}/configuration`, this.roicManagerConfiguration)
    .then((result) => this.exitEditingMode())
    .catch((err) => console.error(err))
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

RoicEditorController.$inject = ['$http']

app.component('roicEditor', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/roic-editor-component.html',
  bindings: {
    roicManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    roicManagerNameChanged: '&'
  },
  controller: RoicEditorController
})