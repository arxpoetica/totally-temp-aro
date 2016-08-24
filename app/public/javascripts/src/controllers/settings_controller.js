/* global app $ */
// Navigation Menu Controller
app.controller('settings_controller', ['$scope', '$rootScope', '$http', '$filter', '$timeout', ($scope, $rootScope, $http, $filter, $timeout) => {
  function fetchApplicationSettings () {
    $http.get('/admin/settings')
      .success((response) => {
        $scope.applicationSettings = response
        $scope.changes = {}

        $timeout(() => {
          const parseCost = (input) => +(input.val() || '0').match(/[\d\.]/g).join('') || 0

          $('#application-settings .format-currency')
            .on('focus', function () {
              var input = $(this)
              input.val(parseCost(input).toFixed(2))
            })
            .on('change', function () {
              var input = $(this)
              var tab = input.data('tab')
              var id = input.data('id')
              var field = input.data('field')
              var obj = $scope.changes[tab] || {}
              $scope.changes[tab] = obj
              var values = obj[id] || {}
              obj[id] = values
              values[field] = parseCost(input)
            })
            .on('blur', function () {
              var input = $(this)
              input.val($filter('number')(parseCost(input), 2))
            })
        }, 0)
      })
  }

  $('#application-settings').on('shown.bs.modal', fetchApplicationSettings)

  $scope.updateSettings = () => {
    $http.post('/admin/settings', $scope.changes).success((response) => {
      $scope.changes = {}
      $('#application-settings').modal('hide')
    })
  }
}])
