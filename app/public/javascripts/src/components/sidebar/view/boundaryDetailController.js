class BoundaryDetailController {

  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedBoundaryInfo = null

    state.mapFeaturesSelectedEvent.subscribe((event) => {
      if ( !event.hasOwnProperty('censusFeatures') 
    		  || event.censusFeatures.length <= 0 
    		  || !event.censusFeatures[0].hasOwnProperty('id') ) return
    	  
    	  let censusBlockId = event.censusFeatures[0].id
      
      this.getCensusBlockInfo(censusBlockId)
        .then((cbInfo) => {
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