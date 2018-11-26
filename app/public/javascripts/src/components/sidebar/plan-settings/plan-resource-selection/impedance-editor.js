class ImpedanceEditorController {
  constructor($http) {
    this.$http = $http
    this.impedanceManagerConfiguration = []
    this.impedanceManagerName = ''
    // "mappingLabels" should map from a impedance mapping key (e.g. 0) to a text description of the mapping
    this.mappingLabels = {
      '-1': 'Mapping -1',
      0: 'Mapping 0',
      1: 'Mapping 1',
      2: 'Mapping 2',
      3: 'Mapping 3',
      4: 'Mapping 4',
      5: 'Mapping 5'
    }
    this.orderedImpedanceMapKeys = []
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
    .then((result) => {
      this.impedanceManagerConfiguration = result.data
      // The map is a set of key value pairs, we convert it to a sorted array
      this.orderedImpedanceMapKeys = Object.keys(this.impedanceManagerConfiguration.map)
      this.orderedImpedanceMapKeys.sort((a, b) => (a < b) ? -1 : 1)
    })
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