class BoundaryDetailController {

  constructor($http, $timeout, state) {
    this.$http = $http
    this.$timeout = $timeout
    this.state = state
    this.selectedBoundaryInfo = null
    this.selectedSAInfo = null
    this.selectedAnalysisAreaInfo = null
    this.selectedBoundaryTags = []
    this.selectedBoundary = null
    
    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
    })

    this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.skip(1).subscribe((event) => {
      //In ruler mode click should not enable boundary view action
      if(this.state.allowViewModeClickAction()) {
        this.selectedBoundary = null
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
            this.viewAnalysisAreaInfo(event.analysisAreas[0])
            this.state.reloadSelectedAnalysisArea(event.analysisAreas[0].id)
        }
      } else {
        return
      }
    })
  }

  viewServiceAreaInfo(serviceArea) {
    this.selectedBoundaryInfo = null
    this.selectedAnalysisAreaInfo = null
    this.getServiceAreaInfo(serviceArea.id)
    .then((serviceAreaInfo) => {
      this.selectedSAInfo = serviceAreaInfo
    })
    this.viewBoundaryInfo()
    this.$timeout()
  }

  getServiceAreaInfo(serviceAreaId) {
    return this.state.loadEntityList('ServiceAreaView',serviceAreaId,'id,code,name','id')
    .then((serviceAreaInfo) => {
      return serviceAreaInfo[0]
    })
  }

  viewAnalysisAreaInfo(analysisArea) {
    this.selectedBoundaryInfo = null
    this.selectedSAInfo = null
    this.getAnalysisAreaInfo(analysisArea.id)
    .then((analysisAreaInfo) => {
      this.selectedAnalysisAreaInfo = analysisAreaInfo
    })
    this.viewBoundaryInfo()
    this.$timeout()
  }

  getAnalysisAreaInfo(analysisAreaId) {
    return this.state.loadEntityList('AnalysisArea',analysisAreaId,'id,code','id')
    .then((analysisAreaInfo) => {
      return analysisAreaInfo[0]
    })
  }

  getCensusBlockInfo(cbId) {
    var censusBlockInfo = null
    return this.$http.get('/census_blocks/' + cbId + '/details')
      .then((response) => {
        censusBlockInfo = response.data
        return this.$http.get(`/service/plan-query/${this.state.plan.getValue().id}/censusBlockCounts?census-block-ids=${censusBlockInfo.id}`)
      })
      .then((response) => {
        censusBlockInfo.locationCount = response.data
        return censusBlockInfo
      })
  }

  viewCensusBlockInfo(censusBlockId) {
    return this.getCensusBlockInfo(censusBlockId).then((cbInfo) => {
      this.selectedSAInfo = null
      this.selectedAnalysisAreaInfo = null
      this.selectedBoundaryInfo = cbInfo
      this.viewBoundaryInfo()
    })
  }

  viewSelectedBoundary(selectedBoundary) {
    var visibleBoundaryLayer = this.state.selectedBoundaryTypeforSearch
    if(visibleBoundaryLayer && visibleBoundaryLayer.type === 'census_blocks') {
      this.state.reloadSelectedCensusBlockId(selectedBoundary.id)
      this.viewCensusBlockInfo(selectedBoundary.id)
      .then(() => {
        map.setCenter({ lat: this.selectedBoundaryInfo.centroid.coordinates[1], lng: this.selectedBoundaryInfo.centroid.coordinates[0] })
      })
    } else if(visibleBoundaryLayer && visibleBoundaryLayer.type === 'wirecenter') {
      this.state.reloadSelectedServiceArea(selectedBoundary.id)
      this.viewServiceAreaInfo(selectedBoundary)
      map.setCenter({ lat: selectedBoundary.centroid.coordinates[1], lng: selectedBoundary.centroid.coordinates[0] })
    } else if(visibleBoundaryLayer && visibleBoundaryLayer.type === 'analysis_layer') {
      this.state.reloadSelectedAnalysisArea(selectedBoundary.id)
      this.viewAnalysisAreaInfo(selectedBoundary)
      map.setCenter({ lat: selectedBoundary.centroid.coordinates[1], lng: selectedBoundary.centroid.coordinates[0] })
    }  
  }

  viewBoundaryInfo() {
    this.state.activeViewModePanel = this.state.viewModePanels.BOUNDARIES_INFO
  }

  clearBoundariesInfo() {
    this.selectedBoundaryInfo = null
    this.selectedSAInfo = null
    this.selectedAnalysisAreaInfo = null
  }

  clearBoundariesDetails() {
    this.state.clearEntityTypeBoundaryList() //clear boundaries search list
    this.selectedBoundary = null
    this.clearBoundariesInfo()
  }

  onChangeBoundaryTypeforSearch() {
    this.clearBoundariesDetails()
  }

  $onInit() {
    this.clearViewModeObserver = this.state.clearViewMode.subscribe((clear) => {
      clear && this.clearBoundariesInfo()  
    })

    this.resetSearchObserver = this.state.resetBoundarySearch.skip(1).subscribe((reset) => {
      reset && this.clearBoundariesDetails()
    })
  }

  $onDestroy() {
    this.mapFeaturesSelectedEventObserver.unsubscribe();
    this.resetSearchObserver.unsubscribe()
    this.clearViewModeObserver.unsubscribe()
  }
 
}

BoundaryDetailController.$inject = ['$http','$timeout','state']

export default BoundaryDetailController