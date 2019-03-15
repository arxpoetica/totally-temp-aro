class ImpedanceEditorController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
    this.impedanceManagerConfiguration = []
    // "mappingLabels" should map from a impedance mapping key (e.g. 0) to a text description of the mapping
    this.mappingLabels = {
      '-1': 'Unknown tile',
      0: 'Missing tile',
      1: 'Line of sight tile',
      2: 'Mapping 2',
      3: 'Light foliage/building clutter tile',
      4: 'Dense foliage tile',
      5: 'Building blocker tile'
    }
    this.orderedImpedanceMapKeys = []
  }

  $onChanges (changesObj) {
    if (changesObj.impedanceManagerId) {
      this.reloadImpedanceManagerConfiguration()
    }
  }

  reloadImpedanceManagerConfiguration () {
    this.$http.get(`/service/v1/impedance-manager/${this.impedanceManagerId}?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        this.impedanceManager = result.data
      })
      .catch(err => console.error(err))

    this.$http.get(`/service/v1/impedance-manager/${this.impedanceManagerId}/configuration?user_id=${this.state.loggedInUser.id}`)
      .then((result) => {
        this.impedanceManagerConfiguration = result.data
        // The map is a set of key value pairs, we convert it to a sorted array
        this.orderedImpedanceMapKeys = Object.keys(this.impedanceManagerConfiguration.map)
        this.orderedImpedanceMapKeys.sort((a, b) => (a < b) ? -1 : 1)
      })
      .catch((err) => console.error(err))
  }

  saveConfigurationToServer () {
    this.$http.put(`/service/v1/impedance-manager/${this.impedanceManagerId}/configuration?user_id=${this.state.loggedInUser.id}`, this.impedanceManagerConfiguration)
      .then((result) => this.exitEditingMode())
      .catch((err) => console.error(err))
  }

  exitEditingMode () {
    this.setEditingMode({ mode: this.listMode })
  }
}

ImpedanceEditorController.$inject = ['$http', 'state']

let impedanceEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/impedance-editor.html',
  bindings: {
    impedanceManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: ImpedanceEditorController
}

export default impedanceEditor
