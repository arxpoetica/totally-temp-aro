
class BoundaryCoverageController {
  constructor ($timeout, $http, $element, state, Utils) {
    this.$timeout = $timeout
    this.$http = $http
    this.$element = $element
    this.state = state
    this.utils = Utils

    this.boundaryCoverageById = {}

    this.isWorking = false
    this.isChartInit = false
    this.coverageChart = null

    this.censusCategories = this.state.censusCategories.getValue()
    this.state.censusCategories.subscribe((newValue) => {
      this.censusCategories = newValue
    })

    this.chartSettings = {
      'household': {
        label: 'residential',
        backgroundColor: '#76c793',
        borderColor: '#76c793',
        data: []
      },
      'small': {
        label: 'small',
        backgroundColor: '#ee96e8',
        borderColor: '#ee96e8',
        data: []
      },
      'medium': {
        label: 'medium',
        backgroundColor: '#fd7c4d',
        borderColor: '#fd7c4d',
        data: []
      },
      'large': {
        label: 'large',
        backgroundColor: '#07b9f2',
        borderColor: '#07b9f2',
        data: []
      },
      'celltower': {
        label: 'cell tower',
        backgroundColor: '#666666',
        borderColor: '#666666',
        data: []
      },
      'other': {
        label: 'other',
        backgroundColor: '#999999',
        borderColor: '#999999',
        data: []
      }
    }
  }

  $onChanges (changesObj) {
    if (changesObj.hasOwnProperty('parentSelectedObjectId')) {
      if (this.isChartInit) this.showCoverageChart()
    }
    if (changesObj.hasOwnProperty('boundsInput')) {
      var newBoundsInput = changesObj.boundsInput.currentValue
      // this.feature = newBoundsInput.feature
      if (newBoundsInput.feature && newBoundsInput.feature.hasOwnProperty('objectId') && (newBoundsInput.forceUpdate || !this.boundaryCoverageById.hasOwnProperty(newBoundsInput.feature.objectId))) {
        this.digestBoundaryCoverage(newBoundsInput.feature.objectId, newBoundsInput.data)
      }
    }
  }

