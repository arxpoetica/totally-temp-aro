class ArpuEditorController {
  constructor($http) {
    this.$http = $http
    this.arpuManagerConfiguration = []
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
    .then((result) => this.arpuManagerConfiguration = result.data)
    .catch((err) => console.error(err))
  }

  saveConfigurationToServer() {
    this.$http.put(`/service/v1/arpu-manager/${this.arpuManagerId}/configuration`, this.arpuManagerConfiguration)
    .then((result) => this.exitEditingMode())
    .catch((err) => console.error(err))
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