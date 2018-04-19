class BoundaryDetailController {

  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedBoundaryInfo = null
    this.selectedBoundaryTags = []
    
    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
    })

    state.mapFeaturesSelectedEvent.subscribe((event) => {
      if ( !event.hasOwnProperty('censusFeatures') 
    		  || event.censusFeatures.length <= 0 
    		  || !event.censusFeatures[0].hasOwnProperty('id') ) return
    	  
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
      this.getCensusBlockInfo(censusBlockId).then((cbInfo) => {
        this.selectedBoundaryInfo = cbInfo
      })
    })
  }

  getCensusBlockInfo(cbId) {
    return this.$http.get('/census_blocks/' + cbId + '/details')
      .then((response) => {
        return response.data
      })
  }
}

BoundaryDetailController.$inject = ['$http', 'state']

export default BoundaryDetailController