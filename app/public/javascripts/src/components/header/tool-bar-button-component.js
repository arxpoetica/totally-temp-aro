class ToolBarButtonController {

}

app.component('toolBarButton', {
  template: `
    <div>
      <button class="btn btn-default tool-bar-button"><i class="{{$ctrl.faimage}}"></i></button>
    </div>
      `,
  bindings: {
    faimage: '='
  },
  controller: ToolBarButtonController
});