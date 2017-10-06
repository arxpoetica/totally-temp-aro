class dataSourceUploadController {
  
  constructor($scope, $http, state) {
    this.state = state
    this.userId = state.getUserId()
    this.projectId = state.getProjectId()
    
    var form;

    var isDataManagementView = false

    $scope.close = () => {
      state.showDataSourceUploadModal.next(false)
    }

    $scope.modalShown = () => {
      state.showDataSourceUploadModal.next(true)
    }

    $scope.modalHide = () => {
      state.showDataSourceUploadModal.next(false)
    }

    state.showDataSourceUploadModal.subscribe((newValue) => {
      setTimeout(function () {
        $('#data_source_upload_modal input[type=file]').get(0).value = ''
        $('#data_source_upload_modal input[type=text]').get(0).value = ''
        
        $scope.editingDataset = {
          name: ''
        }

        isDataManagementView = false;
        // $compile($('#data_source_upload_modal form'))($scope)
        
        form = $('#data_source_upload_modal form').get(0)
      }, 0)
    })

    $scope.save = () => {
      var files = $('#data_source_upload_modal input[type=file]').get(0).files
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

      $scope.getLibraryId()
      .then((libraryId) => {
        $scope.submit(libraryId)
      })
      
    }

    $scope.updateDataSource = (data) => {
      //update the data
    }

    $scope.getLibraryId = () => {
      var libraryOptions = {
        url: '/service/v1/project/' + this.projectId + '/library?user_id=' + this.userId,
        method: 'POST',
        data: {
          dataType: this.state.uploadDataSource.name
        },
        json: true
      }

      return $http(libraryOptions)
      .then((response) => {
        return Promise.resolve(response.data.identifier)
      })
    }

    $scope.submit = (libraryId) => {
      var fd = new FormData();
      fd.append("file", $('#data_source_upload_modal input[type=file]').get(0).files[0]);
      var url = '/uploadservice/v1/library/' + libraryId + '?userId=' + this.userId + '&media=CSV'
      
      $http.post(url, fd, {
        withCredentials: true,
        headers: { 'Content-Type': undefined },
        transformRequest: angular.identity
      }).then(function (e) {
        $scope.updateDataSource(e.data)
        $scope.close()
      }).catch(function (e) {
        swal('Error', err.message, 'error')
      });
      
    }
  }
}

dataSourceUploadController.$inject = ['$scope', '$http', 'state']

app.component('globalDataSourceUploadModal', {
  template: `
    <modal visible="$ctrl.state.showDataSourceUploadModal.value" backdrop="static" on-show="modalShown()" on-hide="modalHide()" >
      <modal-header title="{{!$ctrl.isDataManagementView && 'Upload Data Sources' || 'Data Management'}}"></modal-header>
      <modal-body id="data_source_upload_modal">
        <form class="form-horizontal">
          <div class="form-group">
            <a class="btn pull-right" style="margin-right:15px"  ng-class="{true: 'btn-primary', false: 'btn-danger'}[!patient.archived]" ng-click="$ctrl.isDataManagementView = !$ctrl.isDataManagementView">{{!$ctrl.isDataManagementView && 'Data Management' || 'File Upload'}}</a>
          </div>

          <div class="form-group">
            <label class="col-sm-4 control-label">Data Type</label>
            <div class="col-sm-8">
              <select class="form-control"
                ng-model="$ctrl.state.uploadDataSource"
                ng-options="item as item.label for item in $ctrl.state.uploadDataSources">
              </select>
            </div>
          </div>
        
          <div ng-show="!$ctrl.isDataManagementView">
            <div class="form-group">
              <label class="col-sm-4 control-label">Data Source Name</label>
              <div class="col-sm-8">
                <input type="text" name="name" class="form-control" placeholder="Data Source Name">
              </div>
            </div>
            <div class="form-group">
              <label class="col-sm-4 control-label">File Location</label>
              <div class="col-sm-8">
                <input name="file" type="file" name="dataset" class="form-control">
              </div>
            </div>
          </div>

          <div ng-show="$ctrl.isDataManagementView">
            <div class="form-group">
              <label class="col-sm-4 control-label">Data Sources</label>
              <div class="col-sm-8">
                <show-targets targets="$ctrl.state.allDataSources"></show-targets>
              </div>
            </div>
          </div>
          
        </form>
      </modal-body>
      <modal-footer ng-show="!$ctrl.isDataManagementView">
        <button class="btn btn-primary" ng-click="save()">Save</button>
      </modal-footer>
    </modal>
  `,
  bindings: {},
  controller: dataSourceUploadController
})