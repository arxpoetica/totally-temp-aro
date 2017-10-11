class PlanResourceEditorModalController {
  
  constructor() {
  }

  hideModal() {
    this.showModal = false
  }

  $onChanges(changesObj) {
    if (changesObj.planResource) {
      // The plan resource has changed
    }
  }
}

// PlanResourceEditorModalController.$inject = []

app.component('planResourceEditorModal', {
  template: `
    <modal visible="$ctrl.showModal" backdrop="static" on-hide="$ctrl.hideModal()" >
      <modal-header title="{{$ctrl.planResource.description}}"></modal-header>
      <modal-body id="resource_editor_modal">
        <form class="form-horizontal">

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
        <button class="btn btn-primary" ng-click="$ctrl.save()"><span ng-show="$ctrl.isUpLoad" class="spin fa fa-repeat"></span> Save</button>
      </modal-footer>
    </modal>
  `,
  bindings: {
    showModal: '=',
    planResource: '<'
  },
  controller: PlanResourceEditorModalController
})