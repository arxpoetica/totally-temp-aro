class NetworkAnalysisModalContentController {

  constructor($scope,$rootScope,$document,$http, state) {
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
  
    $rootScope.$on('plan_selected', planChanged)

    function planChanged(e, plan) {
      $scope.plan = plan
      if (!plan) return
    }

    state.showNetworkAnalysisOutput
    .subscribe((show) => {
      if(show)
        showCashFlowChart()
    })

    function showCashFlowChart(force) {
      var datasets = [
        { key: 'bau', name: 'BAU' },
        { key: 'plan', name: 'Plan' },
        { key: 'incremental', name: 'Incremental' }
      ]
      request(force, 'cash_flow', {}, (cashFlow) => {
        var data = buildChartData(cashFlow, datasets)
        var options = {
          datasetFill: false,
          bezierCurve: false,
          scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
          tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
          multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        }
        showChart('network-analysis-chart-cash-flow', 'Line', data, options)
      })
    }

    $scope.financialData = {}
    function request (force, key, params, callback) {
      if (!$scope.plan) return
      if (force) delete $scope.financialData[key]
      else if ($scope.financialData[key]) return $scope.financialData[key]
      var plan_id = $scope.plan.id
      $http({ url: `/financial_profile/${plan_id}/${key}`, params: params })
        .then((response) => {
          $scope.financialData[key] = response.data
          callback(response.data)
        })
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
  
    function buildChartData (result, datasets) {
      return {
        labels: result.map((row) => String(row.year)),
        datasets: datasets.map((dataset, i) => Object.assign({
          label: dataset.name,
          data: result.map((row) => row[dataset.key])
        }, chartStyles[i % chartStyles.length]))
      }
    }
  }
}

NetworkAnalysisModalContentController.$inject = ['$scope', '$rootScope', '$document','$http', 'state']

app.component('networkAnalysisContent', {
  template: `
    <div>
      <ul class="nav nav-tabs" role="tablist">
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
        </div>
      </div>
    </div>
      `,
  bindings: {},
  controller: NetworkAnalysisModalContentController
})

