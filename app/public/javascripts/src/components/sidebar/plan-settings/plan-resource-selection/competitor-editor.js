class CompetitorEditorController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
    //this.competitorManagerConfiguration = []
    //this.pristineCompetitorManagerConfiguration = {}
    this.compManMeta = {}
    
    this.carriersById = {}
    this.carriersByPct = []
    this.strengthsById = {}
    this.pristineStrengthsById = {}
    this.strengthCols = []
    
    this.regionSelectEnabled = true
    this.selectedRegions = []
    
    this.regions = []
    
    this.openTab = 0
    this.hasChanged = false
    this.doRecalc = false
    this.prominenceThreshold = 2.0
    
    this.onInit()
  }
  
  //ToDo: loading indicators 
  
  onInit (){
    // ToDo: move this to state.js once we know the return won't change with plan selection 
    this.$http.get(`/service/odata/stateEntity?$select=name,stusps,gid,statefp&$orderby=name`)
    .then((result) => {
      this.regions = result.data
    })
    .catch(err => console.error(err))
    
    this.loadCompManMeta()
  }
  
  
  onSelectedRegionsChanged () {
    //console.log('on regions changed')
    //console.log(this.selectedRegions)
  }
  
  onRegionCommit () {
    this.regionSelectEnabled = false
    this.loadCompManForStates()
  }
  
  reselectRegion () {
    if (this.regionSelectEnabled) return
    // discard warning 
    
    if (this.hasChanged) {
      swal({
        title: 'Unsaved Changes',
        text: 'Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Save', // 'Yes',
        showCancelButton: true,
        cancelButtonText: 'Discard', // 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          this.saveConfigurationToServer()
        } else {
          // this.discardChanges()
        }
      })
    }
    
    this.regionSelectEnabled = true
  }
  
  onStrengthChange (param) {
    this.hasChanged = true
  }
  
  // --- //
  
  
  
  $onChanges (changesObj) {
    if (changesObj.competitorManagerId) {
      this.loadCompManMeta()
      this.loadCompManForStates()
    }
  }
  
  loadCompManMeta () {
    if (!this.competitorManagerId) return
    this.$http.get(`/service/v1/competitor-manager/${this.competitorManagerId}?user_id=${this.state.loggedInUser.id}`)
    .then((result) => {
      this.compManMeta = result.data
    })  
    .catch(err => console.error(err))
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
        var newStrengthColsDict = {}
        var newStrengthCols = []
        strengthsResult.data.forEach(ele => {
          
          if (!newStrengthColsDict.hasOwnProperty(ele.providerTypeId)){
            newStrengthColsDict[ele.providerTypeId] = ele.providerTypeId
            newStrengthCols.push(ele.providerTypeId)
          }
          if (!newStrengthsById.hasOwnProperty(ele.carrierId)){
            newStrengthsById[ele.carrierId] = {}
          }
          //newStrengthsById[ele.carrierId].push(ele)
          newStrengthsById[ele.carrierId][ele.providerTypeId] = ele
        })
        this.pristineStrengthsById = newStrengthsById
        this.strengthsById = JSON.parse(JSON.stringify(this.pristineStrengthsById))
        this.strengthCols = newStrengthCols
        this.hasChanged = false
      })
      
    })
    .catch(err => console.error(err))
    
  }
  
  
  saveConfigurationToServer (thenClose) {
    if ('undefined' == typeof thenClose) thenClose = false
    // Only save those configurations that have changed
    var changedModels = []
    
    for (var carrierId in this.strengthsById){
      //this.strengthsById[carrierId].forEach((strength, index) => {
      for (var providerTypeId in this.strengthsById[carrierId]){
        var strengthJSON = angular.toJson( this.strengthsById[carrierId][providerTypeId] )
        if (strengthJSON !== JSON.stringify(this.pristineStrengthsById[carrierId][providerTypeId])) {
          changedModels.push(JSON.parse(strengthJSON))
        }
      }
    }
    //console.log(changedModels)
    if (changedModels.length > 0) {
      this.$http.put(`/service/v1/competitor-manager/${this.competitorManagerId}/strengths?user_id=${this.state.loggedInUser.id}`, changedModels)
        .then((result) => {
          
          /* ToDo: this refresh business is currently called on destroy if anything was saved 
          this.$http.post(`/service/v1/competitor-manager/${this.competitorManagerId}/refresh`)
          .then((result) => {
            console.log(result)
            if (thenClose) this.exitEditingMode()
          })
          */
          this.doRecalc = true
          if (thenClose) this.exitEditingMode()
        })
        .catch((err) => console.error(err))
    } else {
      console.log('Competitor Editor: No models were changed. Nothing to save.')
    }
  }

  exitEditingMode () {
    this.setEditingMode({ mode: this.listMode })
  }
  
  $onDestroy () {
    //console.log("destroy")
    
    if (this.doRecalc) {
      this.$http.post(`/service/v1/competitor-manager/${this.competitorManagerId}/refresh`)
      .then((result) => {
        // ToDo: chat with Harry about this, 
        //       use lower left notification? 
        console.log('Competitor Manager Recalculated')
        console.log(result)
      })
      .catch((err) => console.error(err))
    }
    
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
