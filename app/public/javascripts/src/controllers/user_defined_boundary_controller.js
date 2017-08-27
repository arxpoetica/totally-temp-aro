/* global $ app FormData XMLHttpRequest swal */
app.controller('user_defined_boundary_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  var form = $('#user_defined_boundaries_modal form').get(0)
  function initialValues () {
    $('#user_defined_boundaries_modal input[type=file]').get(0).value = ''
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
    var existing = !!$scope.editingUserDefinedBoundary.id
    var hasFile = $('#user_defined_boundaries_modal input[type=file]').get(0).files.length > 0
    if (existing && hasFile) {
      return swal({
        title: 'Are you sure?',
        text: 'Are you sure you want to overwrite the data which is currently in this boundary layer?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        closeOnConfirm: true
      }, submit)
    }
    submit()
  }

  $scope.uploading = false
  function submit () {
    $scope.uploading = true
    var id = $scope.editingUserDefinedBoundary.id
    var url = id ? `/boundary/user_defined/${id}` : '/boundary/user_defined'
    var formData = new FormData(form)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.addEventListener('error', (err) => {
      $scope.uploading = false
      console.log('error', err)
      swal('Error', err.message, 'error')
    })
    xhr.addEventListener('load', function (e) {
      $scope.uploading = false
      try {
        var data = JSON.parse(this.responseText)
        if (data.error) return swal('Error', data.error, 'error')
      } catch (e) {
        console.log(e, e)
        return swal('Error', 'Unexpected response from server', 'error')
      }
      if (this.status !== 200) {
        return swal('Error', data.error || 'Unknown error', 'error')
      }
      $scope.editingUserDefinedBoundary.id = data.id
      $scope.editingUserDefinedBoundary.name = data.name
      $rootScope.$broadcast('saved_user_defined_boundary', $scope.editingUserDefinedBoundary)
      $('#user_defined_boundaries_modal').modal('hide')
    })
    xhr.send(formData)
  }
}])
