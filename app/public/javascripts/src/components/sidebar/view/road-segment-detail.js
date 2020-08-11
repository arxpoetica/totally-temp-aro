class RoadSegmentDetailController {
  constructor (state, $timeout) {
    this.state = state
    this.$timeout = $timeout
    this.selectedEdgeInfo = []
    //this.isSingleRoad

    state.clearViewMode.subscribe((clear) => {
      if (clear) {
        this.selectedEdgeInfo = []
        this.updateSelectedState()
      }
    })

    this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      // On click of equipment or location dont show road segment details
      if (event.hasOwnProperty('equipmentFeatures') && event.equipmentFeatures.length > 0) return
      if (event.hasOwnProperty('locations') && event.locations.length > 0) return
      if (this.state.activeViewModePanel === this.state.viewModePanels.EDIT_LOCATIONS) return

      if (event.roadSegments && event.roadSegments.size > 0) {
        var newSelection = state.cloneSelection()
        newSelection.details.roadSegments = event.roadSegments
        state.selection = newSelection
        //this.isSingleRoad = (event.roadSegments.size == 1)
        this.selectedEdgeInfo = this.generateRoadSegmentsInfo(event.roadSegments)
        this.viewRoadSegmentInfo()
        this.$timeout()
      } else if (this.isFeatureListEmpty(event)) {
        this.selectedEdgeInfo = []
        this.updateSelectedState()
        // this check maybe needs to go at the top of this function (symptom of larger problem)
        if (this.state.activeViewModePanel === this.state.viewModePanels.ROAD_SEGMENT_INFO) {
          // ToDo: this doesn't belog here it's a symptom of a larger problem
          this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO
        }
        this.$timeout()
      }
    })
  }

  isFeatureListEmpty (event) {
    var isObjectEmpty = true
    var features = Object.keys(event)
    for (let i = 0; i < features.length; i++) {
      if (features[i] == 'latLng' || features[i] == 'roadSegments') continue
      if (event[features[i]].length > 0 || [...event[features[i]]].length > 0) isObjectEmpty = false
    }

    return isObjectEmpty
  }

  generateRoadSegmentsInfo (roadSegments) {
    var roadSegmentsInfo = []
    var roadSegmentIds = {}
    roadSegments.forEach(edge => {
      if (!roadSegmentIds[edge.gid]) {
        roadSegmentIds[edge.gid] = edge.gid
        roadSegmentsInfo.push({ ...edge })
      }
    })

    return roadSegmentsInfo
  }

  updateSelectedState () {
    var newSelection = this.state.cloneSelection()
    newSelection.details.roadSegments = new Set()
    if (typeof feature !== 'undefined' && typeof id !== 'undefined') {
      newSelection.editable.roadSegments[ id ] = feature
    }
    this.state.selection = newSelection
  }

  viewRoadSegmentInfo () {
    this.state.activeViewModePanel = this.state.viewModePanels.ROAD_SEGMENT_INFO
  }

  $onDestroy () {
    this.mapFeaturesSelectedEventObserver.unsubscribe()
  }
}

RoadSegmentDetailController.$inject = ['state', '$timeout']

let roadSegmentDetail = {
  templateUrl: '/components/sidebar/view/road-segment-detail.html',
  bindings: {
    selection: '<'
  },
  controller: RoadSegmentDetailController
}

export default roadSegmentDetail
