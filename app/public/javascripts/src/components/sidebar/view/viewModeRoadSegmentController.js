class ViewModeRoadSegmentController {
  
    constructor(state, $timeout, configuration) {
      this.state = state
      this.$timeout = $timeout
      this.selectedEdgeInfo = null
      this.singleRoad
  
      state.selectedRoadSegments
      .subscribe((selectedRoadSegments) => {
        if (selectedRoadSegments.size > 0) {
          this.singleRoad = (selectedRoadSegments.size == 1) ? true : false
          this.selectedEdgeInfo = this.generateRoadSegmentsInfo(selectedRoadSegments)
        } else {
          this.selectedEdgeInfo = null
        }
        this.$timeout() // Will safely call $scope.$apply()
      })  

      state.clearViewMode.subscribe((clear) => {
        if(clear) this.selectedEdgeInfo = null
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
  }
  
  ViewModeRoadSegmentController.$inject = ['state', '$timeout', 'configuration']

  export default ViewModeRoadSegmentController