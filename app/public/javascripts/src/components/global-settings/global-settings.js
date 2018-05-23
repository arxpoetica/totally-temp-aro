class GlobalSettingsController {

  constructor(state, globalSettingsService, $http) {
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
    this.isAdministrator = false
    var userAdminPermissions = null
    $http.get('/service/auth/permissions')
      .then((result) => {
        // Get the permissions for the name USER_ADMIN
        userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
        return $http.get(`/service/auth/acl/SYSTEM/1`)
      })
      .then((result) => {
        // Get the acl entry corresponding to the currently logged in user
        var userAcl = result.data.resourcePermissions.filter((item) => item.systemActorId === state.getUserId())[0]
        // The userAcl.rolePermissions is a bit field. If it contains the bit for "userAdminPermissions" then
        // the logged in user is an administrator.
        this.isAdministrator = (userAcl.rolePermissions & userAdminPermissions) > 0
      })
      .catch((err) => console.error(err))
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

GlobalSettingsController.$inject = ['state', 'globalSettingsService', '$http']

let globalSettings = {
  templateUrl: '/components/global-settings/global-settings.html',
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings