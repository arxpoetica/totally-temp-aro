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
    <!-- <div class="label label-default" style="float:left;margin-right: 5px;margin-top: 1px;" 
      ng-click="$ctrl.zoomLocation(target)"
      ng-repeat="target in $ctrl.targets">
      {{ target.address || target.code }}
      <a href="javascript:void(0)" class="text-danger" ng-click="$ctrl.removeLocation(target)" style="margin-right: 5px">
      <span class="fa fa-trash-o"></span>
    </div> -->
    <div style="margin: 5px;min-height: 0px;">
      <ul ng-show="$ctrl.targets.length > 0" style="list-style-type:none; padding:0; margin-bottom: 0px;">
        <li ng-repeat="target in $ctrl.targets" ng-click="$ctrl.zoomLocation(target)">
          <a href="javascript:void(0)" class="text-danger" ng-click="$ctrl.removeLocation(target)" style="margin-right: 5px">
          <span class="fa fa-trash-o"></span>
        </a> {{ target.address || target.code }}
        </li>
      </ul>
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