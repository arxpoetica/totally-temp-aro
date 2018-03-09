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
          height: 100%;
          width: 97%;
          position: absolute;
          /*overflow: hidden;*/
          overflow: auto;
          min-height: 100px;
      }   
      /*#show-targets:hover {
          overflow: auto;
      }*/
    </style>
    <div id="show-targets">
      <div style="margin: 5px;min-height: 0px;">
        <ul ng-show="$ctrl.targets.length > 0" style="list-style-type:none; padding:0; margin-bottom: 0px;">
          <li class="item" ng-repeat="target in $ctrl.targets track by $index"
            ng-click="$ctrl.zoomLocation(target)">
            <a href="javascript:void(0)" class="text-danger" ng-click="$ctrl.removeLocation([target]); $event.stopPropagation()" style="margin-right: 5px">
              <span class="fa fa-trash-o"></span>
            </a> {{ target.address || target.code || target.name }}
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