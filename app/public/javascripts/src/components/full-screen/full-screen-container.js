import FullScreenActions from '../../react/components/full-screen/full-screen-actions'

class FullScreenContainerController {
  constructor ($ngRedux) {
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }

  mapStateToThis (reduxState) {
    return {
      showFullScreenContainer: reduxState.fullScreen.showFullScreenContainer,
      showAllRfpStatus: reduxState.optimization.rfp.showAllRfpStatus
    }
  }

  mapDispatchToTarget (dispatch) {
    return {
      hideFullScreenContainer: () => dispatch(FullScreenActions.showOrHideFullScreenContainer(false))
    }
  }
}

FullScreenContainerController.$inject = ['$ngRedux']

let fullScreenContainer = {
  templateUrl: '/components/full-screen/full-screen-container.html',
  bindings: {
  },
  transclude: true,
  controller: FullScreenContainerController
}

export default fullScreenContainer
