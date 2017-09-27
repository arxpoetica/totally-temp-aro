class ToolBarButtonController {

}

app.component('toolBarButton', {
  template: `
    <div>
      <button ng-class="{ 'btn btn-default': true, 'btn-selected': $ctrl.enable }"><i class="{{$ctrl.faimage}}"></i></button>
    </div>
      `,
  bindings: {
    faimage: '=',
    enable: '='
  },
  controller: ToolBarButtonController
});