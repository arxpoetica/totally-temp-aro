/* global app $ */
app.controller('selected_census_block_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $rootScope.$on('map_layer_clicked_feature', (event, e, layer) => {
    if (layer.type !== 'census_blocks_nbm') return
    var id = e.feature.getProperty('id')
    console.log('id', id)
    if (!id) return
    $http.get('/census_blocks/' + id)
      .success((response) => {
        $scope.carriers = response
        console.log('response', response)
        $('#modal-census-block').modal('show')
      })
  })
}])
