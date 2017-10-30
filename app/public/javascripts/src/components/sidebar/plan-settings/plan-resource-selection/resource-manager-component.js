class ResourceManagerController {
  constructor() {
  }

  onSelectedResourceItemChanged() {
    this.selectedResourceManager = this.resourceItems[this.selectedResourceKey].allManagers[0]
  }

  createBlankManager() {
    this.setEditingMode({ mode: this.editMode })
  }
}

//ResourceManagerController.$inject = ['']

app.component('resourceManager', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager-component.html',
  bindings: {
    resourceItems: '<',
    selectedResourceKey: '=',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: ResourceManagerController
})