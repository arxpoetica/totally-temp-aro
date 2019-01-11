class GlobalSettingsController {

  constructor(state, globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.currentUser = state.loggedInUser

    this.views = Object.freeze({
      GLOBAL_SETTINGS: 'Global Settings',
      MY_ACCOUNT: 'My Account',
      MULTIFACTOR_AUTHENTICATION: 'Multi Factor Authentication',
      MANAGE_USERS: 'Manage Users',
      MANAGE_GROUPS: 'Manage Groups',
      USER_SETTINGS: 'User Settings',
      TAG_MANAGER: 'Tag Manager',
      RELEASE_NOTES: 'Release Notes'
    })
    this.currentView = this.views.GLOBAL_SETTINGS
    this.userIdForSettingsEdit = this.state.loggedInUser.id
  }

  modalHide() {
    this.state.showGlobalSettings = false
    this.globalSettingsService.currentManageUserView = this.globalSettingsService.ManageUserViews.Users
    this.backToGlobalSettings()
  }

  backToGlobalSettings() {
    this.userIdForSettingsEdit = this.state.loggedInUser.id
    this.currentView = this.views.GLOBAL_SETTINGS
  }

  isManageUsersView() {
    return this.globalSettingsService.currentManageUserView === this.globalSettingsService.ManageUserViews.SendEmail || 
    this.globalSettingsService.currentManageUserView === this.globalSettingsService.ManageUserViews.RegisterUser
  }

  openUserSettingsForUserId(userId) {
    this.userIdForSettingsEdit = userId
    this.currentView = this.views.USER_SETTINGS
  }
}

GlobalSettingsController.$inject = ['state', 'globalSettingsService']

let globalSettings = {
  templateUrl: '/components/global-settings/global-settings.html',
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings