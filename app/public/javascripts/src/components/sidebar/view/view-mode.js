class ViewModeController {
  constructor (state) {
    this.state = state
    this.currentUser = state.loggedInUser
  }
}

ViewModeController.$inject = ['state']

let viewMode = {
  templateUrl: '/components/sidebar/view/view-mode.html',
  controller: ViewModeController
}

export default viewMode
