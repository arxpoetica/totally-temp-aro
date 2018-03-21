class UserSettingsController {
  
    constructor($http, globalSettingsService) {
      this.globalSettingsService = globalSettingsService
    }
  
  }
  
  UserSettingsController.$inject = ['$http', 'globalSettingsService']
  
  app.component('userSettings', {
    templateUrl: '/components/global-settings/user-settings.html',
    controller: UserSettingsController
  })
  
  