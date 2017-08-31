class GlobalSettingsController {
    
      constructor($scope,state) {
        this.state = state

        $scope.close = () => {
            //state.openGlobalSettings = false;
            state.showGlobalSettings.next(false)
        }
      }
    }
    
    GlobalSettingsController.$inject = ['$scope','state']
    
    app.component('globalSettings', {
      template: `
        <modal visible="$ctrl.state.showGlobalSettings.value" backdrop="static" >
            <modal-header title="Global Settings"></modal-header>
            <modal-body>
            <!-- <div id="settings">     
                    <nav>
                        <ul class="nav navbar-nav">
                            <li><a class="fa fa-2x fa-user" aria-hidden="true" href="/settings/show"></a></li>
                            <li><a class="fa fa-1x fa-users" href="#"></a></li>
                        </ul>
                    </nav>
                </div> -->
                <div class="modal-body">
                <div>
                  <ul class="nav nav-tabs" role="tablist">
                    <li role="presentation" class="active">
                      <a class="fa fa-2x fa-user" href="#applicationSettingsNetworkCosts" aria-controls="home" role="tab" data-toggle="tab"></a>
                    </li>
                    <li role="presentation">
                      <a class="fa fa-2x fa-users" href="#applicationSettingsEndpointDemand" aria-controls="profile" role="tab" data-toggle="tab"></a>
                    </li>
                  </ul>
                  <div class="tab-content" style="padding-top: 20px">
                    <div role="tabpanel" class="tab-pane active" id="applicationSettingsNetworkCosts">
                      <form action="/settings/update_settings" method="post">
                      <fieldset>
                        <legend>Basic settings</legend>
                        <div class="form-group">
                          <label>First name *</label>
                          <input type="text" name="first_name" class="form-control" ng-model = $ctrl.user.first_name ">
                        </div>
                        <div class="form-group">
                          <label>Last name *</label>
                          <input type="text" name="last_name" class="form-control" ng-model = $ctrl.user.last_name ">
                        </div>
                        <div class="form-group">
                          <label>Email *</label>
                          <input type="email" name="email" class="form-control" ng-model = $ctrl.user.email ">
                        </div>
                      </fieldset>
      
                      <hr>
      
                      <fieldset>
                        <legend>Optionally change your password</legend>
                        <div class="form-group">
                          <label>Current password</label>
                          <input type="password" name="old_password" class="form-control" placeholder="Your current password">
                        </div>
                        <div class="form-group">
                          <label>New password</label>
                          <input type="password" name="password" class="form-control" placeholder="The new password">
                        </div>
                        <div class="form-group">
                          <label>Confirm new password</label>
                          <input type="password" name="password_confirm" class="form-control" placeholder="Confirm the new password">
                        </div>
                      </fieldset>
                      <br>
                      <button type="submit" class="btn btn-primary">Update settings</button>
                      <!-- <a href="/" class="btn btn-default">Cancel</a> -->
                    </form>
                    </div>
                    <div role="tabpanel" class="tab-pane" id="applicationSettingsEndpointDemand" style="padding-top: 20px">
                      <p class="text-center">In users tab</p>
                    </div>
                  </div>
                </div>
            </div>
            </modal-body>
            <modal-footer>
                <button class="btn btn-primary" ng-click="close()">Close</button>
            </modal-footer>
        </modal>
      `,
      bindings: {},
      controller: GlobalSettingsController
    })
    
    