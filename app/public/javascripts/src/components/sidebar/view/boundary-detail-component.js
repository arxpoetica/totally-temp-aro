class BoundaryDetailController {

  constructor($http,state) {
    this.$http = $http
    this.state = state
    this.selectedBoundaryInfo = null

    state.censusBlockSelectedEvent.subscribe((cbdata) => {

    if(_.isEmpty(cbdata)) return
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

BoundaryDetailController.$inject = ['$http','state']

app.component('boundaryDetail', {
  template: `
  <style scoped>
    .boundary-detail {
      position: relative; /* This will require the parent to have position: relative or absolute */
    }
    .boundary-detail > div {
      margin-top: 10px;
    }
  </style>
  <div class="boundary-detail" ng-if="$ctrl.selectedBoundaryInfo !== null">
    <div>Census Block Code: {{$ctrl.selectedBoundaryInfo.tabblock_id}}</div>
    <div>Name: {{$ctrl.selectedBoundaryInfo.name}}</div>
    <div>Land Area(sq. miles): {{$ctrl.selectedBoundaryInfo.aland / (1609.34 * 1609.34)}}</div>
    <div>Water Area(sq. miles): {{$ctrl.selectedBoundaryInfo.awater / (1609.34 * 1609.34)}}</div>
    <div>centroid: {{$ctrl.selectedBoundaryInfo.centroid.coordinates}}</div>
  </div>
  `,
  bindings: {},
  controller: BoundaryDetailController
})