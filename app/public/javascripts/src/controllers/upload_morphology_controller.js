/* global $ app FormData XMLHttpRequest swal */
app.controller('upload_morphology_controller', ['$scope', '$rootScope', '$http', ($scope, $rootScope, $http) => {
  var form = $('#upload_morphology_modal form').get(0)
  function initialValues () {
    $('#upload_morphology_modal input[type=file]').get(0).value = ''
    $scope.editingDataset = {
      name: ''
    }
  }

  initialValues()

  $rootScope.$on('upload_morphology', (e, dataset) => {
    initialValues()
    $scope.editingDataset.name = (dataset && dataset.name) || ''
    $scope.editingDataset.id = dataset && dataset.id
    $('#upload_morphology_modal').modal('show')
  })  
  
  getTiles()
  
  function getTiles () {
	  $http({
		url: '/morphology/tiles',
		method: 'GET'
	  })
	  .success((response) => {
		  $scope.tile_systems = response
		  $scope.tileselected = $scope.tile_systems[0].id;
   	  })
  }

  $scope.save = () => {
    var files = $('#upload_morphology_modal input[type=file]').get(0).files
    submit()
  }

  function submit () {
    var id = $scope.tileselected
    var url = id ? `/locations/morphology/${id}` : '/locations/morphology'
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
      $rootScope.$broadcast('uploaded_morphology', $scope.editingDataset)
      $('#upload_morphology_modal').modal('hide')
    })
    xhr.send(formData)
  }
}])
