app.controller('global_settings_controller', ['$scope', '$rootScope', 'state', ($scope, $rootScope, state) => {

    $scope.state = state
    $scope.close = () => {
        //state.openGlobalSettings = false;
        state.showGlobalSettings.next(false)
    }

}])
