
class ResourceManagerDetailController {
  constructor (state) {
    this.state = state
    this.isChanges = false
  }
  
  registerSaveAccessCallback (saveResourceAccess) {
    // We will call this function in resource-permissions-editor when we want to save the access settings for a data source.
    // Note that this will get overwritten every time we open a datasources access editor (and only one editor can be active at a time).
    this.saveResourceAccess = saveResourceAccess
  }
  
  saveAccessSettings (dataSource) {
    console.log(this.resourceManager)
    // This will call a function into the resource permissions editor that will do the actual save
    this.isChanges = false
    if (this.saveResourceAccess) {
      this.saveResourceAccess()
      // --- ToDo: check that this section is still needed 
      .then(() => Promise.all([
        this.state.loadPlanDataSelectionFromServer(),
        this.state.loadPlanResourceSelectionFromServer(),
        this.state.loadNetworkConfigurationFromServer()
      ]))
      //.then(() => this.state.uploadDataSource = this.state.uploadDataSources.filter(item => item.name === dataSource.dataType)[0])
      // ---
      .catch((err) => {
        this.isChanges = true
        console.error(err)
      })
    }
  }
  
  onSelectionChanged (data) {
    // data isn't used
    this.isChanges = true
  }
}

ResourceManagerDetailController.$inject = ['state']

let resourceManagerDetail = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/resource-manager-detail.html',
  bindings: {
    resourceManager: '=', 
    resourceType: '<'
  },
  controller: ResourceManagerDetailController
}

export default resourceManagerDetail