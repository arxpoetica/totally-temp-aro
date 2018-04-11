/* global app $ */
app.controller('selected_census_block_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  var selectedFeature
  // ToDo: is this still used?
  $rootScope.$on('map_layer_clicked_feature', (event, e, layer) => {
    if (layer.type !== 'census_blocks_nbm') return
    var id = e.feature.getProperty('id')
    if (!id) return
    $http.get(`/census_blocks/${id}/info`)
      .then((response) => {
        $scope.carriers = response.data
        $scope.selectedId = e.feature.getProperty('tabblock_id')
        selectedFeature = e.feature
        $('#modal-census-block').modal('show')
      })
  })

  $('#modal-census-block').on('hidden.bs.modal', () => {
    selectedFeature && selectedFeature.setProperty('selected', false)
  })
}])
