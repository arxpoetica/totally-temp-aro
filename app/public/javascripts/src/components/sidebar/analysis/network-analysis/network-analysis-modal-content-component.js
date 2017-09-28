class NetworkAnalysisModalContentController {

  constructor($document,$http,$filter,$element,$attrs, state) {
    this.state = state
    this.$http = $http
    this.$filter = $filter
    this.$document = $document
    this.$element = $element
    this.$attrs = $attrs
    this.plan = null

    this.charts = {}
    this.chartStyles = [   
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

    this.datasets = [
      { key: 'irr', name: 'IRR' },
      { key: 'npv', name: 'NPV' },
      { key: 'coverage', name: 'Coverage' }
    ]

    this.selectedOption = this.datasets[0]

    this.categories = Object.freeze({
      Normal: 1,
      Thousand: 1000,
      Million: 1000000
    })

    state.plan
      .subscribe((plan) => {
        this.plan = plan
      })
    
    state.showNetworkAnalysisOutput
    .subscribe((show) => {
      if (_.size(this.charts) > 0) this.charts['network-analysis-chart-cash-flow-panel'] && this.charts['network-analysis-chart-cash-flow-panel'].destroy()
      if(show)
        this.showCashFlowChart()
    })
    
    this.showCashFlowChart()    
  }

  showCashFlowChart() {
    if (!this.plan) return 
    this.request('optimization_analysis', {}, (cashFlow) => {
      var data = this.buildChartData(cashFlow, this.selectedOption)

      var MaxYVal = Math.max(...data.datasets[0].data.map(val => val.y)) 
      var yAxisCategory = this.assignCategory(MaxYVal)
    
      var tooltips = {}
      var options = {
        elements: { line: { fill: false, tension: 0, } }, // disables bezier curves
        tooltips: {},
        scales: {},
        showLines: true,
        responsive: true,
        maintainAspectRatio: false
      }

      if (this.selectedOption.key === 'irr') {
        options.scales = { yAxes: [{ ticks: { callback: (value, index, values) => { return this.buildLabel(value * 100, 0, yAxisCategory, false, '%') },beginAtZero:  true } }] }
        tooltips = {
          callbacks: {
            label: (tooltipItems, data) => {
              return this.buildTooltipLabel(tooltipItems,data, 2, yAxisCategory, false, '%')
            }
          }
        }
      } else if (this.selectedOption.key === 'npv') {
        options.scales = { yAxes: [{ ticks: { callback: (value, index, values) => { return this.buildLabel(value, 0, yAxisCategory, true, '$') },beginAtZero:  true } }] }
        tooltips = {
          callbacks: {
            label: (tooltipItems, data) => {
              return this.buildTooltipLabel(tooltipItems,data, 2, yAxisCategory, true, '$')
            }
          }
        }
      } else {
        options.scales = { yAxes: [{ ticks: { callback: (value, index, values) => { return this.buildLabel(value, 0, yAxisCategory, false) },beginAtZero:  true } }] }
        tooltips = {
          callbacks: {
            label: (tooltipItems, data) => {
              return this.buildTooltipLabel(tooltipItems,data, 2, yAxisCategory, false)
            }
          }
        }
      }
      
      options.scales.xAxes = [{ ticks: {
        userCallback: (label, index, labels) => {
          var MaxXVal = _.max(labels)
          var xAxisCategory = this.assignCategory(MaxXVal)
          return String(this.$filter('number')(+label/xAxisCategory,0) + (xAxisCategory === 1000000 ? 'M' : 'K'))
        }, autoSkip:true, maxTicksLimit:10 } }]
      options.tooltips = tooltips
      this.showChart(this.$attrs.target, 'scatter', data, options)
    })
  }

  assignCategory(maxVal) {
    var axisCategory = this.categories.Normal
    if(maxVal >= 10000000) 
      axisCategory = this.categories.Million
    else if(maxVal >= 10000 && maxVal < 10000000)
      axisCategory = this.categories.Thousand
    else
      axisCategory = this.categories.Normal
    return axisCategory
  }

  buildLabel(value, fractionSize, category, isCurrency, symbol) {
    if (isCurrency)
      return this.$filter('currency')(value / category, symbol, fractionSize) + (category === 1000000 ? 'M' : 'K')
    else {        
      return this.$filter('number')(value / category, fractionSize) + (symbol ? symbol : (category === 1000000 ? 'M' : (category === 1000 ? 'K' : '')))
    }
  }

  buildTooltipLabel(value,data, fractionSize, category, isCurrency, symbol) {
    var tooltip = "CAPEX:" + String(this.$filter('number')(+data.datasets[0].data[value.index].x/1000,0)+'K')
       + ';' +data.datasets[value.datasetIndex].label +': '
    if (isCurrency)
      return tooltip + this.$filter('currency')(value.yLabel / category, symbol, fractionSize) + (category === 1000000 ? 'M' : 'K')
    else {        
      return tooltip + (symbol ? this.$filter('number')(value.yLabel * 100 / category, fractionSize) : this.$filter('number')(value.yLabel / category, fractionSize))  
        + (symbol ? symbol : (category === 1000000 ? 'M' : (category === 1000 ? 'K' : '')))
    }
  }

  request (key, params, callback) {
    if (!this.plan) return
    var plan_id = this.plan.id
    this.$http({ url: `/reports/network_analysis/${plan_id}/${key}`, params: params })
      .then((response) => {
        callback(response.data)
      })
  }

  buildChartData (result, datasets) {
    var labels = result.splice(0, 1)
    result = result.map((row) => _.object(labels[0],row.map((value) => +value)))
    result = _.sortBy(result,'index')
    
    return {
      datasets: [datasets].map((dataset, i) => Object.assign({
        label: dataset.name,
        data: result.map((row) => ({x:row.capex,y:row[dataset.key]}))
      }, this.chartStyles[i % this.chartStyles.length]))
    }
  }

  showChart (id, type, data, options) {
    this.charts[id] && this.charts[id].destroy()
    var elem = this.$document[0].getElementById(id)
    var ctx = elem.getContext('2d')
    
    this.charts[id] = new Chart(ctx, {
      type: type,
      data: data,
      options: options
    })
   
  }
}

NetworkAnalysisModalContentController.$inject = ['$document','$http','$filter','$element','$attrs', 'state']

app.component('networkAnalysisContent', {
  template: `
    <div>
      <select class="form-control" style="width: 20%;float: right"
        ng-change="$ctrl.showCashFlowChart()"
        ng-model="$ctrl.selectedOption"
        ng-options="item as item.name for item in $ctrl.datasets">
      </select>
      <div style="position: relative; width: 100%; height: 300px">
        <canvas ng-attr-id= "{{ $ctrl.$attrs.target }}"></canvas>
      </div>
    </div>
  `,
  controller: NetworkAnalysisModalContentController
})

