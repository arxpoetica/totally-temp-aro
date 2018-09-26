class ReportModalController {
  constructor($scope ,$http, state, configuration) {
    this.state = state
    this.analysis = []
    this.$http = $http
    this.configuration = $scope.configuration = configuration

    this.plan
    state.plan.subscribe((newPlan) => {
      if (newPlan) {
        this.plan = newPlan
      }
    })
  }

  close() {
    this.state.reportModal.next(false)
    //this.state.previousModal.next(true)
  }

  modalShown() {
    this.state.reportModal.next(true)
    if(this.plan) {
      this.loadPlanReport()
    }
  }

  modalHide() {
    this.state.reportModal.next(false)
    //this.state.previousModal.next(true)
  }
    
  loadPlanReport() {
    //console.log("load report: "+this.plan.id)
    this.$http.get(`/reports/tabc/${this.plan.id}/list`).then((response) => {
      //console.log(response)
      //if ($scope.plan.id !== plan.id) return
      var twoDigits = (d) => d > 9 ? String(d) : '0' + d
      var date = new Date()
      var now = `${date.getFullYear()}${twoDigits(date.getMonth() + 1)}${twoDigits(date.getDate())}`
      var prefix = (reportId) => `${now}_${this.plan.id}_${twoDigits(reportId)}_${this.plan.area_name}`
      var tabcNames = [
        { name: 'T', id: 1, description: 'A_ring' },
        { name: 'A', id: 2, description: 'B_ring' },
        { name: 'B', id: 3, description: 'C_ring' },
        { name: 'C', id: 4, description: 'D_ring' }
      ]
      var analysis = [
        {
          name: `${prefix(0)}_ABCD_summary`,
          type: '.csv',
          url: `/reports/tabc/${this.plan.id}/summary_query`
        }
      ]
      var kml = tabcNames
        .filter((tabcName) => response.data.indexOf(tabcName.name) >= 0)
        .map((tabcName) => {
          return {
            name: `${prefix(tabcName.id)}_${tabcName.description}`,
            type: '.kml',
            url: `/reports/tabc/${this.plan.id}/kml/${tabcName.name}`
          }
        })
      analysis = analysis.concat(kml)
      analysis = analysis.concat([
        {
          name: `${prefix(5)}_endpoints_CRAN_maps`,
          type: '.csv',
          url: `/reports/tabc/${this.plan.id}/master_output_producer`
        },
        {
          name: `${prefix(6)}_dropped_included_towers_list`,
          type: '.csv',
          url: `/reports/tabc/${this.plan.id}/tower_details`
        },
        {
          name: `${prefix(7)}_Thiessen_Polygons`,
          type: '.kml',
          url: `/reports/user_defined/${this.plan.id}/kml`
        },
        {
          name: `${prefix(10)}_Fiber_Zone_summary`,
          type: '.csv',
          url: `/reports/tabc/${this.plan.id}/fiber_zone_summary`
        },
        {
          name: prefix(11) + '_A_route_400m_prem_passed',
          type: '.csv',
          url: '/reports/tabc/' + this.plan.id + '/a_route_400m_prem_passed'
        },
        {
          name: prefix(13) + '_A_route_150m_prem',
          type: '.csv',
          url: '/reports/tabc/' + this.plan.id + '/a_route_150m_prem'
        },
        {
          name: prefix(12) + '_Fiber_Miles_by_UACE',
          type: '.csv',
          url: '/reports/tabc/' + this.plan.id + '/fiber_miles_uace'
        },
        {
          name: 'ABCD Summary Formatted',
          type: '.xlsx',
          url: '/csv/ABCD Summary Formatted.xlsx'
        },
        {
          name : 'Equipment Summary',
          type: '.csv',
          url: '/reports/'+this.plan.id+'/network/csv/nodes'
        },
        {
          name: 'Service Area Summary',
          type: '.csv',
          url: `/service-reports/ServiceAreaSummary.csv/v1/report-extended/service_area_summary/${this.plan.id}.csv`
        }
      ])
      
      if (this.configuration.perspective.extendedAnalysis){
        analysis = analysis.concat([
          {
            name: `${now}_${this.plan.id}_${this.plan.area_name}_BVB_Summary_Output`,
            type: '.csv',
            url: `/reports/tabc/${this.plan.id}/build_vs_buy_summary`
          },
          {
            name: `${now}_${this.plan.id}_${this.plan.area_name}_BVB_Summary_Formatted`,
            type: '.xlsx',
            url: '/csv/BVB Summary Formatted.xlsx'
          }
        ])
      }
      
      //console.log(analysis)
      this.analysis = analysis
    }).catch((err) => {
      console.error(err)
    })
  }

}

ReportModalController.$inject = ['$scope', '$http', 'state', 'configuration']

let reportModal = {
  template: `
  <modal visible="$ctrl.state.reportModal.value" backdrop="static" on-show="$ctrl.modalShown()" on-hide="$ctrl.modalHide()" >
    <modal-header title="Reports"></modal-header>
      <modal-body style="max-height: 500px; overflow: scroll;">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Type</th>
              <th>Date Created</th>
              <th class="col-md-1"></th>
            </tr>
          </thead>
          <tbody>
            <tr ng-repeat="file in $ctrl.analysis">
              <td>{{ file.name }}</td>
              <td>{{ file.type }}</td>
              <td>{{ $ctrl.plan.updated_at | date:'shortDate' }}</td>
              <td>
                <a ng-show="file.url" href="{{ file.url }}" class="btn btn-primary btn-xs" download="{{ file.name }}{{ file.type }}">
                  <span class="fa fa-download"></span> Download
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </modal-body>
    <modal-footer>
      <button type="button" class="btn btn-default" disabled>Download all reports</button>
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
    </modal-footer>
  </modal>
  `,
  bindings: {},
  controller: ReportModalController
}

export default reportModal