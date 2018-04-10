class BoundaryDetailController {

  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedBoundaryInfo = null

    state.censusBlockSelectedEvent.subscribe((cbdata) => {

      if (_.isEmpty(cbdata)) return
      let cbId 
      if (cbdata.hasOwnProperty('id')){
    	    cbId = cbdata.id
      }else if(cbdata.hasOwnProperty('getProperty')){ // this may not be necessary anymore
    	    cbId = cbdata.getProperty('id')
      }else{
    	    return
      }
      this.getCensusBlockInfo(cbId)
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