class TagManagerController {
  
    constructor(globalSettingsService) {
      this.globalSettingsService = globalSettingsService
    }
  
  }
  
  TagManagerController.$inject = ['globalSettingsService']
  
  let tagManager = {
    templateUrl: '/components/global-settings/tag-manager.html',
    controller: TagManagerController
  }
  
  export default tagManager