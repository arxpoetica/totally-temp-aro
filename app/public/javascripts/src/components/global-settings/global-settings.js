class GlobalSettingsController {
  constructor (state, globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService

    this.views = Object.freeze({
      GLOBAL_SETTINGS: 'Global Settings',
      MY_ACCOUNT: 'My Account',
      MULTIFACTOR_AUTHENTICATION: 'Multi Factor Authentication',
      MANAGE_USERS: 'Manage Users',
      MANAGE_GROUPS: 'Manage Groups',
      USER_SETTINGS: 'User Settings',
      TAG_MANAGER: 'Tag Manager',
      RELEASE_NOTES: 'Release Notes',
      CONFIGURATION_EDITOR: 'Configuration Editor'
    })
    this.currentView = this.views.GLOBAL_SETTINGS
    this.userIdForSettingsEdit = null

    state.openGlobalSettingsView.skip(1).subscribe((view) => {
      this.currentView = this.views[view]
    })
  }

  modalHide () {
    this.state.showGlobalSettings = false
    this.globalSettingsService.currentManageUserView = this.globalSettingsService.ManageUserViews.Users
    this.globalSettingsService.currentReleaseNotesView = this.globalSettingsService.ReleaseNotesView.List
    this.backToGlobalSettings()
  }

  backToGlobalSettings () {
    this.userIdForSettingsEdit = this.state.loggedInUser.id
    this.currentView = this.views.GLOBAL_SETTINGS
  }

  isManageUsersView () {
    return this.globalSettingsService.currentManageUserView === this.globalSettingsService.ManageUserViews.SendEmail ||
    this.globalSettingsService.currentManageUserView === this.globalSettingsService.ManageUserViews.RegisterUser
  }

  isReleaseNotesDescriptionView () {
    return this.globalSettingsService.currentReleaseNotesView === this.globalSettingsService.ReleaseNotesView.Description
  }

  openUserSettingsForUserId (userId) {
    this.userIdForSettingsEdit = userId
    this.currentView = this.views.USER_SETTINGS
  }

  uploadDataSource () {
    this.state.showDataSourceUploadModal.next(true)
    if (this.state.uploadDataSources.length > 0) {
      this.state.uploadDataSource = this.state.uploadDataSources[0]
    }
    this.modalHide()
  }

  goBack () {
    if (!this.isManageUsersView() && !this.isReleaseNotesDescriptionView()) {
      this.backToGlobalSettings()
    } else if (this.isManageUsersView() && !this.isReleaseNotesDescriptionView()) {
      this.globalSettingsService.openUserView()
    } else if (this.isReleaseNotesDescriptionView()) {
      this.globalSettingsService.currentReleaseNotesView = this.globalSettingsService.ReleaseNotesView.List
    }
  }
}

GlobalSettingsController.$inject = ['state', 'globalSettingsService']

let globalSettings = {
  templateUrl: '/components/global-settings/global-settings.html',
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings
