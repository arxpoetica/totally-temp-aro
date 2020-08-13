/* global app $ globalServiceLayers swal _ */
app.controller('settings_controller', ['$scope', '$rootScope', '$http', '$filter', '$timeout', ($scope, $rootScope, $http, $filter, $timeout) => {
  $scope.serviceLayers = globalServiceLayers

  function fetchApplicationSettings () {
    $http.get('/admin/settings')
      .then((response) => {
        $scope.applicationSettings = response.data
        $scope.changes = {}

        $timeout(() => {
          const parseCost = (input) => +(input.val() || '0').match(/[\d\.]/g).join('') || 0

          $('#application-settings input, #application-settings select')
            .on('focus', function () {
              var input = $(this)
              if (input.hasClass('format-currency')) {
                input.val(parseCost(input).toFixed(2))
              }
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
              if (input.hasClass('format-currency')) {
                values[field] = parseCost(input)
              } else {
                values[field] = input.val()
              }
            })
            .on('blur', function () {
              var input = $(this)
              if (input.hasClass('format-currency')) {
                input.val($filter('number')(parseCost(input), 2))
              }
            })
        }, 0)
      })
  }

  $('#application-settings').on('shown.bs.modal', fetchApplicationSettings)

  $scope.updateSettings = (close) => {
    $http.post('/admin/settings', $scope.changes).then((response) => {
      $scope.changes = {}
      swal({ title: 'Settings saved', type: 'success' })
      if (close) {
        $('#application-settings').modal('hide')
      }
    })
  }

  $('#application-settings').on('hide.bs.modal', (e) => {
    if (_.size($scope.changes) === 0) return
    e.preventDefault()
    setTimeout(() => {
      swal({
        title: 'Are you sure?',
        text: 'Continue without saving changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        showCancelButton: true,
        closeOnConfirm: true
      }, (confirmed) => {
        if (confirmed) {
          $scope.changes = {}
          $('#application-settings').modal('hide')
        }
      })
    }, 100)
  })
}])
