class NetworkAnalysisModalContentController {

  constructor($scope,$rootScope,$document,$http,$filter, state) {
    this.state = state
    this.$http = $http
    $scope.plan = null

    var charts = {}
    var chartStyles = [
      {
        fillColor: 'rgba(220,220,220,0.5)',
        strokeColor: 'rgba(220,220,220,0.8)',
        highlightFill: 'rgba(220,220,220,0.75)',
        highlightStroke: 'rgba(220,220,220,1)'
      },
      {
        fillColor: 'rgba(151,187,205,0.5)',
        strokeColor: 'rgba(151,187,205,0.8)',
        highlightFill: 'rgba(151,187,205,0.75)',
        highlightStroke: 'rgba(151,187,205,1)'
      },
      {
        fillColor: 'rgba(121,127,121,0.5)',
        strokeColor: 'rgba(121,127,121,0.8)',
        highlightFill: 'rgba(121,127,121,0.75)',
        highlightStroke: 'rgba(121,127,121,1)'
      }
    ]

    $scope.datasets = [
      { key: 'irr', name: 'IRR' },
      { key: 'npv', name: 'NPV' },
      { key: 'coverage', name: 'Coverage' }
    ]

    $scope.selectedOption = $scope.datasets[0]

    state.plan
      .subscribe((plan) => {
        $scope.plan = plan
      })

    state.showNetworkAnalysisOutput
    .subscribe((show) => {
      if(show)
        $scope.showCashFlowChart()
    })

    $scope.showCashFlowChart = () => {
      request('optimization_analysis', {}, (cashFlow) => {
        var data = buildChartData(cashFlow, $scope.selectedOption)
        var options = {
          datasetFill: false,
          bezierCurve: false,
          //scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
          //tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
          //multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        }
        if ($scope.selectedOption.key === 'irr') {
          options.scaleLabel = function (label) { return String($filter('number')(label.value,0) + '%') }
          options.tooltipTemplate = function (label) { return String($filter('number')(label.value,2) + '%') }
          options.multiTooltipTemplate = function (label) { return String($filter('number')(label.value,2) + '%') }
        } else if ($scope.selectedOption.key === 'npv') {
          options.scaleLabel = function (label) { return buildLabel (label,0) }
          options.tooltipTemplate = function (label) { return buildLabel (label,2) }
          options.multiTooltipTemplate = function (label) { return buildLabel (label,2) }
        } else {
          options.scaleLabel = function (label) { return buildLabel (label,1) }
          options.tooltipTemplate = function (label) { return buildLabel (label,2) }
          options.multiTooltipTemplate = function (label) { return buildLabel (label,2) }
        }
        showChart('network-analysis-chart-cash-flow', 'Line', data, options)
      })
    }

    function buildLabel(label, fractionSize) {
      return $filter('currency')(+label.value >= 10000000 ? +label.value / 1000000 : +label.value / 1000, '$', fractionSize) + (+label.value >= 10000000 ? 'M' : 'K')
    }

    function request (key, params, callback) {
      if (!$scope.plan) return
      var plan_id = $scope.plan.id
      //plan_id = 23
      $http({ url: `/reports/network_analysis/${plan_id}/${key}`, params: params })
        .then((response) => {
          callback(response.data)
        })
    }
    
    function buildChartData (result, datasets) {
      var labels = result.splice(0, 1)
      result = result.map((row) => _.object(labels[0],row.map((value) => +value)))
      result = _.sortBy(result,'capex')
      
      return {
        labels: result.map((row) => String($filter('number')(+row.capex/1000,0)+'K')),
        datasets: [datasets].map((dataset, i) => Object.assign({
          label: dataset.name,
          data: result.map((row) => row[dataset.key])
        }, chartStyles[i % chartStyles.length]))
      }
    }

    function showChart (id, type, data, options) {
      charts[id] && charts[id].destroy()
      var elem = document.getElementById(id)
      elem.removeAttribute('width')
      elem.removeAttribute('height')
      elem.style.width = '100%'
      elem.style.height = '200px'
      var ctx = elem.getContext('2d')
      // ctx.fillStyle = 'white'
      // ctx.fillRect(0, 0, elem.offsetWidth, elem.offsetHeight)
      charts[id] = new Chart(ctx)[type](data, options)
      var legend = document.getElementById(id + '-legend')
      if (legend) {
        legend.innerHTML = charts[id].generateLegend()
      }
    }
  }
}

NetworkAnalysisModalContentController.$inject = ['$scope', '$rootScope', '$document','$http','$filter', 'state']

app.component('networkAnalysisContent', {
  template: `
    <div>
      <!-- <ul class="nav nav-tabs" role="tablist">
        <li role="presentation" class="active">
          <a href="#NetworkAnalysisOutput" aria-controls="home" role="tab" data-toggle="tab">Analysis</a>
        </li>
        <li role="presentation">
          <a href="#NetworkAnalysisOutput1" aria-controls="profile" role="tab" data-toggle="tab">Analysis1</a>
        </li>
      </ul>
      <div class="tab-content" style="padding-top: 20px">
        <div role="tabpanel" class="tab-pane active" id="NetworkAnalysisOutput">
          <div>
            <p class="text-center"><strong>Network Analysis Summary</strong></p>
            <canvas id="network-analysis-chart-cash-flow" style="width:100%; height:200px"></canvas>
            <div id="network-analysis-chart-cash-flow-legend"></div>
          </div>
        </div>
        <div role="tabpanel" class="tab-pane" id="NetworkAnalysisOutput1" style="padding-top: 20px">
          <p class="text-center">In output1</p>
          <canvas id="network-analysis-chart-cash-flow1" style="width:100%; height:200px"></canvas>
          <div id="network-analysis-chart-cash-flow1-legend"></div>
        </div>
      </div> -->
      <select class="form-control" style="width: 20%;float: right"
        ng-change="showCashFlowChart()"
        ng-model="selectedOption"
        ng-options="item as item.name for item in datasets">
      </select>
      <canvas id="network-analysis-chart-cash-flow" style="width:100%; height:200px"></canvas>
      <div id="network-analysis-chart-cash-flow-legend"></div>
    </div>
      `,
  bindings: {},
  controller: NetworkAnalysisModalContentController
})

