class UserAccountSettingsController {
    
      constructor($scope,$http,state) {
        this.state = state
        this.$http = $http
        this.user = globalUser
        this.form = $('#applicationUserSettings form').get(0)
      }

      save() {
        var formData = new FormData(this.form)
        var data = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            old_password: formData.get('old_password'),
            password: formData.get('password'),
            password_confirm: formData.get('password_confirm')
        }
        this.$http({
            method: 'POST',
            url: '/settings/update_settings',
            data: data
        }).then((response) => {
            this.success = response.data.success
            this.state.showGlobalSettings.next(false)
        }).catch((response) => {
            this.error = response.data.error
            this.state.showGlobalSettings.next(false)
        })

    }

    }
    
    UserAccountSettingsController.$inject = ['$scope','$http','state']
    
    app.component('userAccountSettings', {
      template: `
            <div>
                <ul class="nav nav-tabs" role="tablist">
                <li role="presentation" class="active">
                    <a class="fa fa-2x fa-user" href="#applicationUserSettings" aria-controls="home" role="tab" data-toggle="tab"></a>
                </li>
                <li role="presentation">
                    <a class="fa fa-2x fa-users" href="#applicationUsersSettings" aria-controls="profile" role="tab" data-toggle="tab"></a>
                </li>
                </ul>
                <div class="tab-content" style="padding-top: 20px">
                <div role="tabpanel" class="tab-pane active" id="applicationUserSettings">
                    
                <!-- <div ng-if=$ctrl.error class="alert alert-danger" role="alert" > {{$ctrl.error}} </div> -->
                    
                <!--  <div ng-if=$ctrl.success class="alert alert-success" role="alert" > {{$ctrl.success}} </div> -->

                        <!-- <form action="/settings/update_settings" method="post"> -->
                        <form ng-submit="$ctrl.save()">
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
                            <input type="password" name="old_password" ng-model = $ctrl.old_password class="form-control" placeholder="Your current password">
                        </div>
                        <div class="form-group">
                            <label>New password</label>
                            <input type="password" name="password" ng-model = $ctrl.password class="form-control" placeholder="The new password">
                        </div>
                        <div class="form-group">
                            <label>Confirm new password</label>
                            <input type="password" name="password_confirm" ng-model = $ctrl.password_confirm class="form-control" placeholder="Confirm the new password">
                        </div>
                        </fieldset>
                        <br>
                        <button type="submit" class="btn btn-primary">Update settings</button>
                        <!-- <a href="/" class="btn btn-default">Cancel</a> -->
                    </form>
                    
                </div>
                <div role="tabpanel" class="tab-pane" id="applicationUsersSettings" style="padding-top: 20px">
                    <p class="text-center">In users tab</p>
                </div>
                </div>
            </div>
        </div>
      `,
      bindings: {},
      controller: UserAccountSettingsController
    })
    
    