class GlobalSettingsController {

  constructor(state, globalSettingsService,configuration, $http) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.configuration = configuration
    this.currentUser = state.loggedInUser

    this.views = Object.freeze({
      GLOBAL_SETTINGS: 'Global Settings',
      MY_ACCOUNT: 'My Account',
      MANAGE_USERS: 'Manage Users',
      MANAGE_GROUPS: 'Manage Groups',
      USER_SETTINGS: 'User Settings',
      TAG_MANAGER: 'Tag Manager'
    })
    this.currentView = this.views.GLOBAL_SETTINGS
  }

  modalHide() {
    this.state.showGlobalSettings = false
  }
}

GlobalSettingsController.$inject = ['state', 'globalSettingsService', 'configuration', '$http']

let globalSettings = {
  templateUrl: '/components/global-settings/global-settings.html',
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings