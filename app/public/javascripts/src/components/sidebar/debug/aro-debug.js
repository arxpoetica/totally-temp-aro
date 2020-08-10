import MapUtilities from '../../common/plan/map-utilities'

class AroDebugController {
  constructor (state, $http, $timeout, $ngRedux, tracker) {
    this.state = state
    this.$http = $http
    this.$timeout = $timeout
    this.morphologyTileInfos = []
    this.tileInfo = {
      x: null,
      y: null,
      z: null,
      bounds: null
    }
    this.unsubscribeRedux = $ngRedux.connect(this.mapStateToThis, this.mapDispatchToTarget)(this)
    tracker.trackEvent(tracker.CATEGORIES.ENTER_DEBUGGING_MODE, tracker.ACTIONS.CLICK)
  }

  getMorphologyTileInfoForSelectedServiceAreas () {
    // For all selected service areas, gets the morphology tile debugging info from aro-service
    var tileInfoPromises = []
    this.planTargetServiceAreas.forEach((serviceAreaId) => {
      tileInfoPromises.push(this.$http.get(`/service/v1/tile-system-cmd/check_service_area/${serviceAreaId}`))
    })

    // Get debugging info for all tiles from aro-service
    Promise.all(tileInfoPromises)
      .then((results) => {
        this.morphologyTileInfos = []
        results.forEach((result) => {
          this.morphologyTileInfos.push({
            url: result.config.url,
            info: JSON.stringify(result.data, null, 2)
          })
        })
        this.$timeout()
      })
      .catch((err) => {
        this.morphologyTileInfos = [
          {
            url: 'Error',
            info: JSON.stringify(err, null, 2)
          }
        ]
        console.log(this.morphologyTileInfos)
        this.$timeout()
      })
  }

  getTileBoundsInfo () {
    this.tileInfo.bounds = JSON.stringify(MapUtilities.getTileLatLngBounds(this.tileInfo.z, this.tileInfo.x, this.tileInfo.y), undefined, 2)
  }

  mapStateToThis (reduxState) {
    return {
      planTargetServiceAreas: reduxState.selection.planTargets.serviceAreas
    }
  }

  mapDispatchToTarget (dispatch) {
    return { }
  }

  $onDestroy () {
    this.unsubscribeRedux()
  }
}

AroDebugController.$inject = ['state', '$http', '$timeout', '$ngRedux', 'tracker']

let aroDebug = {
  templateUrl: '/components/sidebar/debug/aro-debug.html',
  bindings: {},
  controller: AroDebugController
}

export default aroDebug