  makeCoverageLocationData () {
    return {
      locationType: '',
      totalCount: 0,
      barChartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  }

  digestBoundaryCoverage (objectId, boundaryData) {
    var boundsCoverage = {
      totalLocations: 0,
      tagCounts: {},
      locations: {}
    }

    var baseCBCount = {}
    for (const locationType in boundaryData.coverageInfo) {
      baseCBCount[locationType] = 0
    }

    for (const locationType in boundaryData.coverageInfo) {
      var locData = boundaryData.coverageInfo[locationType]
      var locCoverage = this.makeCoverageLocationData()
      locCoverage.locationType = locationType
      // locCoverage.totalCount = locData.length // entityCount
      locCoverage.totalCount = 0

      // boundsCoverage.totalLocations += locData.length

      for (var localI = 0; localI < locData.length; localI++) {
        var location = locData[localI]
        locCoverage.totalCount += location.entityCount
        boundsCoverage.totalLocations += location.entityCount
        // console.log( this.formatCensusBlockData( location.censusBlockTagInfo ) )
        var tags = this.formatCensusBlockData(location.censusBlockTagInfo)

        for (const catId in tags) {
          if (this.censusCategories.hasOwnProperty(catId)) {
            tags[catId].forEach((tagId) => {
              if (this.censusCategories[catId].tags.hasOwnProperty(tagId)) {
                if (!boundsCoverage.tagCounts.hasOwnProperty(catId)) {
                  boundsCoverage.tagCounts[catId] = {}
                  boundsCoverage.tagCounts[catId].description = this.censusCategories[catId].description
                  boundsCoverage.tagCounts[catId].tags = {}
                }

                if (!boundsCoverage.tagCounts[catId].tags.hasOwnProperty(tagId)) {
                  boundsCoverage.tagCounts[catId].tags[tagId] = {}
                  boundsCoverage.tagCounts[catId].tags[tagId].description = this.censusCategories[catId].tags[tagId].description
                  boundsCoverage.tagCounts[catId].tags[tagId].colourHash = this.censusCategories[catId].tags[tagId].colourHash
                  // clone baseCBCount
                  boundsCoverage.tagCounts[catId].tags[tagId].count = JSON.parse(JSON.stringify(baseCBCount))
                }
                // boundsCoverage.tagCounts[catId].tags[tagId].count[locationType]++
                boundsCoverage.tagCounts[catId].tags[tagId].count[locationType] += location.entityCount
              }// else report that we don't have data for that tag?
            })
          }// else report that we don't have data for that category?
        }

        if (typeof location.distance !== 'number') continue // skip these
        if (this.state.configuration.units.length_units == 'feet') location.distance *= 3.28084

        var dist = location.distance
        var barIndex = Math.floor(dist / 1000)
        if (barIndex >= locCoverage.barChartData.length || typeof locCoverage.barChartData[barIndex] === 'undefined') {
          locCoverage.barChartData[barIndex] = 0
        }
        // locCoverage.barChartData[barIndex]++
        locCoverage.barChartData[barIndex] += location.entityCount
      }

      boundsCoverage.locations[locationType] = locCoverage
    }

    this.boundaryCoverageById[objectId] = boundsCoverage
    // console.log(this.boundaryCoverageById)
    if (this.isChartInit) this.showCoverageChart()
  }

  // ToDo: very similar to the code in tile-data-service.js
  formatCensusBlockData (tagData) {
    var sepA = ';'
    var sepB = ':'
    var kvPairs = tagData.split(sepA)
    var tags = {}
    kvPairs.forEach((pair) => {
      var kv = pair.split(sepB)
      // incase there are extra ':'s in the value we join all but the first together
      if (kv[0] != '') tags[ '' + kv[0] ] = kv.slice(1)
    })
    return tags
  }

  showCoverageChart () {
    // ToDo: check for previous chart
    // var objectId = this.feature.objectId
    var objectId = this.parentSelectedObjectId

    if (!this.boundaryCoverageById.hasOwnProperty(this.parentSelectedObjectId)) return

    if (this.coverageChart) {
      this.coverageChart.destroy()
      this.coverageChart = null
    }

    var ele = this.$element.find('canvas.plan-editor-bounds-dist-chart')[0]
    if (typeof ele === 'undefined') return

    var ctx = ele.getContext('2d')

    // a dataset for each location type
    var datasets = []
    var colCount = 0
    for (const locationType in this.boundaryCoverageById[objectId].locations) {
      var locCoverage = this.boundaryCoverageById[objectId].locations[locationType]
      if (locCoverage.barChartData.length > colCount) colCount = locCoverage.barChartData.length

      var locDataset = {}

      if (locationType == 'other' || !this.chartSettings.hasOwnProperty(locationType)) {
        locDataset = JSON.parse(JSON.stringify(this.chartSettings['other']))
      } else {
        locDataset = JSON.parse(JSON.stringify(this.chartSettings[locationType]))
      }

      locDataset.data = locCoverage.barChartData
      datasets.push(locDataset)
    }

    var labels = []
    for (var i = 0; i < colCount; i++) {
      labels.push((i + 1) * 1000)
    }

    var settingsData = {
      labels: labels,
      datasets: datasets
    }

    var options = {
      title: {
        display: true,
        text: 'Locations by Distance'
      },
      legend: {
        display: true,
        position: 'bottom'
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'locations'
          },
          stacked: true
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'distance, ' + this.state.configuration.units.length_units,
            gridLines: {
              offsetGridLines: false
            }
          },
          stacked: true
        }]
      }
    }

    this.coverageChart = new Chart(ctx, {
      type: 'bar',
      data: settingsData,
      options: options
    })

    this.isChartInit = true
  }

  objKeys (obj) {
    if (typeof obj === 'undefined') obj = {}
    return Object.keys(obj)
  }
}

BoundaryCoverageController.$inject = ['$timeout', '$http', '$element', 'state', 'Utils']

let boundaryCoverage = {
  templateUrl: '/components/common/boundary-coverage.html',
  bindings: {
    boundsInput: '<',
    parentSelectedObjectId: '<',
    isWorkingOverride: '<'
  },
  controller: BoundaryCoverageController
}

export default boundaryCoverage
