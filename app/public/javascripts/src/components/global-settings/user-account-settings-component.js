class UserAccountSettingsController {

  constructor($http, globalSettingsService) {
    this.globalSettingsService = globalSettingsService
  }

}

UserAccountSettingsController.$inject = ['$http', 'globalSettingsService']

app.component('userAccountSettings', {
  templateUrl: '/components/global-settings/user-account-settings-component.html',
  controller: UserAccountSettingsController
})

