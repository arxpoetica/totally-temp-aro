class NetworkAnalysisModalContentController {

  constructor($scope,$rootScope,$document,$http,$filter, state) {
    this.state = state
    this.$http = $http
    $scope.plan = null

    var charts = {}
    var chartStyles = [   
      {
        borderColor: 'rgba(121,127,121,0.5)',
        pointBorderColor: 'rgba(121,127,121,0.8)',
        pointBackgroundColor: 'rgba(121,127,121,0.75)',
        pointHoverBackgroundColor: 'rgba(121,127,121,1)'
      },
      {
        borderColor: 'rgba(151,187,205,0.5)',
        pointBorderColor: 'rgba(151,187,205,0.8)',
        pointBackgroundColor: 'rgba(151,187,205,0.75)',
        pointHoverBackgroundColor: 'rgba(151,187,205,1)'
      },
      {
        borderColor: 'rgba(220,220,220,0.5)',
        pointBorderColor: 'rgba(220,220,220,0.8)',
        pointBackgroundColor: 'rgba(220,220,220,0.75)',
        pointHoverBackgroundColor: 'rgba(220,220,220,1)'
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
      if (_.size(charts) > 0) charts['network-analysis-chart-cash-flow-panel'] && charts['network-analysis-chart-cash-flow-panel'].destroy()
      if(show)
        this.showCashFlowChart()
    })

    this.downloadChart = () => {
      if (!$scope.plan) return
      window.location.href = `/reports/network_analysis/download/${$scope.plan.id}/optimization_analysis`
    }

    this.showCashFlowChart = () => {
      if (!$scope.plan) return
      request('optimization_analysis', {}, (cashFlow) => {
        var data = buildChartData(cashFlow, $scope.selectedOption)
        var categories = Object.freeze({
          Normal: 1,
          Thousand: 1000,
          Million: 1000000
        })
        var yAxisCategory = categories.Normal
        var MaxYVal = Math.max(...data.datasets[0].data.map(val => val.y)) 
        if(MaxYVal >= 10000000) 
          yAxisCategory = categories.Million
        else if(MaxYVal >= 10000 && MaxYVal < 10000000)
          yAxisCategory = categories.Thousand
        else
          yAxisCategory = categories.Normal
      
        var tooltips = {}
        var options = {
          elements: {
            line: {
              fill: false,
              tension: 0, // disables bezier curves
            }
          },
          tooltips: {},
          scales: {},
          showLines: true
        }

        if ($scope.selectedOption.key === 'irr') {
          options.scales = { yAxes: [{ ticks: { callback: function (value, index, values) { return buildLabel(value, 0, yAxisCategory, false, '%') },beginAtZero:  true } }] }
          tooltips = {
            callbacks: {
              label: function (tooltipItems, data) {
                return buildTooltipLabel(tooltipItems,data, 2, yAxisCategory, false, '%')
              }
            }
          }
        } else if ($scope.selectedOption.key === 'npv') {
          options.scales = { yAxes: [{ ticks: { callback: function (value, index, values) { return buildLabel(value, 0, yAxisCategory, true, '$') },beginAtZero:  true } }] }
          tooltips = {
            callbacks: {
              label: function (tooltipItems, data) {
                return buildTooltipLabel(tooltipItems,data, 2, yAxisCategory, true, '$')
              }
            }
          }
        } else {
          options.scales = { yAxes: [{ ticks: { callback: function (value, index, values) { return buildLabel(value, 0, yAxisCategory, false) },beginAtZero:  true } }] }
          tooltips = {
            callbacks: {
              label: function (tooltipItems, data) {
                return buildTooltipLabel(tooltipItems,data, 2, yAxisCategory, false)
              }
            }
          }
        }
        
        options.scales.xAxes = [{ ticks: {
          userCallback: function(label, index, labels) {
            var MaxXVal = _.max(labels)
            var xAxisCategory = categories.Normal
            if(MaxXVal >= 10000000) 
              xAxisCategory = categories.Million
            else if(MaxXVal >= 10000 && MaxXVal < 10000000)
              xAxisCategory = categories.Thousand
            else
              xAxisCategory = categories.Normal
            return String($filter('number')(+label/xAxisCategory,0) + (xAxisCategory === 1000000 ? 'M' : 'K'))
          }, autoSkip:true, maxTicksLimit:10 } }]
        options.tooltips = tooltips
        showChart(this.target, 'scatter', data, options)
      })
    }

    function buildLabel(value, fractionSize, category, isCurrency, symbol) {
      if (isCurrency)
        return $filter('currency')(value / category, symbol, fractionSize) + (category === 1000000 ? 'M' : 'K')
      else {        
        return $filter('number')(value / category, fractionSize) + (symbol ? symbol : (category === 1000000 ? 'M' : (category === 1000 ? 'K' : '')))
      }
    }

    function buildTooltipLabel(value,data, fractionSize, category, isCurrency, symbol) {
      var tooltip = "CAPEX:" + String($filter('number')(+data.datasets[0].data[value.index].x/1000,0)+'K')
         + ';' +data.datasets[value.datasetIndex].label +': '
      if (isCurrency)
        return tooltip + $filter('currency')(value.yLabel / category, symbol, fractionSize) + (category === 1000000 ? 'M' : 'K')
      else {        
        return tooltip + $filter('number')(value.yLabel / category, fractionSize) + (symbol ? symbol : (category === 1000000 ? 'M' : (category === 1000 ? 'K' : '')))
      }
    }

    function request (key, params, callback) {
      if (!$scope.plan) return
      var plan_id = $scope.plan.id
      $http({ url: `/reports/network_analysis/${plan_id}/${key}`, params: params })
        .then((response) => {
          callback(response.data)
        })
    }
    
    function buildChartData (result, datasets) {
      var labels = result.splice(0, 1)
      result = result.map((row) => _.object(labels[0],row.map((value) => +value)))
      result = _.sortBy(result,'index')
      
      return {
        datasets: [datasets].map((dataset, i) => Object.assign({
          label: dataset.name,
          data: result.map((row) => ({x:row.capex,y:row[dataset.key]}))
        }, chartStyles[i % chartStyles.length]))
      }
    }

    function showChart (id, type, data, options) {
      charts[id] && charts[id].destroy()
      var elem = document.getElementById(id)
      elem.removeAttribute('width')
      elem.removeAttribute('height')
      elem.style.width = '100%'
      elem.style.maxWidth = '100%'
      elem.style.height = '250px'
      //elem.style.maxHeight = '500px'
      var ctx = elem.getContext('2d')
      // ctx.fillStyle = 'white'
      // ctx.fillRect(0, 0, elem.offsetWidth, elem.offsetHeight)
      //charts[id] = new Chart(ctx)[type](data, options)    
      
      charts[id] = new Chart(ctx, {
        type: type,
        data: data,
        options: options
      })
     
      var legend = document.getElementById(id + '-legend')
      if (legend) {
        legend.innerHTML = charts[id].generateLegend()
      }
    }

    this.showCashFlowChart()    
  }
}

NetworkAnalysisModalContentController.$inject = ['$scope', '$rootScope', '$document','$http','$filter', 'state']

app.component('networkAnalysisContent', {
  template: `
    <div>
      <select class="form-control" style="width: 20%;float: right"
        ng-change="$ctrl.showCashFlowChart()"
        ng-model="selectedOption"
        ng-options="item as item.name for item in datasets">
      </select>
      <canvas ng-attr-id= "{{ $ctrl.target }}" style="width:100%; height:200px"></canvas>
    </div>
  `,
  bindings: {
    target: '@'
  },
  controller: NetworkAnalysisModalContentController
})

