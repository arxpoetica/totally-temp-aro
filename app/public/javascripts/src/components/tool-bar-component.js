class ToolBarController {

  constructor($scope,state) {
    this.state = state
  }

  openGlobalSettings() {
    this.state.openGlobalSettings = true
    //$('#global_settings_modal').modal('show')
  }
}

ToolBarController.$inject = ['$scope','state']

app.component('toolBar', {
  template: `
  <style scoped>
    #tool-bar {
      background: #1a79db;
      border-bottom-right-radius: 5px;
      border-bottom-left-radius: 5px;
      border: 10px solid #1a79db;
      color: #fff;
      z-index: 1;
      top: 0px;
      position: absolute;
      right: 52%;
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
      position: absolute;
      margin: 0 auto;
      top: 0px;
      left: 50%;
      width: 50px;
      z-index: 1;
      background: #1a79db;
      border-bottom-right-radius: 5px;
      border-bottom-left-radius: 5px;
      border: 10px solid #1a79db;
      color: #fff;
    }
  </style>
  <div id="tool-bar">
    <nav>
        <ul class="nav navbar-nav">
            <li style="border-right: 1px solid #4d99e5;">
                <a class="fa fa-1x fa-th" aria-hidden="true" data-ng-click="$ctrl.openGlobalSettings()" href=""></a></li>
            <li><a class="fa fa-1x fa-file" href="#"></a></li>
            <li><a class="fa fa-1x fa-floppy-o" href="#"></a></li>
            <li><a class="fa fa-1x fa-folder-open" href="#"></a></li>
        </ul>
    </nav>
  </div>
  <div id="tool-bar-logo">
    <img src="images/logos/aro/logo_navbar.png" style="margin-top: -4px">&nbsp;ARO
  </div>
  `,
  bindings: {},
  controller: ToolBarController
})

