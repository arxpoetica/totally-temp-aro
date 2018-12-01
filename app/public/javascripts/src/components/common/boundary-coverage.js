
class BoundaryCoverageController{

  constructor($timeout, $http, $element, state, Utils) {
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
      'household':{
        label: "residential",
        backgroundColor: '#76c793',
        borderColor: '#76c793',
        data: []
      }, 
      'small':{
        label: "small",
        backgroundColor: '#ee96e8',
        borderColor: '#ee96e8',
        data: []
      }, 
      'medium':{
        label: "medium",
        backgroundColor: '#fd7c4d',
        borderColor: '#fd7c4d',
        data: []
      }, 
      'large':{
        label: "large",
        backgroundColor: '#07b9f2',
        borderColor: '#07b9f2',
        data: []
      } 
    }
    
    
    
  }
  
  
  $onChanges(changesObj){
    if (changesObj.hasOwnProperty('parentSelectedObjectId')){
      if (this.isChartInit) this.showCoverageChart()
    }
    if (changesObj.hasOwnProperty('boundsInput')){
      var newBoundsInput = changesObj.boundsInput.currentValue
      //this.feature = newBoundsInput.feature
      if (newBoundsInput.feature && newBoundsInput.feature.hasOwnProperty('objectId') && (newBoundsInput.forceUpdate || !this.boundaryCoverageById.hasOwnProperty(newBoundsInput.feature.objectId) )){
        this.digestBoundaryCoverage(newBoundsInput.feature.objectId, newBoundsInput.data)
      }
    }
  }
  
  makeCoverageLocationData(){
    return {
      locationType: '',
      totalCount: 0, 
      barChartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  }
  
  digestBoundaryCoverage(objectId, boundaryData){
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
      locCoverage.totalCount = locData.length
      boundsCoverage.totalLocations += locData.length
      
      for (var localI=0; localI<locData.length; localI++){
        var location = locData[localI]
        
        //console.log( this.formatCensusBlockData( location.censusBlockTagInfo ) )
        var tags = this.formatCensusBlockData( location.censusBlockTagInfo )
        
        for (const catId in tags){
          if ( this.censusCategories.hasOwnProperty(catId) ){
            
            tags[catId].forEach((tagId) => {
              if( this.censusCategories[catId].tags.hasOwnProperty(tagId) ){
                
                if (!boundsCoverage.tagCounts.hasOwnProperty(catId)){
                  boundsCoverage.tagCounts[catId] = {}
                  boundsCoverage.tagCounts[catId].description = this.censusCategories[catId].description
                  boundsCoverage.tagCounts[catId].tags = {}
                }
                
                if (!boundsCoverage.tagCounts[catId].tags.hasOwnProperty(tagId)){
                  
                  boundsCoverage.tagCounts[catId].tags[tagId] = {}
                  boundsCoverage.tagCounts[catId].tags[tagId].description = this.censusCategories[catId].tags[tagId].description
                  boundsCoverage.tagCounts[catId].tags[tagId].colourHash = this.censusCategories[catId].tags[tagId].colourHash
                  // clone baseCBCount
                  boundsCoverage.tagCounts[catId].tags[tagId].count = JSON.parse(JSON.stringify( baseCBCount )) 
                }
                boundsCoverage.tagCounts[catId].tags[tagId].count[locationType]++
              }// else report that we don't have data for that tag? 
            })
          }// else report that we don't have data for that category? 
        }
        
        /*
        if (!boundsCoverage.censusBlockCountById.hasOwnProperty(location.censusBlockId)){
          //boundsCoverage.censusBlockCountById[location.censusBlockId] = 0
          // clone baseCBCount
          boundsCoverage.censusBlockCountById[location.censusBlockId] = JSON.parse(JSON.stringify( baseCBCount )) 
        }
        */
        //boundsCoverage.censusBlockCountById[location.censusBlockId][locationType]++
        
        if ("number" != typeof location.distance) continue // skip these 
        if ('feet' == this.state.configuration.units.length_units) location.distance *= 3.28084
        
        var dist = location.distance
        var barIndex = Math.floor(dist / 1000)
        if (barIndex >= locCoverage.barChartData.length || 'undefined' == typeof locCoverage.barChartData[barIndex]){
          locCoverage.barChartData[barIndex] = 0
        }
        locCoverage.barChartData[barIndex]++
      }
      
      boundsCoverage.locations[locationType] = locCoverage
    }
    
    
    
    
    
    this.boundaryCoverageById[objectId] = boundsCoverage
    console.log(this.boundaryCoverageById)
    if (this.isChartInit) this.showCoverageChart()
    
    /*
    var boundsCoverage = {}
    boundsCoverage.boundaryData = boundaryData
    var locations = []
    var censusBlockCountById = {}
    var barChartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    
    for (var localI=0; localI<boundaryData.coverageInfo.length; localI++){
      var location = boundaryData.coverageInfo[localI]
      if (!censusBlockCountById.hasOwnProperty(location.censusBlockId)){
        censusBlockCountById[location.censusBlockId] = 0
      }
      
      locations.push(location)
      censusBlockCountById[location.censusBlockId]++
      
      if ("number" != typeof location.distance) continue // skip these 
      if ('feet' == this.state.configuration.units.length_units) location.distance *= 3.28084
      
      var dist = location.distance
      var barIndex = Math.floor(dist / 1000)
      if (barIndex >= barChartData.length || 'undefined' == typeof barChartData[barIndex]){
        barChartData[barIndex] = 0
      }
      barChartData[barIndex]++
    }
    
    boundsCoverage.totalCount = boundaryData.coverageInfo.length
    boundsCoverage.boundaryData.coverageInfo = locations
    boundsCoverage.censusBlockCountById = censusBlockCountById
    boundsCoverage.barChartData = barChartData
    
    this.boundaryCoverageById[objectId] = boundsCoverage
    if (this.isChartInit) this.showCoverageChart()
    this.getCensusTagsForBoundaryCoverage(objectId)
    */
  }
  /*
  getCensusTagsForBoundaryCoverage(objectId){
    var censusBlockIds = Object.keys(this.boundaryCoverageById[objectId].censusBlockCountById)
    
    if (censusBlockIds.length > 0){
      //id eq 61920 or id eq 56829
      // we can't ask for more than about 100 at a time so we'll have to split up the batches 
      var filter = ''
      var filterSets = []
      for (var cbI=0; cbI<censusBlockIds.length; cbI++){
        var setIndex = Math.floor( cbI / 100)
        if ("string" != typeof filterSets[setIndex]){
          filterSets[setIndex] = ''
        }else{
          filterSets[setIndex] += ' or '
        }
        filterSets[setIndex] += 'id eq '+censusBlockIds[cbI]
      }
      
      var censusBlockPromises = []
      for (var promiseI=0; promiseI<filterSets.length; promiseI++){
        var entityListUrl = `/service/odata/censusBlocksEntity?$select=id,tagInfo&$filter=${filterSets[promiseI]}`
        censusBlockPromises.push(this.$http.get(entityListUrl))
      }
      
      this.isWorking = true
      
      Promise.all(censusBlockPromises).then((results) => {
        var rows = []
        for (var resultI=0; resultI<results.length; resultI++){
          rows = rows.concat(results[resultI].data)
        }
        var censusTagsByCat = {}
        // iterate through each censusblock
        for (var rowI=0; rowI<rows.length; rowI++){
          var row = rows[rowI]
          var tagInfo = this.formatCensusBlockData(row.tagInfo)
          
          // iterate through each category of the CB
          Object.keys(tagInfo).forEach((catId) => {
            var tagIds = tagInfo[catId]
            if (!censusTagsByCat.hasOwnProperty(catId)){
              censusTagsByCat[catId] = {}
              censusTagsByCat[catId].description = this.censusCategories[catId].description
              censusTagsByCat[catId].tags = {}
            }
            
            // iterate through each tag of the category 
            tagIds.forEach((tagId) => {
              if (!censusTagsByCat[catId].tags.hasOwnProperty(tagId)){
                // ToDo: check that this.censusCategories[catId].tags[tagId] exists! 
                var isError = false
                
                if ( !this.censusCategories.hasOwnProperty(catId) ){
                  isError = true
                  console.error(`Unrecognized census category Id: ${catId} on census block with Id: ${row.id}`)
                }else if( !this.censusCategories[catId].tags.hasOwnProperty(tagId) ){
                  isError = true
                  console.error(`Unrecognized census tag Id: ${tagId} on census block with Id: ${row.id}`)
                }else{
                  censusTagsByCat[catId].tags[tagId] = {}
                  censusTagsByCat[catId].tags[tagId].description = this.censusCategories[catId].tags[tagId].description
                  censusTagsByCat[catId].tags[tagId].colourHash = this.censusCategories[catId].tags[tagId].colourHash
                  censusTagsByCat[catId].tags[tagId].count = 0
                }
              }
              if (!isError) censusTagsByCat[catId].tags[tagId].count += this.boundaryCoverageById[objectId].censusBlockCountById[row.id]
            })
            
          })
        }
        this.boundaryCoverageById[objectId].censusTagsByCat = censusTagsByCat
        this.isWorking = false
        this.$timeout()
      })
      
    }else{
      this.boundaryCoverageById[objectId].censusTagsByCat = {}
    }
  }
  */
  // ToDo: very similar to the code in tile-data-service.js
  formatCensusBlockData(tagData){
    var sepA = ';'
    var sepB = ':'
    var kvPairs = tagData.split( sepA )
    var tags = {}
    kvPairs.forEach((pair) => {
      var kv = pair.split( sepB )
      // incase there are extra ':'s in the value we join all but the first together 
      if ("" != kv[0]) tags[ ""+kv[0] ] = kv.slice(1)
    }) 
    return tags 
  }
  
  showCoverageChart(){
    return
    //ToDo: check for previous chart
    //var objectId = this.feature.objectId
    var objectId = this.parentSelectedObjectId
    
    if (!this.boundaryCoverageById.hasOwnProperty(this.parentSelectedObjectId)) return
    
    if (!!this.coverageChart){
      this.coverageChart.destroy()
      this.coverageChart = null
    }
    
    var ele = this.$element.find('canvas.plan-editor-bounds-dist-chart')[0]
    if ('undefined' == typeof ele) return
    
    var ctx = ele.getContext('2d')
    
    // a dataset for each location type
    var datasets = []
    var colCount = 0
    for (const locationType in this.boundaryCoverageById[objectId].locations){
      var locCoverage = this.boundaryCoverageById[objectId].locations[locationType]
      if (locCoverage.barChartData.length > colCount) colCount = locCoverage.barChartData.length
      if (this.chartSettings.hasOwnProperty(locationType)){
        var locDataset = JSON.parse(JSON.stringify( this.chartSettings[locationType] ))
        locDataset.barChartData = locCoverage.barChartData
        datasets.push(locDataset)
      }
    }
    
    
    
    
    
    //var data = this.boundaryCoverageById[objectId].barChartData
    
    var labels = []
    for (var i=0; i<colCount; i++){
      labels.push((i+1)*1000)
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
          }
        }], 
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'distance, ' + this.state.configuration.units.length_units, 
            gridLines: {
              offsetGridLines: false
            }
          }
        }]
      }     
    }
    
    this.coverageChart = new Chart(ctx, {
      type: 'bar',
      data: settingsData,
      options: options
    });
    
    this.isChartInit = true
  }

  objKeys(obj){
    if ('undefined' == typeof obj) obj = {}
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