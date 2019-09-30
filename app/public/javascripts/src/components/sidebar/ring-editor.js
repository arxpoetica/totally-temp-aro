
class RingEditorController {
  constructor (state, $ngRedux) {
    this.state = state
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      planState: reduxState.plan.activePlan && reduxState.plan.activePlan.planState
    }
  }

  mapDispatchToTarget (dispatch) {
    return {}
  }
}

RingEditorController.$inject = ['state', '$ngRedux']

let ringEditor = {
  templateUrl: '/components/sidebar/ring-editor.html',
  bindings: {
  },
  controller: RingEditorController
}

export default ringEditor