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

    $scope.downloadChart = () => {
      if (!$scope.plan) return
      window.location.href = `/reports/network_analysis/download/${$scope.plan.id}/optimization_analysis`
    }

    $scope.showCashFlowChart = () => {
      request('optimization_analysis', {}, (cashFlow) => {
        var data = buildChartData(cashFlow, $scope.selectedOption)
        var categories = Object.freeze({
          Normal: 1,
          Thousand: 1000,
          Million: 1000000
        })
        var yAxisCategory = categories.Normal 
        if(_.max(data.datasets[0].data) >= 10000000) 
          yAxisCategory = categories.Million
        else if(_.max(data.datasets[0].data) >= 10000 && _.max(data.datasets[0].data) < 10000000)
          yAxisCategory = categories.Thousand
        else
          yAxisCategory = categories.Normal
        var options = {
          datasetFill: false,
          bezierCurve: false,
          //scaleBeginAtZero : true,
          //scaleLabel: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
          //tooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
          //multiTooltipTemplate: `<%= angular.injector(['ng']).get('$filter')('currency')(value / 1000, '$', 0) + ' K' %>`, // eslint-disable-line
        }
        //Starting Yaxis at zero if minimum value is greater than zero
        if ( _.min(data.datasets[0].data) > 0 ) options.scaleBeginAtZero = true
        
        if ($scope.selectedOption.key === 'irr') {
          options.scaleLabel = function (label) { return buildLabel (label,0,yAxisCategory,false,'%') }
          options.tooltipTemplate = function (label) { return buildLabel (label,2,yAxisCategory,false,'%') }
          options.multiTooltipTemplate = function (label) { return buildLabel (label,2,yAxisCategory,false,'%') }
        } else if ($scope.selectedOption.key === 'npv') {
          options.scaleLabel = function (label) { return buildLabel (label,0,yAxisCategory,true,'$') }
          options.tooltipTemplate = function (label) { return buildLabel (label,2,yAxisCategory,true,'$') }
          options.multiTooltipTemplate = function (label) { return buildLabel (label,2,yAxisCategory,true,'$') }
        } else {
          options.scaleLabel = function (label) { return buildLabel (label,0,yAxisCategory,false) }
          options.tooltipTemplate = function (label) { return buildLabel (label,2,yAxisCategory,false) }
          options.multiTooltipTemplate = function (label) { return buildLabel (label,2,yAxisCategory,false) }
        }
        showChart('network-analysis-chart-cash-flow', 'Line', data, options)
      })
    }

    function buildLabel(label, fractionSize, category, isCurrency, symbol) {
      if (isCurrency)
        return $filter('currency')(+label.value / category, symbol, fractionSize) + (category === 1000000 ? 'M' : 'K')
      else {
        var measure = ''
        if (symbol)
          measure = symbol
        else if (category === 1000000)
          measure = 'M'
        else if (category === 1000)
          measure = 'K'
        
        return $filter('number')(+label.value / category, fractionSize) + `${measure}`
      }
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
      <button ng-click="downloadChart()" class="pull-right btn btn-default btn-sm">
        <span style="color:#4d99e5" class="fa fa-download"></span>
      </button>
      <div id="network-analysis-chart-cash-flow-legend"></div>
    </div>
      `,
  bindings: {},
  controller: NetworkAnalysisModalContentController
})

