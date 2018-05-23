class GlobalSettingsController {

  constructor(state,globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.currentUser = globalUser

    this.views = Object.freeze({
      GLOBAL_SETTINGS: 0,
      MY_ACCOUNT: 1,
      MANAGE_USERS: 2,
      USER_SETTINGS: 3,
      TAG_MANAGER: 4,
      MANAGE_GROUPS: 5
    })
    this.currentView = this.views.GLOBAL_SETTINGS
  }

  modalShown() {
    this.state.showGlobalSettings.next(true)
  }

  modalHide() {
    this.state.showGlobalSettings.next(false)
  }
  
  toggleViewMode() {
    this.currentView = this.views.GLOBAL_SETTINGS
  }

  toggleMyAccountMode() {
    this.currentView = this.views.MY_ACCOUNT
  }

  toggleManageUsersMode() {
    this.currentView = this.views.MANAGE_USERS
  }

  toggleManageGroupsMode() {
    this.currentView = this.views.MANAGE_GROUPS
  }

  toggleUserSettings() {
    this.currentView = this.views.USER_SETTINGS
  }

}

GlobalSettingsController.$inject = ['state','globalSettingsService']

let globalSettings = {
  templateUrl: '/components/global-settings/global-settings.html',
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings