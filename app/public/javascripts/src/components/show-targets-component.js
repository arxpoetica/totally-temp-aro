class ShowTargetsController {

  constructor($http,state) {
    this.$http = $http
    this.state = state
    this.plan = null

    state.plan
    .subscribe((plan) => {
      this.plan = plan
    })
  }

  zoomToLocation(target) {
    map.setZoom(18)
    map.panTo({lat:target.lat,lng:target.lng})
  }

  removeLocation(target) {
    this.$http.post(`/network_plan/${this.plan.id}/removeTargets`, { locationIds: [target.id] })
      .then((response) => {
        this.state.reloadSelectedLocations()
      })
    }
}

ShowTargetsController.$inject = ['$http','state']

app.component('showTargets', {
  template: `
    <style scoped>
      #show-targets{
          max-height: 75px;
          overflow: hidden;
      }   
      #show-targets:hover {
          overflow: auto;
      } 
    </style>
    <div id="show-targets">
      <div class="label label-default" style="float:left;margin-right: 5px;margin-top: 1px;" 
        ng-click=$ctrl.zoomToLocation(target)
        ng-repeat="target in $ctrl.targets">
        {{ target.address || target.name }}
        <a href="javascript:void(0)" class="text-danger" ng-click="$ctrl.removeLocation(target)" style="margin-right: 5px">
        <span class="fa fa-trash-o"></span>
      </div>
    </div>
    `,
  bindings: {
    targets: '='
  },
  controller: ShowTargetsController
});