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
                <h3>This is modal body</h3>
            </modal-body>
            <modal-footer>
                <button class="btn btn-primary" ng-click="close()">Close</button>
            </modal-footer>
        </modal>
      `,
      bindings: {},
      controller: GlobalSettingsController
    })
    
    