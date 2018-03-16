// export default function bar() {
//   return "hello webpack"
// }

class BoundaryDetailController {

  constructor($http, state) {
    this.$http = $http
    this.state = state
    this.selectedBoundaryInfo = null

    state.censusBlockSelectedEvent.subscribe((cbdata) => {

      if (_.isEmpty(cbdata)) return
      this.getCensusBlockInfo(cbdata.getProperty('id'))
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

export { BoundaryDetailController }  