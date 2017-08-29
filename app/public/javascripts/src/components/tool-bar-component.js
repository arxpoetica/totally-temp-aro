class ToolBarController {

  constructor(state) {
    this.state = state
  }
}

ToolBarController.$inject = ['state']

app.component('toolBar', {
  template: `
  <style scoped>
    #tool-bar {
      z-index: 1;
      top: 100px;
      position: absolute;
      left: 33%;
    }
    
    #tool-bar.navbar-nav>li>a {
      padding-top: 10px;
      padding-bottom: 10px;
    }

    #tool-bar-logo {
      position: relative;
      margin: 0 auto;
      top: 29px;
      width: 50px;
      z-index: 1;
      background: #1a79db;
      border-radius: 5px;
      border: 10px solid #1a79db;
      color: #fff;
    }
  </style>
  <div id="tool-bar">
    <nav>
        <ul class="nav navbar-nav">
            <li style="border-right: 1px solid #4d99e5;">
                <a class="fa fa-1x fa-th" aria-hidden="true" href="#"></a></li>
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

