class ImpedanceEditorController {
  constructor($http) {
    this.$http = $http
    this.impedanceManagerConfiguration = []
    this.impedanceManagerName = ''
  }

  $onChanges(changesObj) {
    if (changesObj.impedanceManagerId) {
      this.reloadImpedanceManagerConfiguration()
    }
  }

  reloadImpedanceManagerConfiguration() {
    this.$http.get(`/service/v1/impedance-manager/${this.impedanceManagerId}`)
    .then((result) => {
      this.impedanceManagerName = result.data.name
      this.impedanceManagerNameChanged({ name: this.impedanceManagerName })
    })

    this.$http.get(`/service/v1/impedance-manager/${this.impedanceManagerId}/configuration`)
    .then((result) => this.impedanceManagerConfiguration = result.data)
    .catch((err) => console.error(err))
  }

  saveConfigurationToServer() {
    this.$http.put(`/service/v1/impedance-manager/${this.impedanceManagerId}/configuration`, this.impedanceManagerConfiguration)
    .then((result) => this.exitEditingMode())
    .catch((err) => console.error(err))
  }

  exitEditingMode() {
    this.setEditingMode({ mode: this.listMode })
  }
}

ImpedanceEditorController.$inject = ['$http']

let impedanceEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/impedance-editor.html',
  bindings: {
    impedanceManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&',
    impedanceManagerNameChanged: '&'
  },
  controller: ImpedanceEditorController
}

export default impedanceEditor