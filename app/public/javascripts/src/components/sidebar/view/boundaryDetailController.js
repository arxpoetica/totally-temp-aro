class BoundaryDetailController {

  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.selectedBoundaryInfo = null
    this.selectedSAInfo = null
    this.selectedBoundaryTags = []
    this.selectedBoundary = null
    
    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
    })

    this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      if(this.state.selectedDisplayMode.getValue() === state.displayModes.VIEW) {
        if ( event.hasOwnProperty('censusFeatures') 
            && event.censusFeatures.length > 0 
            && event.censusFeatures[0].hasOwnProperty('id') ) {
          
            let tagList = []
            let tags = event.censusFeatures[0].tags
            
            for (var key in tags){
              if (tags.hasOwnProperty(key)){
                let tag = {}
                tag.censusCatDescription = this.censusCategories[key].description
                tag.tagInfo = this.censusCategories[key].tags[ tags[key] ]
                tagList.push(tag)
            }
            }
          this.selectedBoundaryTags = tagList
          
          let censusBlockId = event.censusFeatures[0].id
          this.state.reloadSelectedCensusBlockId(censusBlockId)
          this.viewCensusBlockInfo(censusBlockId)
        } else if (event.hasOwnProperty('serviceAreas')
          && event.serviceAreas.length > 0
          && event.serviceAreas[0].hasOwnProperty('code') ){
            this.viewServiceAreaInfo(event.serviceAreas[0])
            this.state.reloadSelectedServiceArea(event.serviceAreas[0].id)
        } else if (event.hasOwnProperty('analysisAreas')
          && event.analysisAreas.length > 0
          && event.analysisAreas[0].hasOwnProperty('code')
          && event.analysisAreas[0].hasOwnProperty('_data_type') ){
            this.viewServiceAreaInfo(event.analysisAreas[0])
            this.state.reloadSelectedAnalysisArea(event.analysisAreas[0].id)
        }
      } else {
        return
      }
    })

    state.clearViewMode.subscribe((clear) => {
      if(clear) {
        this.selectedBoundaryInfo = null
        this.selectedSAInfo = null
      }  
    })
  }

  viewServiceAreaInfo(serviceArea) {
    this.selectedBoundaryInfo = null
    this.selectedSAInfo = serviceArea
    this.$timeout()
  }

  getCensusBlockInfo(cbId) {
    return this.$http.get('/census_blocks/' + cbId + '/details')
      .then((response) => {
        return response.data
      })
  }

  viewCensusBlockInfo(censusBlockId) {
    return this.getCensusBlockInfo(censusBlockId).then((cbInfo) => {
      this.selectedSAInfo = null
      this.selectedBoundaryInfo = cbInfo
      this.state.activeViewModePanel = this.state.viewModePanels.BOUNDARIES_INFO
    })
  }

  viewSelectedBoundary(selectedBoundary) {
    this.state.reloadSelectedCensusBlockId(selectedBoundary.id)
    this.viewCensusBlockInfo(selectedBoundary.id)
    .then(() => {
      map.setCenter({ lat: this.selectedBoundaryInfo.centroid.coordinates[1], lng: this.selectedBoundaryInfo.centroid.coordinates[0] })
    })
  }

  $onDestroy() {
    this.mapFeaturesSelectedEventObserver.unsubscribe();
  }
 
}

BoundaryDetailController.$inject = ['$http','$timeout','state']

export default BoundaryDetailController