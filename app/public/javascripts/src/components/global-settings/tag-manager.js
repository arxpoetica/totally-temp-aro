class TagManagerController {
  
    constructor(globalSettingsService) {
      this.globalSettingsService = globalSettingsService
    }

    updateTag(tag) {
      this.globalSettingsService.updatedTag = tag
      this.managerView = this.globalSettingsService.TagManagerViews.UpdateTag
    }

    $onInit() {
      this.globalSettingsService.getTags()
    }
  
  }
  
  TagManagerController.$inject = ['globalSettingsService']
  
  let tagManager = {
    templateUrl: '/components/global-settings/tag-manager.html',
    bindings: {
      managerView: '='
    },
    controller: TagManagerController
  }
  
  export default tagManager