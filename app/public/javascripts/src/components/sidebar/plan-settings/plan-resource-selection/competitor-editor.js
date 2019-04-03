class CompetitorEditorController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
    this.competitorManagerConfiguration = []
    this.pristineCompetitorManagerConfiguration = {}
    
    this.carriersById = {}
    this.carriersByPct = []
    this.strengthsById = {}
    this.pristineStrengthsById = {}
    
    this.regionSelectEnabled = true
    this.selectedRegions = []
    
    this.regions = []
    
    this.openTab = 0
    this.prominenceThreshold = 2.0
    this.onInit()
  }
  
  //ToDo: loading indicators 
  
  onInit (){
    // ToDo: move this to state.js once we know the return won't change with plan selection 
    this.$http.get(`/service/odata/stateEntity?$select=name,stusps,gid,statefp&$orderby=name`)
    .then((result) => {
      //console.log(result.data)
      this.regions = result.data
    })
    .catch(err => console.error(err))
  }
  
  
  onSelectedRegionsChanged () {
    //console.log('on regions changed')
    //console.log(this.selectedRegions)
  }
  
  onRegionCommit () {
    //console.log('region commit')
    this.regionSelectEnabled = false
    this.loadCompManForStates()
  }
  
  reselectRegion () {
    if (this.regionSelectEnabled) return
    // discard warning 
    console.log("DISCARD CHANGES!")
    
    this.regionSelectEnabled = true
  }
  
  // --- //
  
  
  
  $onChanges (changesObj) {
    if (changesObj.competitorManagerId) {
      console.log('man id changed: '+this.competitorManagerId)
      this.loadCompManForStates()
    }
  }
  
  loadCompManForStates () {
    if ('undefined' == typeof this.competitorManagerId || this.selectedRegions.length < 1) return
    var regionsString = this.selectedRegions.map(ele => ele.stusps).join(",");
    
    this.$http.get(`/service/v1/competitor-profiles?states=${regionsString}`)
    .then((carrierResult) => {
      var newCarriersById = {}
      
      
      carrierResult.data.forEach(ele => {
        newCarriersById[ele.carrierId] = ele
      })
      this.carriersById = newCarriersById
      
      carrierResult.data.sort((a,b) => {return b.cbPercent - a.cbPercent})
      
      this.carriersByPct = carrierResult.data
      
      this.$http.get(`/service/v1/competitor-manager/${this.competitorManagerId}/strengths?states=${regionsString}&user_id=${this.state.loggedInUser.id}`)
      .then((strengthsResult) => {
        var newStrengthsById = {}
        
        strengthsResult.data.forEach(ele => {
          if (!newStrengthsById.hasOwnProperty(ele.carrierId)){
            newStrengthsById[ele.carrierId] = []
          }
          newStrengthsById[ele.carrierId].push(ele)
        })
        this.pristineStrengthsById = newStrengthsById
        this.strengthsById = JSON.parse(JSON.stringify(this.pristineStrengthsById))
      })
      
    })
    .catch(err => console.error(err))
        
    
  }
  
  
  saveConfigurationToServer () {
    // Only save those configurations that have changed
    var changedModels = []
    
    for (var carrierId in this.strengthsById){
      this.strengthsById[carrierId].forEach((strength, index) => {
        var strengthJSON = angular.toJson(strength)
        if (strengthJSON !== JSON.stringify(this.pristineStrengthsById[carrierId][index])) {
          changedModels.push(JSON.parse(strengthJSON))
        }
      })
    }
    
    //console.log(changedModels)
    
    if (changedModels.length > 0) {
      this.$http.put(`/service/v1/competitor-manager/${this.competitorManagerId}/strengths?user_id=${this.state.loggedInUser.id}`, changedModels)
        .then((result) => this.exitEditingMode())
        .catch((err) => console.error(err))
    } else {
      console.log('Competitor Editor: No models were changed. Nothing to save.')
    }
    
  }

  exitEditingMode () {
    this.setEditingMode({ mode: this.listMode })
  }
  
  // filters 
  
  greaterEqualTo (propName, val) {
    return function (item) {
      return item[propName] >= val
    }
  }
  
  lessThan (propName, val) {
    return function (item) {
      return item[propName] < val
    }
  }
  
  truncateNum (num, digits) {
    var scale = Math.pow(10, digits)
    return Math.round(num * scale) / scale
  }
  
}

CompetitorEditorController.$inject = ['$http', 'state']

let competitorEditor = {
  templateUrl: '/components/sidebar/plan-settings/plan-resource-selection/competitor-editor.html',
  bindings: {
    competitorManagerId: '<',
    listMode: '<',
    editMode: '<',
    setEditingMode: '&'
  },
  controller: CompetitorEditorController
}

export default competitorEditor
