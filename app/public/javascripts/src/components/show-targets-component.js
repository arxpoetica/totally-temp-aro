class ShowTargetsController {

  constructor(state) {
    this.state = state

    this.removeLocation = (target) => {
      this.removeTarget({target:target})
    }

    this.zoomLocation = (target) => {
      this.zoomTarget({target:target})
    }
  }
}

ShowTargetsController.$inject = ['state']

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
      ng-click="$ctrl.zoomLocation(target)"
      ng-repeat="target in $ctrl.targets">
      {{ target.address || target.code }}
      <a href="javascript:void(0)" class="text-danger" ng-click="$ctrl.removeLocation(target)" style="margin-right: 5px">
      <span class="fa fa-trash-o"></span>
    </div>
  </div>
    `,
  bindings: {
    targets: '=',
    removeTarget: '&', 
    zoomTarget: '&'
  },
  controller: ShowTargetsController
});