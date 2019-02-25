class ConicTileSystemUploaderController {
  constructor ($element, $http) {
    this.$element = $element
    this.$http = $http
    this.datasetName = ''
    this.isUploading = false
    this.initTileSystemParams()
  }

  $onInit () {
    if (this.onInitControl) {
      this.onInitControl({
        api: {
          save: this.saveTileSystem.bind(this)
        }
      })
    }
  }

  $onDestroy () {
    if (this.onDestroyControl) {
      this.onDestroyControl()
    }
  }

  initTileSystemParams () {
    this.tileSystemParams = {
      conicSystem: {
        code: 'EPSG:5070',
        srid: 5070
      },
      cellSize: 30,
      systemOriginX: '-96.0009191593717',
      systemOriginY: '23.0002109131773',
      tileWidth: 300
    }
  }

  createLibraryId () {
    // First, add some hardcoded values to the tile system params before sending it to the API.
    var postBody = {
      libraryItem: {
        dataType: 'tile_system',
        name: this.datasetName
      },
      param: angular.copy(this.tileSystemParams)
    }
    postBody.param.param_type = 'ts'

    // Then make the call that will provide us with the library id
    return this.$http.post(`/service/v1/project/${this.projectId}/library_ts?user_id=${this.userId}`, postBody)
      .then((result) => Promise.resolve(result.data.libraryItem.identifier))
      .catch((err) => console.error(err))
  }

  saveTileSystem () {
    if (this.isUploading) {
      return // Nothing to do until the last upload is done
    }
    this.isUploading = true
    return this.createLibraryId()
      .then((libraryId) => {
        var fileToUpload = this.$element.find('#conicTileSystemFile')[0]
        var url = `/uploadservice/v1/library/${libraryId}?userId=${this.userId}`
        var formData = new FormData()
        formData.append('file', fileToUpload.files[0])
        // Return the POST request so that it resolves only after the request is complete
        return this.$http.post(url, formData, {
          withCredentials: true,
          headers: { 'Content-Type': undefined },
          transformRequest: angular.identity
        })
      })
      .then((result) => {
        this.isUploading = false
        return Promise.resolve(result)
      })
      .catch((err) => {
        this.isUploading = false
        console.error(err)
      })
  }
}

ConicTileSystemUploaderController.$inject = ['$element', '$http']

let conicTileSystemUploader = {
  templateUrl: '/components/sidebar/plan-settings/plan-data-selection/conic-tile-system-uploader.html',
  bindings: {
    projectId: '<',
    userId: '<',
    onInitControl: '&',
    onDestroyControl: '&'
  },
  controller: ConicTileSystemUploaderController
}

export default conicTileSystemUploader
