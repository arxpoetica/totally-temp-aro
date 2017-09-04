class NetworkPlanManageController {

  constructor($scope, state, $rootScope) {
    this.state = state
    this.user = globalUser

    $scope.$watch(function () { return $scope.visible; }, function (value) {
        if (value == true) {
            $rootScope.$broadcast('network-plan-component:select-plan', $scope.new_plan_name)
        }
    });
  
  }
}

NetworkPlanManageController.$inject = ['$scope', 'state', '$rootScope']

app.directive('networkPlanManage', function() {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: `
        <div>
            <ul class="nav nav-tabs" role="tablist">
                <li role="presentation" class="active">
                <a href="#create-new-plan" aria-controls="home" role="tab" data-toggle="tab">Create New Network Plan</a>
                </li>
                <li role="presentation">
                <a href="#open-saved-plan" aria-controls="home" role="tab" data-toggle="tab">Open Saved Network Plan</a>
                </li>
            </ul>

            <div class="tab-content" style="padding-top: 20px">
                <div role="tabpanel" class="tab-pane active" id="create-new-plan">
                    <form action="/settings/update_settings" method="post">
                        <fieldset>
                            <div class="form-group">
                                <label class="col-sm-4 control-label">Plan Name</label>
                                <div class="col-sm-8">
                                    <input id="txtNewPlanName" type="text" class="form-control" ng-focus="clear_default_text()" ng-model="new_plan_name"><br>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-4 control-label">Choose Starting Location</label>
                                <div class="col-sm-8">
                                    <input id="txtNewPlanStartingLocation" class="form-control select2" style="width: 100%"></input><br>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>

                <div role="tabpanel" class="tab-pane" id="open-saved-plan" style="padding-top: 20px">
                    <p class="text-center">In users tab</p>
                </div>
            </div>
        </div>
        `,
    bindings: {},
    scope: { visible: '=' },
    controller: NetworkPlanManageController
  }
})