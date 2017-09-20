class NetworkPlanModalController {
  constructor($scope, state) {
    this.state = state
    this.newplan = false

    $scope.close = () => {
      state.networkPlanModal.next(false)
    }

    $scope.modalShown = () => {
      state.networkPlanModal.next(true)
    }

    $scope.modalHide = () => {
      state.networkPlanModal.next(false)
    }

    $scope.saveNewPlan = () => {
      //network-plan-manage-component will save the plan
      this.newplan = true
    }

  }
}

NetworkPlanModalController.$inject = ['$scope', 'state']

app.component('networkPlanModal', {
  template: `
  <modal visible="$ctrl.state.networkPlanModal.value" backdrop="static" on-show="modalShown()" on-hide="modalHide()" >
    <modal-header title="Network Plan"></modal-header>
      <modal-body>
        <network-plan-manage visible="$ctrl.newplan"></network-plan-manage>
      </modal-body>
    <modal-footer>
      <button class="btn btn-primary" ng-click="close()">Close</button>
      <button class="btn btn-primary" ng-click="saveNewPlan()">Create Plan</button>
    </modal-footer>
  </modal>
  `,
  bindings: {},
  controller: NetworkPlanModalController
})