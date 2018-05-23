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
  template: `
  <style scoped>
  #global-settings {
    display: flex;
    min-height: 100%;
    flex-wrap: wrap
  }
  .settings-btn {
    width: calc(33.33333% - 20px);
    margin: 10px;
    height: 100px
  }
  </style>
    <modal visible="$ctrl.state.showGlobalSettings.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
      <modal-header title="Global Settings"></modal-header>
      <modal-body style="height: 500px;overflow: auto;">

        <div id="global-settings" ng-if="$ctrl.currentView === $ctrl.views.GLOBAL_SETTINGS">  
          <button class="btn settings-btn"
            ng-click="$ctrl.toggleMyAccountMode()">
              <i class="fa fa-2x fa-user"></i>
              <br>My Account
          </button>

          <button class="btn settings-btn"
            ng-if="$ctrl.currentUser.rol === 'admin' || $ctrl.currentUser.rol === 'sales'"
            ng-click="$ctrl.toggleManageUsersMode()">
              <i class="fa fa-2x fa-users"></i>
              <br>Manage Users
          </button>

          <button class="btn settings-btn"
            ng-if="$ctrl.currentUser.rol === 'admin' || $ctrl.currentUser.rol === 'sales'"
            ng-click="$ctrl.toggleManageGroupsMode()">
              <i class="fa fa-2x fa-users"></i>
              <br>Manage Groups
          </button>

          <button class="btn settings-btn"
            ng-click="$ctrl.toggleUserSettings()">
              <i class="fa fa-2x fa-cogs"></i>
              <br>User Settings
          </button>

          <button class="btn settings-btn"
            ng-if="$ctrl.currentUser.rol === 'admin' || $ctrl.currentUser.rol === 'sales'"
            ng-click="$ctrl.currentView = $ctrl.views.TAG_MANAGER">
              <i class="fa fa-2x fa-tags"></i>
              <br>Tag Manager
          </button>
        </div>

        <user-account-settings ng-if="$ctrl.currentView === $ctrl.views.MY_ACCOUNT"></user-account-settings>

        <manage-users ng-if="$ctrl.currentView === $ctrl.views.MANAGE_USERS"
                      manager-view="$ctrl.globalSettingsService.currentManageUserView">
        </manage-users>

        <manage-groups ng-if="$ctrl.currentView === $ctrl.views.MANAGE_GROUPS"
                      manager-view="$ctrl.globalSettingsService.currentManageUserView">
        </manage-groups>

        <user-settings ng-show="$ctrl.currentView === $ctrl.views.USER_SETTINGS"></user-settings>  

        <tag-manager ng-if="$ctrl.currentView === $ctrl.views.TAG_MANAGER"
          manager-view="$ctrl.globalSettingsService.currentTagManagerView"><tag-manager>
      </modal-body>

      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.GLOBAL_SETTINGS">
        <button class="btn btn-primary" ng-click="$ctrl.modalHide()">Close</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.MY_ACCOUNT">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.save()">Update settings</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.USER_SETTINGS">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.saveLocation()">Update settings</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.MANAGE_USERS && $ctrl.globalSettingsService.currentManageUserView === $ctrl.globalSettingsService.ManageUserViews.Users">
        <a type="button" class="btn btn-default" ng-href='/admin/users/csv'>Download CSV</a>
        <a type="button" class="btn btn-default" ng-click="$ctrl.globalSettingsService.openSendMailView()">Send email to all users</a>
        <a type="button" class="btn btn-default" ng-click="$ctrl.globalSettingsService.openNewUserView()">Register a new user</a>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.MANAGE_GROUPS">
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.globalSettingsService.currentManageUserView === $ctrl.globalSettingsService.ManageUserViews.SendEmail">
        <button type="button" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.sendMail()">Send mail</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.globalSettingsService.openUserView()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.globalSettingsService.currentManageUserView === $ctrl.globalSettingsService.ManageUserViews.RegisterUser">
        <button type="button" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.register_user()">Register user</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.globalSettingsService.openUserView()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.TAG_MANAGER && $ctrl.globalSettingsService.currentTagManagerView === $ctrl.globalSettingsService.TagManagerViews.Tags">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.currentTagManagerView = $ctrl.globalSettingsService.TagManagerViews.CreateTag">Create Tag</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.TAG_MANAGER && $ctrl.globalSettingsService.currentTagManagerView === $ctrl.globalSettingsService.TagManagerViews.UpdateTag">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.updateTag()">Update Tag</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.globalSettingsService.currentTagManagerView = $ctrl.globalSettingsService.TagManagerViews.Tags">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.TAG_MANAGER && $ctrl.globalSettingsService.currentTagManagerView === $ctrl.globalSettingsService.TagManagerViews.CreateTag">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.createTag()">Create Tag</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.globalSettingsService.currentTagManagerView = $ctrl.globalSettingsService.TagManagerViews.Tags">Back</button>
      </modal-footer>
    </modal>
  `,
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings