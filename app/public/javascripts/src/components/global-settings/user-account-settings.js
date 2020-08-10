class UserAccountSettingsController {
  constructor ($http, globalSettingsService) {
    this.globalSettingsService = globalSettingsService
  }
}

UserAccountSettingsController.$inject = ['$http', 'globalSettingsService']

let userAccountSettings = {
  templateUrl: '/components/global-settings/user-account-settings.html',
  controller: UserAccountSettingsController
}

export default userAccountSettings
