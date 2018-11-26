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
      var impedanceMapArray = Object.keys(this.impedanceManagerConfiguration.map)
                                .map(impKey => { return { key: impKey, value: this.impedanceManagerConfiguration.map[impKey] } })
                                .sort((a, b) => (a.key < b.key) ? -1 : 1)
      delete this.impedanceManagerConfiguration.map
      this.impedanceManagerConfiguration.impedanceMapArray = impedanceMapArray
    })
    .catch((err) => console.error(err))
  }

  saveConfigurationToServer() {
    // Convert the impedance array to an object that aro-service can use
    var serviceConfiguration = angular.copy(this.impedanceManagerConfiguration)
    serviceConfiguration.map = {}
    this.impedanceManagerConfiguration.impedanceMapArray.forEach((item) => serviceConfiguration.map[item.key] = item.value)
    delete serviceConfiguration.impedanceMapArray
    this.$http.put(`/service/v1/impedance-manager/${this.impedanceManagerId}/configuration`, serviceConfiguration)
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