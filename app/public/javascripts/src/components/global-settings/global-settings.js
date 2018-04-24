class GlobalSettingsController {

  constructor(state,globalSettingsService) {
    this.state = state
    this.globalSettingsService = globalSettingsService
    this.currentUser = globalUser

    this.views = Object.freeze({
      Global_Settings: 0,
      My_Account: 1,
      Manage_Users: 2,
      User_Settings: 3,
      Tag_Manager: 4
    })
    this.currentView = this.views.Global_Settings
  }

  modalShown() {
    this.state.showGlobalSettings.next(true)
  }

  modalHide() {
    this.state.showGlobalSettings.next(false)
  }
  
  toggleViewMode() {
    this.currentView = this.views.Global_Settings
  }

  toggleMyAccountMode() {
    this.currentView = this.views.My_Account
  }

  toggleManageUsersMode() {
    this.currentView = this.views.Manage_Users
  }

  toggleUserSettings() {
    this.currentView = this.views.User_Settings
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

        <div id="global-settings" ng-if="$ctrl.currentView === $ctrl.views.Global_Settings">  
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
            ng-click="$ctrl.toggleUserSettings()">
              <i class="fa fa-2x fa-cogs"></i>
              <br>User Settings
          </button>

          <button class="btn settings-btn"
            ng-if="$ctrl.currentUser.rol === 'admin' || $ctrl.currentUser.rol === 'sales'"
            ng-click="$ctrl.currentView = $ctrl.views.Tag_Manager">
              <i class="fa fa-2x fa-tags"></i>
              <br>Tag Manager
          </button>
        </div>

        <user-account-settings ng-if="$ctrl.currentView === $ctrl.views.My_Account"></user-account-settings>

        <manage-users ng-if="$ctrl.currentView === $ctrl.views.Manage_Users"
          manager-view="$ctrl.globalSettingsService.currentManageUserView"></manage-users>  

        <user-settings ng-show="$ctrl.currentView === $ctrl.views.User_Settings"></user-settings>  

        <tag-manager ng-if="$ctrl.currentView === $ctrl.views.Tag_Manager"
          manager-view="$ctrl.globalSettingsService.currentTagManagerView"><tag-manager>
      </modal-body>

      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.Global_Settings">
        <button class="btn btn-primary" ng-click="$ctrl.modalHide()">Close</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.My_Account">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.save()">Update settings</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.User_Settings">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.saveLocation()">Update settings</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.Manage_Users && $ctrl.globalSettingsService.currentManageUserView === $ctrl.globalSettingsService.ManageUserViews.Users">
        <a type="button" class="btn btn-default" ng-href='/admin/users/csv'>Download CSV</a>
        <a type="button" class="btn btn-default" ng-click="$ctrl.globalSettingsService.openSendMailView()">Send email to all users</a>
        <a type="button" class="btn btn-default" ng-click="$ctrl.globalSettingsService.openNewUserView()">Register a new user</a>
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
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.Tag_Manager && $ctrl.globalSettingsService.currentTagManagerView === $ctrl.globalSettingsService.TagManagerViews.Tags">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.currentTagManagerView = $ctrl.globalSettingsService.TagManagerViews.CreateTag">Create Tag</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.toggleViewMode()">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.Tag_Manager && $ctrl.globalSettingsService.currentTagManagerView === $ctrl.globalSettingsService.TagManagerViews.UpdateTag">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.updateTag()">Update Tag</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.globalSettingsService.currentTagManagerView = $ctrl.globalSettingsService.TagManagerViews.Tags">Back</button>
      </modal-footer>
      <modal-footer ng-if="$ctrl.currentView === $ctrl.views.Tag_Manager && $ctrl.globalSettingsService.currentTagManagerView === $ctrl.globalSettingsService.TagManagerViews.CreateTag">
        <button type="submit" class="btn btn-primary" ng-click="$ctrl.globalSettingsService.createTag()">Create Tag</button>
        <button class="btn btn-primary pull-right" ng-click="$ctrl.globalSettingsService.currentTagManagerView = $ctrl.globalSettingsService.TagManagerViews.Tags">Back</button>
      </modal-footer>
    </modal>
  `,
  bindings: {},
  controller: GlobalSettingsController
}

export default globalSettings