class ToolBarController {

  constructor($scope,state) {
    this.state = state
    this.state.showGlobalSettings
    .subscribe((newValue) => {})
  }

  openGlobalSettings() {
    this.state.showGlobalSettings.next(true)
    //$('#global_settings_modal').modal('show')
  }
}

ToolBarController.$inject = ['$scope','state']

app.component('toolBar', {
  template: `
  <style scoped>

    .tool-bar {
      z-index: 3;
    }

    .tool-bar button {
      padding: 10px;
      background-color: rgba(50, 50, 50, 0.7);
      border-color: rgb(50, 50, 50);
      width: 48px;
      color: white;
      border-top-left-radius: 0px;
      border-top-right-radius: 0px;
    }

    #tool-bar .navbar-nav>li>a {
      padding-top: 10px;
      padding-bottom: 10px;
      color: white;
    }

    #tool-bar .navbar-nav>li>a:hover {
      color: #1a79db;
    }

    #tool-bar-logo {
      text-align:center;
      z-index: 1;
      width: 150px;
      padding: 10px;
      font-size: 20px;
      background-color: rgba(50, 50, 50, 0.7);
      border-bottom-right-radius: 5px;
      border-bottom-left-radius: 5px;
      border: 1px solid rgba(50, 50, 50, 0.7);
      color: #fff;
    }
  </style>
  <div style="display: flex; flex-direction: row; position: absolute; top: 0px; left: 0px; right: 0px; height: 48px">
    <div style="flex: 1 1 auto">
    </div>
    <div class="tool-bar" style="flex: 0 1 auto">
      <div class="btn-group">
        <button class="btn btn-default"><i class="fa fa-2x fa-th" data-ng-click="$ctrl.openGlobalSettings()"></i></button>
      </div>
      <div class="btn-group">
        <button class="btn btn-default"><i class="fa fa-2x fa-file"></i></button>
        <button class="btn btn-default"><i class="fa fa-2x fa-floppy-o"></i></button>
        <button class="btn btn-default"><i class="fa fa-2x fa-folder-open"></i></button>
      </div>
    </div>
    <div style="flex: 0 1 auto; padding-left: 100px; padding-right: 100px">
      <div id="tool-bar-logo">
        <img src="images/logos/aro/logo_navbar.png" style="margin-top: -4px">&nbsp;ARO
      </div>
    </div>
    <!-- Hardcode a div for the sidebar for now. To be fixed later -->
    <div style="flex: 0 0 700px"></div>
  </div>
  `,
  bindings: {},
  controller: ToolBarController
})

