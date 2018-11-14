class RoadSegmentDetailController {
  constructor(state, $timeout) {
    this.state = state
    this.$timeout = $timeout
    this.selectedEdgeInfo = null
    this.isSingleRoad

    state.clearViewMode.subscribe((clear) => {
      if(clear) this.selectedEdgeInfo = null
    })

    this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      if (event.roadSegments && event.roadSegments.size > 0) {
        var newSelection = state.cloneSelection(state.selection)
        newSelection.details.roadSegments = event.roadSegments
        state.selection = newSelection
        this.isSingleRoad = (event.roadSegments.size == 1)
        if (event.roadSegments.size > 0) {
          this.selectedEdgeInfo = this.generateRoadSegmentsInfo(event.roadSegments)
        } else {
          this.selectedEdgeInfo = null
        }
        this.$timeout()
      }
    })
  }

  generateRoadSegmentsInfo(roadSegments) {

    var roadSegmentsInfo = {
    }

    if(roadSegments.size == 1) {
      roadSegmentsInfo.gid =  [...roadSegments][0].gid
      roadSegmentsInfo.edge_length =  [...roadSegments][0].edge_length.toFixed(2)
    } else {
      roadSegmentsInfo.totalLength = [...roadSegments].reduce((total, item) => { return total + item.edge_length }, 0).toFixed(2)
      roadSegmentsInfo.count = roadSegments.length
    }

    //Temp values
    //Later we have to load it from response
    var constructionTypes = {
      aerial: Math.floor(roadSegments.size / 2),
      buried: Math.floor(roadSegments.size / 2)
    }

    var roadTypes = {
      highWay: roadSegments.size
    }

    roadSegmentsInfo.constructionTypes = constructionTypes
    roadSegmentsInfo.roadTypes = roadTypes
    
    return roadSegmentsInfo
  }

  $onDestroy() {
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
