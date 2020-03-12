class RoicEditorController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
    this.roicManagerConfiguration = []
    this.tabs = []
    this.activeTab = null
  }

  $onChanges (changesObj) {
    if (changesObj.roicManagerId) {
      this.reloadRoicManagerConfiguration()
    }
  }

  reloadRoicManagerConfiguration () {
    this.$http.get(`/service/v1/roic-manager/${this.roicManagerId}`)
      .then((result) => {
        this.roicManager = result.data
      })

    this.$http.get(`/service/v1/roic-manager/${this.roicManagerId}/configuration`)
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
        this.roicManagerConfiguration = { inputs: roicModels, roicSettingsConfiguration: result.data.roicSettingsConfiguration }
        this.tabs = [
          {
            label: 'Models',
            key: 'inputs'
          }, {
            label: 'Configuration',
            key: 'roicSettingsConfiguration'
          }
        ]
        this.activeTab = this.tabs[0].key
        this.selectedRoicModelIndex = 0
      })
      .catch((err) => console.error(err))
  }

  /*
  {
    "roicSettingsConfiguration":{
      "managerType":"roic_manager",
      "financialConstraints":{
        "cashFlowStrategyType":"EXTERNAL",
        "discountRate":0.06,
        "startYear":2019,
        "years":15,
        "terminalValueStrategy":{
          "terminalValueStrategyType":"NONE",
          "value":0.0
        },
        "penetrationAnalysisStrategy":"SCURVE",
        "connectionCostStrategy":"REUSE_CONNECTION"
      },
      "competitionConfiguration":{
        "providerStrength":1.0
      }
    },
    "inputs":[...]
  }
  */
  selectTab (tabKey) {
    this.activeTab = tabKey
  }

  selectRoicModel (index) {
    this.selectedRoicModelIndex = index
  }

  saveConfigurationToServer () {
    this.$http.put(`/service/v1/roic-manager/${this.roicManagerId}/configuration`, this.roicManagerConfiguration)
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
