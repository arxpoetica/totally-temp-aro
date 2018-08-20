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
    this.isAdministrator = false
    var userAdminPermissions = null
    var userIsAdministrator = false, userGroupIsAdministrator = false
    var aclResult = null
    $http.get('/service/auth/permissions')
      .then((result) => {
        // Get the permissions for the name USER_ADMIN
        userAdminPermissions = result.data.filter((item) => item.name === 'USER_ADMIN')[0].id
        return $http.get(`/service/auth/acl/SYSTEM/1`)
      })
      .then((result) => {
        aclResult = result.data
        // Get the acl entry corresponding to the currently logged in user
        var userAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === state.loggedInUser.id)[0]
        // The userAcl.rolePermissions is a bit field. If it contains the bit for "userAdminPermissions" then
        // the logged in user is an administrator.
        userIsAdministrator = (userAcl && (userAcl.rolePermissions & userAdminPermissions)) > 0
        return $http.get(`/service/auth/users/${state.loggedInUser.id}`)
      })
      .then((result) => {
        // Also check if the groups that the user belongs to have administrator permissions
        userGroupIsAdministrator = false
        result.data.groupIds.forEach((groupId) => {
          const userGroupAcl = aclResult.resourcePermissions.filter((item) => item.systemActorId === groupId)[0]
          const thisGroupIsAdministrator = (userGroupAcl && (userGroupAcl.rolePermissions & userAdminPermissions)) > 0
          userGroupIsAdministrator |= thisGroupIsAdministrator
        })
        this.isAdministrator = userIsAdministrator || userGroupIsAdministrator
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

GlobalSettingsController.$inject = ['state', 'globalSettingsService', 'configuration', '$http']

let globalSettings = {
  templateUrl: '/components/global-settings/global-settings.html',
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings