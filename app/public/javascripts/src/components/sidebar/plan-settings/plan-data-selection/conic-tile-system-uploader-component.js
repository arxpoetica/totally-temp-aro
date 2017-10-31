class ConicTileSystemUploaderController {
  constructor($element, $http) {
    this.$element = $element
    this.$http = $http
    this.datasetName = ''
    this.selectedTileSystemId = null
    this.initImpedances()
    $http.get('/morphology/tiles')
    .then((result) => {
      this.tileSystems = result.data
      this.selectedTileSystemId = this.tileSystems.length > 0 ? this.tileSystems[0].id : null
    })
    .catch((err) => console.log(err))
  }

  initImpedances() {
    this.impedances = [{
      code: -9999,
      value: '.35'
    },
    {
      code: 0,
      value: '0.35'
    },
    {
      code: 1,
      value: '0.225'
    },
    {
      code: 3,
      value: '0.35'
    },
    {
      code: 4,
      value: '0.823346304'
    },
    {
      code: 5,
      value: '1'
    },
    {
      code: 65535,
      value: '0.35'
    }]
  }

  removeImpedanceAt(index) {
    this.impedances.splice(index, 1)
  }

  addImpedance() {
    this.impedances.push({
      code: this.impedances.length,
      value: '0.35'
    })
  }

  saveImpedances() {
    var fileToUpload = this.$element.find('#conicTileSystemFile')[0]
    var url = `/locations/morphology/${this.selectedTileSystemId}`
    var formData = new FormData()
    formData.append('name', this.datasetName)
    formData.append('file', fileToUpload.files[0])
    if (this.impedances.length > 0) {
      var defaultImpedance = 1
      var noData = this.impedances.filter((imp) => { return imp.code == defaultImpedance })
      formData.append('mappings', JSON.stringify({ mappings: this.impedances, default: noData }))
    }
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
    })
    xhr.send(formData)
  }
}

ConicTileSystemUploaderController.$inject = ['$element', '$http']

app.component('conicTileSystemUploader', {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/conic-tile-system-uploader-component.html',
  bindings: {},
  controller: ConicTileSystemUploaderController
})