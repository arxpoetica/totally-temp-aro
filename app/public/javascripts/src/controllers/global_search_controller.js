/* global app $ map */
// Search Controller
app.controller('global-search-controller', ['$scope', '$rootScope', '$http', 'map_tools', ($scope, $rootScope, $http, map_tools) => {
  var ids = 0
  var search = $('#global-search-controller .select2')
  search.select2({
    placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
    ajax: {
      url: '/search/addresses',
      dataType: 'json',
      delay: 250,
      data: (term) => ({ text: term }),
      results: (data, params) => {
        var items = data.map((location) => {
          return {
            id: 'id-' + (++ids),
            text: location.name,
            bounds: location.bounds,
            centroid: location.centroid
          }
        })
        $scope.search_results = items
        return {
          results: items,
          pagination: {
            more: false
          }
        }
      },
      cache: true
    }
  }).on('change', (e) => {
    var selected = e.added
    if (selected) {
      var centroid = selected.centroid.coordinates
      map.setCenter({ lat: centroid[1], lng: centroid[0] })
      console.log('...', centroid)
    }
  })
}])
