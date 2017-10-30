class ResourceManagerController {
  constructor() {
    this.selectedResourceItem = null
  }

  $doCheck() {
    if (this.resourceItems !== this.previousResourceItems) {
      var keys = Object.keys(this.resourceItems)
      this.selectedResourceItem = keys.length > 0 ? keys[0] : null
      this.previousResourceItems = this.resourceItems
    }
  }
}

//ResourceManagerController.$inject = ['']

app.component('resourceManager', {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager-component.html',
  bindings: {
    resourceItems: '<'
  },
  controller: ResourceManagerController
})