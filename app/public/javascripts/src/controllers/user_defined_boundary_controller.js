/* global $ app FormData XMLHttpRequest swal */
app.controller('user_defined_boundary_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  function initialValues () {
    $scope.editingUserDefinedBoundary = {
      name: '',
      radius: 20000
    }
  }

  initialValues()

  $rootScope.$on('edit_user_defined_boundary', (e, boundary) => {
    initialValues()
    $scope.editingUserDefinedBoundary.name = (boundary && boundary.name) || ''
    $scope.editingUserDefinedBoundary.id = boundary && boundary.id
    $('#user_defined_boundaries_modal').modal('show')
  })

  $scope.saveUserDefiendBoundary = () => {
    var id = $scope.editingUserDefinedBoundary.id
    var url = id ? `/boundary/user_defined/${id}` : '/boundary/user_defined'

    var form = $('#user_defined_boundaries_modal form').get(0)
    var formData = new FormData(form)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.addEventListener('error', (err) => {
      form.reset()
      console.log('error', err)
      swal('Error', err.message, 'error')
    })
    xhr.addEventListener('load', function (e) {
      form.reset()
      try {
        var data = JSON.parse(this.responseText)
      } catch (e) {
        console.log(e, e)
        return swal('Error', 'Unexpected response from server', 'error')
      }
      if (this.status !== 200) {
        return swal('Error', data.error || 'Unknown error', 'error')
      }
      $scope.editingUserDefinedBoundary.id = data.id
      $rootScope.$broadcast('saved_user_defined_boundary', $scope.editingUserDefinedBoundary)
      $('#user_defined_boundaries_modal').modal('hide')
    })
    xhr.send(formData)
  }
}])
