class DataSourceUploadController {
  
  constructor($http, state) {
    this.state = state
    this.$http = $http
    this.userId = state.getUserId()
    this.projectId = state.getProjectId()
    this.editingDataset = {
      name: ''
    }
    
    var form;

    var isDataManagementView = false

    state.showDataSourceUploadModal.subscribe((newValue) => {
      setTimeout(function () {
        $('#data_source_upload_modal input[type=file]').get(0).value = ''
        $('#data_source_upload_modal input[type=text]').get(0).value = ''
        
        isDataManagementView = false;
        form = $('#data_source_upload_modal form').get(0)
      }, 0)
    })

  }

  close() {
    this.state.showDataSourceUploadModal.next(false)
  }

  modalShown() {
    this.state.showDataSourceUploadModal.next(true)
  }

  modalHide() {
    this.state.showDataSourceUploadModal.next(false)
  }

  save() {
    var files = $('#data_source_upload_modal input[type=file]').get(0).files
    if (this.editingDataset.id && files.length > 0) {
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

    this.getLibraryId()
      .then((libraryId) => {
        this.submit(libraryId)
      })
    
  }

  updateDataSource(data) {
    //update the data
  }

  getLibraryId() {
    var libraryOptions = {
      url: '/service/v1/project/' + this.projectId + '/library?user_id=' + this.userId,
      method: 'POST',
      data: {
        dataType: this.state.uploadDataSource.name
      },
      json: true
    }

    return this.$http(libraryOptions)
    .then((response) => {
      return Promise.resolve(response.data.identifier)
    })
  }

  submit(libraryId) {
    var fd = new FormData();
    fd.append("file", $('#data_source_upload_modal input[type=file]').get(0).files[0]);
    var url = '/uploadservice/v1/library/' + libraryId + '?userId=' + this.userId + '&media=CSV'
    
    this.$http.post(url, fd, {
      withCredentials: true,
      headers: { 'Content-Type': undefined },
      transformRequest: angular.identity
    }).then((e) => {
      this.updateDataSource(e.data)
      this.close()
    }).catch((e) => {
      swal('Error', e.statusText, 'error')
    });
    
  }  

}

DataSourceUploadController.$inject = ['$http', 'state']

app.component('globalDataSourceUploadModal', {
  template: `
    <modal visible="$ctrl.state.showDataSourceUploadModal.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
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
        <button class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
      </modal-footer>
    </modal>
  `,
  bindings: {},
  controller: DataSourceUploadController
})