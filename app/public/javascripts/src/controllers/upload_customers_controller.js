/* global $ app FormData XMLHttpRequest swal */
app.controller('upload_customers_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  var form = $('#upload_customers_modal form').get(0)
  function initialValues () {
    $('#upload_customers_modal input[type=file]').get(0).value = ''
    $scope.editingDataset = {
      name: ''
    }
  }

  initialValues()

  $rootScope.$on('upload_customers', (e, dataset) => {
    initialValues()
    $scope.editingDataset.name = (dataset && dataset.name) || ''
    $scope.editingDataset.id = dataset && dataset.id
    $('#upload_customers_modal').modal('show')
  })

  $scope.save = () => {
    if ($('#upload_customers_modal input[type=file]').get(0).files.length > 0) {
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
    var id = $scope.editingDataset.id
    var url = id ? `/locations/user_defined/${id}` : '/locations/user_defined'
    var formData = new FormData(form)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.addEventListener('error', (err) => {
      console.log('error', err)
      swal('Error', err.message, 'error')
    })
    xhr.addEventListener('load', function (e) {
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
      $scope.editingDataset.id = data.id
      $rootScope.$broadcast('uploaded_customers', $scope.editingDataset)
      $('#upload_customers_modal').modal('hide')
    })
    xhr.send(formData)
  }
}])
