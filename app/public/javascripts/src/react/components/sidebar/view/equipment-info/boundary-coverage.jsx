import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Bar } from 'react-chartjs-2'

const chartSettings = {
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

export const BoundaryCoverage = (props) => {

  const [state, setState] = useState({
    isWorking: false,
    isWorkingOverride: false,
    isChartInit: false,
    coverageChart:null,
    computedCoverage: {},
  })

  const { isWorking, isWorkingOverride, computedCoverage } = state

  const { selectedBoundaryCoverage, layerCategories, length_units } = props

  const makeCoverageLocationData = () => {
    return {
      locationType: '',
      totalCount: 0,
      barChartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  }

  const digestBoundaryCoverage = () => {
    var boundsCoverage = {
      totalLocations: 0,
      tagCounts: {},
      locations: {}
    }

    if (!selectedBoundaryCoverage) {
      return boundsCoverage
    }

    var baseCBCount = {}
    for (const locationType in selectedBoundaryCoverage.coverageInfo) {
      baseCBCount[locationType] = 0
    }

    for (const locationType in selectedBoundaryCoverage.coverageInfo) {
      var locData = selectedBoundaryCoverage.coverageInfo[locationType]
      var locCoverage = makeCoverageLocationData()
      locCoverage.locationType = locationType
      // locCoverage.totalCount = locData.length // entityCount
      locCoverage.totalCount = 0
      var infiniteDistCount = 0
      // boundsCoverage.totalLocations += locData.length

      for (var localI = 0; localI < locData.length; localI++) {
        var location = locData[localI]
        locCoverage.totalCount += location.entityCount
        boundsCoverage.totalLocations += location.entityCount
        var tags = formatCensusBlockData(location.censusBlockTagInfo)

        for (const catId in tags) {
          if (layerCategories.hasOwnProperty(catId)) {
            tags[catId].forEach((tagId) => {
              if (layerCategories[catId].tags.hasOwnProperty(tagId)) {
                if (!boundsCoverage.tagCounts.hasOwnProperty(catId)) {
                  boundsCoverage.tagCounts[catId] = {}
                  boundsCoverage.tagCounts[catId].description = layerCategories[catId].description
                  boundsCoverage.tagCounts[catId].tags = {}
                }

                if (!boundsCoverage.tagCounts[catId].tags.hasOwnProperty(tagId)) {
                  boundsCoverage.tagCounts[catId].tags[tagId] = {}
                  boundsCoverage.tagCounts[catId].tags[tagId].description = layerCategories[catId].tags[tagId].description
                  boundsCoverage.tagCounts[catId].tags[tagId].colourHash = layerCategories[catId].tags[tagId].colourHash
                  // clone baseCBCount
                  boundsCoverage.tagCounts[catId].tags[tagId].count = JSON.parse(JSON.stringify(baseCBCount))
                }
                // boundsCoverage.tagCounts[catId].tags[tagId].count[locationType]++
                boundsCoverage.tagCounts[catId].tags[tagId].count[locationType] += location.entityCount
              }// else report that we don't have data for that tag?
            })
          }// else report that we don't have data for that category?
        }
        
        if (typeof location.distance !== 'number'){
          infiniteDistCount++
          continue // skip these
        }
        if (length_units == 'feet') location.distance *= 3.28084

        var dist = location.distance
        var barIndex = Math.floor(dist / 1000)
        if (barIndex >= locCoverage.barChartData.length) {
          var prevLen = locCoverage.barChartData.length
          locCoverage.barChartData[barIndex] = 0
          locCoverage.barChartData.fill(0, prevLen, barIndex)
        }
        // locCoverage.barChartData[barIndex]++
        locCoverage.barChartData[barIndex] += location.entityCount
      }
      // put unreachable at beginning 
      locCoverage.barChartData.unshift(infiniteDistCount)
      
      boundsCoverage.locations[locationType] = locCoverage
    }

    return boundsCoverage
  }

    // ToDo: very similar to the code in tile-data-service.js
  const formatCensusBlockData = (tagData) => {
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

  const showCoverageChartData = () => {

    // a dataset for each location type
    const computedCoverageData = digestBoundaryCoverage()

    var datasets = []
    var colCount = 0
    for (const locationType in computedCoverageData.locations) {
      var locCoverage = computedCoverageData.locations[locationType]
      if (locCoverage.barChartData.length > colCount) colCount = locCoverage.barChartData.length

      var locDataset = {}

      if (locationType == 'other' || !chartSettings.hasOwnProperty(locationType)) {
        locDataset = JSON.parse(JSON.stringify(chartSettings['other']))
      } else {
        locDataset = JSON.parse(JSON.stringify(chartSettings[locationType]))
      }

      locDataset.data = locCoverage.barChartData
      datasets.push(locDataset)
    }
    
    var i = 0
    // move unreachable col to end
    for (i=0; i<datasets.length; i++) {
      var prevLen = datasets[i].data.length
      // prevLen should be <= colCount or something has gone wrong
      datasets[i].data[colCount] = datasets[i].data[0]
      datasets[i].data.fill(0, prevLen, colCount)
      datasets[i].data.shift()
    }
    
    var labels = []
    for (i = 0; i < colCount-1; i++) {
      labels.push((i+1) * 1000)
    }
    labels.push('N/A') // unreachable last col is infinite distance (may be count of 0)

    return {
      labels,
      datasets,
    }
  }

  const showCoverageChartOption = () => {
    return {
      title: {
        display: true,
        text: 'Locations by Road Distance'
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
            labelString: 'distance, ' + length_units,
            gridLines: {
              offsetGridLines: false
            }
          },
          stacked: true
        }]
      }
    }
  }

  const showCoverageChart = () => {
    setState((state) => ({ ...state, computedCoverage: digestBoundaryCoverage() }))
  }

  useEffect(() => {
    showCoverageChart()
  }, [selectedBoundaryCoverage])

  const objKeys = (obj) => {
    if (typeof obj === 'undefined') obj = {}
    return Object.keys(obj)
  }

  return (
    <>
      {
        isWorking || isWorkingOverride &&
        <>
          <p>Calculating coverage area...</p>
          <div className="spinner">
            <div className="rect1"></div>
            <div className="rect2"></div>
            <div className="rect3"></div>
            <div className="rect4"></div>
            <div className="rect5"></div>
          </div>
        </>
      }
  
      {
        selectedBoundaryCoverage &&
        <>
          <div className="ei-header bounds-coverage-header">
            Site boundary coverage: {computedCoverage.totalLocations}
            {
              Object.keys(computedCoverage).length &&
              Object.entries(computedCoverage.locations).map(([locationType, locationData], index) => (
                <div className="bounds-coverage-header-sub" key={index}>
                    {locationData.locationType}: {locationData.totalCount}
                </div>
              ))
            }
          </div>
          <Bar
            className="plan-editor-bounds-dist-chart"
            width={300}
            height={300}
            data={showCoverageChartData()}
            options={showCoverageChartOption()}
          />
          <div style={{marginBbottom: "20px"}}>
            <div className="ei-header bounds-coverage-header">
              Locations by Tag
            </div>
            {
              objKeys(computedCoverage.tagCounts).length < 1 &&
              <div className="bounds-coverage-layer-tag">none</div>
            }
            {
              Object.keys(computedCoverage).length && Object.entries(computedCoverage.tagCounts).map(([catkey, cat], index) => (
                <>
                <div className="ei-property-item bounds-coverage-layer-cat">
                  {cat.description}
                </div>
                {
                  cat.tags.map((tag) => (
                    <div className="bounds-coverage-layer-tag">
                       <div className="outlineLegendIcon" style={{borderColor: tag.colourHash, backgroundColor: tag.colourHash}}></div>
                       {tag.description}:
                       {
                        Object.entries(tag.count).map(([locationType, locationCount], index) => (
                          (
                            locationCount != 0 &&
                            <div className="bounds-coverage-layer-tag-count">
                              {locationType}: {locationCount}
                            </div>
                          )
                        ))
                       }
                    </div>
                  ))
                }
                </>
              ))
            }
          </div>
        </>
      }
    </>
  )
}

const mapStateToProps = (state) => ({
  layerCategories: state.stateViewMode.layerCategories,
  length_units: state.toolbar.appConfiguration.units.length_units
})

const mapDispatchToProps = (dispatch) => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(BoundaryCoverage)
