class GlobalSettingsController {
    
      constructor($scope,state) {
        this.state = state
        $scope.close = () => {
            //state.openGlobalSettings = false;
            state.showGlobalSettings.next(false)
        }

        $scope.modalShown = () => {
            state.showGlobalSettings.next(true)
        }

        $scope.modalHide = () => {
            state.showGlobalSettings.next(false)
        }
      }
    }
    
    GlobalSettingsController.$inject = ['$scope','state']
    
    app.component('globalSettings', {
      template: `
        <modal visible="$ctrl.state.showGlobalSettings.value" backdrop="static" on-show="modalShown()" on-hide="modalHide()" >
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
            <user-account-settings></user-account-settings>
            </modal-body>
            <!-- <modal-footer>
                <button class="btn btn-primary" ng-click="close()">Close</button>
            </modal-footer> -->
        </modal>
      `,
      bindings: {},
      controller: GlobalSettingsController
    })
    
    