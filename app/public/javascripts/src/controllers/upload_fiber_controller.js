/* global $ app FormData XMLHttpRequest swal */
app.controller('upload_fiber_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  $scope.uploading = false

  var form = $('#upload_fiber_modal form').get(0)
  function initialValues () {
    $('#upload_fiber_modal input[type=file]').get(0).value = ''
    $scope.editingDataset = {
      name: ''
    }
  }

  initialValues()

  $rootScope.$on('upload_fiber', (e, dataset) => {
    initialValues()
    $scope.editingDataset.name = (dataset && dataset.name) || ''
    $scope.editingDataset.id = dataset && dataset.id
    $('#upload_fiber_modal').modal('show')
  })

  $scope.save = () => {
    var files = $('#upload_fiber_modal input[type=file]').get(0).files
    if ($scope.editingDataset.id && files.length > 0) {
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

  function submit () {
    // var id = $scope.editingDataset.id
    var url = '/user_fiber/upload'
    var formData = new FormData(form)
    var name = formData.get('name')
    formData.set("fileType",formData.get('file').name.split('.').pop().toUpperCase())
    if (!name) return swal({ title: 'Error', text: 'Please enter a name for the uploaded dataset', type: 'error' })
    $scope.uploading = true
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.addEventListener('error', (err) => {
      console.log('error', err)
      swal('Error', err.message, 'error')
    })
    xhr.addEventListener('load', function (e) {
      $scope.uploading = false
      try {
        var data = JSON.parse(this.responseText)
        if (data.error) return swal('Error', data.error, 'error')
        console.log('data', data)
        $rootScope.$broadcast('uploaded_fiber', data)
        $('#upload_fiber_modal').modal('hide')
      } catch (e) {
        console.log(e, e)
        return swal('Error', 'Unexpected response from server', 'error')
      }
      if (this.status !== 200) {
        return swal('Error', data.error || 'Unknown error', 'error')
      }
    })
    xhr.send(formData)
  }
}])
