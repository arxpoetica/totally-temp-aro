/* globals */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

  function getResourceTypes () {
    return dispatch => {
      AroHttp.get('/service/odata/resourcetypeentity')
      .then(result => dispatch({
        type: Actions.RESOURCE_EDITOR_SET_RESOURCE_TYPES,
        payload: result.data
      }))
      .catch(err => console.error(err))
    }
  }

  function getResourceManagers (resourceType) {

    let resourceManagerURL = ''
    if(resourceType === 'all'){
      resourceManagerURL = '/service/v2/resource-manager'
    } else {
      resourceManagerURL = '/service/v2/resource-manager?resourceType='+resourceType
    }

    return dispatch => {
      AroHttp.get(resourceManagerURL)
      .then(result => dispatch({
        type: Actions.RESOURCE_EDITOR_SET_RESOURCE_MANAGERS,
        payload: result.data
      }))
      .catch(err => console.error(err))
    }
  }

  function nextOrPrevPageClick (selectedPage) {
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_HANDLE_PAGE_CLICK,
        payload: selectedPage
      })
    }
  }

  function searchManagers (searchText) {
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_SEARCH_MANAGERS,
        payload: searchText
      })
    }
  }

  function canMakeNewFilter (filterText) {
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_CAN_MAKE_NEW_FILTER,
        payload: filterText
      })
    }
  }

  function setIsResourceEditor (status){
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_IS_RESOURCE_EDITOR,
        payload: status
      })
    }
  }

  function deleteResourceManager (selectedManager, filterText) {
    return dispatch => {
      AroHttp.delete(`/service/v2/resource-manager/`+selectedManager.id)
      .then(result => dispatch(
        getResourceManagers(filterText)
      ))
      .catch((err) => console.error(err))
    }
  }

  function resourceKeyToEndpointId(){
    return {
      price_book: 'pricebook',
      roic_manager: 'roic-manager',
      arpu_manager: 'arpu-manager',
      impedance_mapping_manager: 'impedance-manager',
      tsm_manager: 'tsm-manager',
      competition_manager: 'competitor-manager',
      rate_reach_manager: 'rate-reach-matrix'
    }
  }
  
  function newManager (resourceType, resourceName, loggedInUser, sourceId) {
      return dispatch => {
        if ('undefined' === typeof sourceId) sourceId = null // new one
    
        // TODO: once endpoint is ready use v2/resource-manager for pricebook and rate-reach-matrix as well
        var managerId = resourceKeyToEndpointId[resourceType]
        if (managerId === 'pricebook') {
          // Have to put this switch in here because the API for pricebook cloning is different. Can remove once API is unified.
          createByEditMode(createPriceBookMode, sourceId)
        } else if (managerId === 'rate-reach-matrix') {
          createByEditMode(createRateReachManagerMode, sourceId)
        } else {
          // Create a resource manager
          var idParam = ''
          if (null != sourceId) idParam = `resourceManagerId=${sourceId}&`
          AroHttp.post(`/service/v2/resource-manager?${idParam}user_id=${loggedInUser.id}`,{
            resourceType: resourceType,
            name: resourceName,
            description: resourceName
          })
        .then(result => {
          dispatch(getResourceManagers(resourceType))
          if (result.data && result.data.resourceType === null) result.data.resourceType = resourceType
          dispatch(editSelectedManager(result.data))
        })
        .catch((err) => console.error(err))
      }
    }
  }

  function editSelectedManager(selectedManager){
    return dispatch => {
      dispatch(startEditingResourceManager(selectedManager.id, selectedManager.resourceType, selectedManager.name, 'EDIT_RESOURCE_MANAGER'))
    }
  }

  function startEditingResourceManager (resourceManagerId, managerType, resourceManagerName, editingMode) {
    return dispatch => {
      AroHttp.get(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`)
        .then(result => {
          // ToDo: use batch here (once merged with refactor branch)
          dispatch({
            type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
            payload: {
              resourceManagerId: resourceManagerId,
              resourceManagerName: resourceManagerName,
              definition: result.data
            }
          })
          dispatch({
            type: Actions.RESOURCE_MANAGER_SET_EDITING_MANAGER,
            payload: {
              id: resourceManagerId,
              type: managerType
            }
          })
          dispatch({
            type: Actions.RESOURCE_MANAGER_SET_EDITING_MODE,
            payload: {
              editingMode: editingMode
            }
          })
        })
        .catch(err => {
          console.error(err)
          swal({
            title: 'Failed to load resource manager',
            text: `ARO-Service returned status code ${err.status}`,
            type: 'error'
          })
        })
    }
  }

  // Price-Book Creator

  function getPriceBookStrategy () {
    return dispatch => {
      AroHttp.get('/service/v1/pricebook-strategies')
      .then(result => dispatch({
        type: Actions.RESOURCE_EDITOR_GET_PRICEBOOK_STRATEGY,
        payload: result.data
      }))
      .catch(err => console.error(err))
    }
  }
  

  function createPriceBook (priceBook, selectedResourceForClone) {
    // Create a new pricebook with the specified name and description
    var createdManagerId = null
    var sourcePriceBookId = null
    return dispatch => {
      AroHttp.post(`/service/v1/pricebook`,{
        priceStrategy: priceBook.strategy,
        name: priceBook.name,
        description: priceBook.description
      })
      .then((result) => {
        createdManagerId = result.data.id
        sourcePriceBookId = selectedResourceForClone.id
        // Return the assignments of either the 0th pricebook (if creating a new one) or the source pricebook (if cloning)
        if (sourcePriceBookId) {
          return AroHttp.get(`/service/v1/pricebook/${sourcePriceBookId}/assignment`)
        } else {
          return AroHttp.get('/service/v1/pricebook')
            .then((result) => AroHttp.get(`/service/v1/pricebook/${result.data[0].id}/assignment`))
        }
      })
      .then((result) => {
        var newManagerAssignments = result.data
        // IF we are creating a blank pricebook, take the assignments of the default manager,
        // set all values to 0 and then assign that to the newly created manager
        if (!sourcePriceBookId) {
          newManagerAssignments.costAssignments.forEach((costAssignment) => {
            costAssignment.state = '*'
            costAssignment.cost = 0
          })
          newManagerAssignments.detailAssignments.forEach((detailAssignment) => {
            detailAssignment.quantity = 0
            detailAssignment.ratioFixed = 1
          })
        }
        return AroHttp.put(`/service/v1/pricebook/${createdManagerId}/assignment`, newManagerAssignments)
      })
      .then(result => {
        dispatch(setIsResourceEditor(true))
        dispatch(getResourceManagers('price_book'))
      })
      .catch((err) => console.error(err))
    }
  }

  // Pricebook editor

  function rebuildPricebookDefinitions (priceBookId) {

    let DEFAULT_STATE_CODE = '*'
    let statesForStrategy = [DEFAULT_STATE_CODE]

    return dispatch => {

      if (!priceBookId) {
        return
      }
      AroHttp.get(`/service/v1/pricebook/${priceBookId}`)
        .then((result) => {

          dispatch({
            type: Actions.RESOURCE_EDITOR_CURRENT_PRICEBOOK,
            payload: result.data
          })

          return Promise.all([
            AroHttp.get(`/service/v1/pricebook-strategies/${result.data.priceStrategy}`),
            AroHttp.get(`/service/v1/pricebook/${priceBookId}/definition`),
            AroHttp.get(`/service/v1/pricebook/${priceBookId}/assignment`)
          ])
        })
        .then((results) => {
          statesForStrategy = [DEFAULT_STATE_CODE].concat(results[0].data)
          // We want unique values in this.statesForStrategy (morphology returns '*' from the server)
          statesForStrategy = [...new Set(statesForStrategy)].sort() // array --> set --> back to array
          let selectedStateForStrategy = statesForStrategy[0]

          dispatch({
            type: Actions.RESOURCE_EDITOR_STATES_STRATEGY,
            payload: {
              statesForStrategy: statesForStrategy,
              selectedStateForStrategy: selectedStateForStrategy
            }
          })

          let priceBookDefinitions = results[1].data
          // Save a deep copy of the result, we can use this later if we save modifications to the server
          let pristineAssignments = angular.copy(results[2].data)

          dispatch(definePriceBookForSelectedState(selectedStateForStrategy, priceBookDefinitions, pristineAssignments))

        })
        .catch((err) => console.log(err))
    }
  }

  function definePriceBookForSelectedState (selectedStateForStrategy, priceBookDefinitions, pristineAssignments) {

    return dispatch => {
      // First ensure that we have pristine assignments for the given state code
      //this.ensurePristineCostAssignmentsForState(selectedStateForStrategy)

      // Build a map of cost assignment ids to objects
      var itemIdToCostAssignment = {}
      var itemDetailIdToDetailAssignment = {}
      const costAssignmentsForState = pristineAssignments.costAssignments.filter((item) => item.state === selectedStateForStrategy)
      costAssignmentsForState.forEach((costAssignment) => {
        itemIdToCostAssignment[costAssignment.itemId] = costAssignment
      })

      // Build a map of detail assignment ids to objects
      pristineAssignments.detailAssignments.forEach((detailAssignment) => {
        itemDetailIdToDetailAssignment[detailAssignment.itemDetailId] = detailAssignment
      })

      // Build the pricebookdefinitions
      var structuredPriceBookDefinitions = []
      var selectedEquipmentTags = {}
      Object.keys(priceBookDefinitions).forEach((definitionKey) => {
        var definitionItems = priceBookDefinitions[definitionKey]
        var definition = {
          id: definitionKey,
          description: definitionKey,
          items: []
        }
        definitionItems.forEach((definitionItem) => {
          // If this item id is in cost assignments, add it
          var item = {
            id: definitionItem.id,
            name: definitionItem.name,
            description: definitionItem.description,
            unitOfMeasure: definitionItem.unitOfMeasure,
            costAssignment: itemIdToCostAssignment[definitionItem.id],
            cableConstructionType: definitionItem.cableConstructionType,
            subItems: [],
            tagMapping: definitionItem.tagMapping
          }
          definitionItem.subItems.forEach((subItem) => {
            var subItemToPush = {
              id: subItem.id,
              item: subItem.item,
              detailType: subItem.detailType
            }
            if (subItem.detailType === 'reference') {
              subItemToPush.detailAssignment = itemDetailIdToDetailAssignment[subItem.id]
            } else if (subItem.detailType === 'value') {
              subItemToPush.costAssignment = itemIdToCostAssignment[subItem.item.id]
            }
            item.subItems.push(subItemToPush)
          })
          definition.items.push(item)
        })
        structuredPriceBookDefinitions.push(definition)
        selectedEquipmentTags[definition.id] = []
        var setOfSelectedEquipmentTags = {}
        setOfSelectedEquipmentTags[definition.id] = new Set()
      })
      let selectedDefinitionId = structuredPriceBookDefinitions[0].id
      dispatch({
        type: Actions.RESOURCE_EDITOR_PRICEBOOK_DEFINITION,
        payload: {
          selectedDefinitionId: selectedDefinitionId,
          structuredPriceBookDefinitions: structuredPriceBookDefinitions
        }
      })
      // Save construction ratios keyed by state
      //this.defineConstructionRatiosForSelectedState()
    }
  }

  //Rate-Reach_Manager

  function createRateReachManager (rateReachManager, selectedResourceForClone, loggedInUser) {
    // Create a new rate reach manager with the specified name and description
    let sourceRateReachManagerId = selectedResourceForClone.id
    var createUrl = `/service/rate-reach-matrix/resource`
    if (sourceRateReachManagerId) {
      createUrl += `?source_resource_manager=${sourceRateReachManagerId}`
    }
    var createdRateReachManager = null
    return dispatch => {
      AroHttp.post(createUrl,{
        name: rateReachManager.name,
        description: rateReachManager.description
      })
      .then(result => {
        createdRateReachManager = result.data
        return getDefaultConfiguration(loggedInUser)
      })
      .then((defaultConfiguration) => AroHttp.put(`/service/rate-reach-matrix/resource/${createdRateReachManager.id}/config`, defaultConfiguration))
      .then(result => {
        dispatch(setIsResourceEditor(true))
        dispatch(getResourceManagers('rate_reach_manager'))
      })
      .catch((err) => console.error(err))
    }
  }

  function getDefaultConfiguration (loggedInUser) {
    const technologyTypes = ['Fiber', 'FiberProximity', 'Copper', 'CellTower']
    const configuration = {
      managerType: 'rate_reach_manager',
      categoryType: 'SPEED',
      categories: [],
      rateReachGroupMap: {},
      marketAdjustmentFactorMap: {
        RETAIL: 1,
        WHOLESALE: 1,
        TOWER: 1
      }
    }

    var configPromises = []
    technologyTypes.forEach(technologyType => {
      configuration.rateReachGroupMap[technologyType] = {
        technologyType: technologyType
    }

    const configPromise = Promise.all([
      AroHttp.get(`/service/rate-reach-matrix/network-structures?technology_type=${technologyType}&user_id=${loggedInUser.id}`),
      AroHttp.get(`/service/rate-reach-matrix/technologies?technology_type=${technologyType}&user_id=${loggedInUser.id}`)
    ])
      .then(results => {
        configuration.rateReachGroupMap[technologyType].active = false
        configuration.rateReachGroupMap[technologyType].networkStructure = results[0].data[0]
        configuration.rateReachGroupMap[technologyType].matrixMap = {}
        results[1].data.forEach(technology => {
          configuration.rateReachGroupMap[technologyType].matrixMap[technology.id] = []
        })
      })
      .catch(err => console.error(err))

      configPromises.push(configPromise)
    })

    return Promise.all(configPromises)
      .then(() => Promise.resolve(configuration))
      .catch(err => console.error(err))
  }

  // ARPU-Manager

  function loadArpuManagerConfiguration (selectedResourceForEdit) {
    return dispatch => {
      AroHttp.get(`/service/v1/arpu-manager/${selectedResourceForEdit.id}/configuration`)
        .then((result) => {
          var arpuModels = []
          // Sort the arpu models based on the locationTypeEntity
          const locationEntityOrder = ['household', 'small', 'medium', 'large', 'celltower']
          locationEntityOrder.forEach(locationEntity => {
            const filteredModels = result.data.arpuModels
              .filter(item => item.id.locationEntityType === locationEntity)
              .sort((a, b) => (a.id.speedCategory < b.id.speedCategory) ? -1 : 1)
            arpuModels = arpuModels.concat(filteredModels)
          })
          dispatch({
            type: Actions.RESOURCE_EDITOR_SET_ARPU_MANAGER_CONFIGURATION,
            payload:  { arpuModels: arpuModels }
          })
          let arpuManagerConfiguration = { arpuModels: arpuModels }
          let pristineArpuManagerConfiguration = {}
          let copyOfModels = JSON.parse(JSON.stringify(arpuManagerConfiguration.arpuModels))
          copyOfModels.forEach((arpuModel) => {
          // Create a key from the "id" object
            var arpuKey = JSON.stringify(arpuModel.id)
            pristineArpuManagerConfiguration[arpuKey] = arpuModel
          })
          dispatch({
            type: Actions.RESOURCE_EDITOR_SET_PRISTINE_ARPU_MANAGER_CONFIGURATION,
            payload:  pristineArpuManagerConfiguration
          })
        })
        .catch((err) => console.error(err))
      }
    }

  function saveConfigurationToServer (arpuManagerId, changedModels) {
    return dispatch => {
      AroHttp.put(`/service/v1/arpu-manager/${arpuManagerId}/configuration`, changedModels)
      .then((result) => {})
      .catch((err) => console.error(err))
    }
  }

  function setArpuStrategy (ArpuStrategy) {
    return {
      type: Actions.RESOURCE_EDITOR_SET_ARPU_STRATEGY,
      payload: ArpuStrategy
    }
  }

  function setArpuRevenue (ArpuRevenue) {
    return {
      type: Actions.RESOURCE_EDITOR_SET_ARPU_REVENUE,
      payload: ArpuRevenue
    }
  }

  // Competition System

  function getRegions () {
    // ToDo: move this to state.js once we know the return won't change with plan selection 
    return dispatch => {
      AroHttp.get('/service/odata/stateEntity?$select=name,stusps,gid,statefp&$orderby=name')
      .then(result => dispatch({
        type: Actions.RESOURCE_EDITOR_GET_REGIONS,
        payload: result.data
      }))
      .catch(err => console.error(err))
    }
  }

  function loadCompManMeta (competitorManagerId) {
    return dispatch => {
      if (!competitorManagerId) return
      AroHttp.get(`/service/v1/competitor-manager/${competitorManagerId}`)
      .then(result => dispatch({
        type: Actions.RESOURCE_EDITOR_COMP_MAN_META,
        payload: result.data
      }))
      .catch(err => console.error(err))
    }
  }

  function loadCompManForStates (competitorManagerId, selectedRegions, loggedInUser) {

    return dispatch => {

      if ('undefined' == typeof competitorManagerId || selectedRegions.length < 1) return
      var regionsString = selectedRegions.map(ele => ele.value).join(",");
      
      AroHttp.get(`/service/v1/competitor-profiles?states=${regionsString}`)
      .then((carrierResult) => {
        var newCarriersById = {}
        var newStrengthsById = {}

        let carrierResultDataArray = [{"carrierId":26,"alias":"NOEL COMMUNICATIONS","cbCount":195574.0,"coveredCbCount":58594.0,"fiberCoveredCbCount":52786.0,"fiberNetworkMiles":7091.0,"cbPercent":29.960015134936135},{"carrierId":21,"alias":"ZAYO","cbCount":195574.0,"coveredCbCount":45551.0,"fiberCoveredCbCount":92108.0,"fiberNetworkMiles":5913.0,"cbPercent":23.290928241995356},{"carrierId":37,"alias":"CENTURYLINK","cbCount":195574.0,"coveredCbCount":28365.0,"fiberCoveredCbCount":35479.0,"fiberNetworkMiles":4056.0,"cbPercent":14.503461605325862},{"carrierId":16,"alias":"NOANET","cbCount":195574.0,"coveredCbCount":21927.0,"fiberCoveredCbCount":12697.0,"fiberNetworkMiles":8709.0,"cbPercent":11.21161299559246},{"carrierId":15,"alias":"INTEGRA TELECOM","cbCount":195574.0,"coveredCbCount":20047.0,"fiberCoveredCbCount":14399.0,"fiberNetworkMiles":1963.0,"cbPercent":10.250340024747667},{"carrierId":13,"alias":"AT&T","cbCount":195574.0,"coveredCbCount":14483.0,"fiberCoveredCbCount":10757.0,"fiberNetworkMiles":805.0,"cbPercent":7.405381083375091},{"carrierId":48,"alias":"COMCAST","cbCount":195574.0,"coveredCbCount":14177.0,"fiberCoveredCbCount":11474.0,"fiberNetworkMiles":838.0,"cbPercent":7.2489185679078},{"carrierId":25,"alias":"SPECTRUM","cbCount":195574.0,"coveredCbCount":9799.0,"fiberCoveredCbCount":3238.0,"fiberNetworkMiles":848.0,"cbPercent":5.010379702823483},{"carrierId":17,"alias":"XO COMMUNICATIONS","cbCount":195574.0,"coveredCbCount":8911.0,"fiberCoveredCbCount":7568.0,"fiberNetworkMiles":1199.0,"cbPercent":4.556331618722325},{"carrierId":8,"alias":"SYRINGA NETWORKS","cbCount":195574.0,"coveredCbCount":7921.0,"fiberCoveredCbCount":3503.0,"fiberNetworkMiles":991.0,"cbPercent":4.050129362798736},{"carrierId":31,"alias":"BLACK ROCK CABLE","cbCount":195574.0,"coveredCbCount":7438.0,"fiberCoveredCbCount":16072.0,"fiberNetworkMiles":1237.0,"cbPercent":3.8031640197572276},{"carrierId":14,"alias":"COGENT COMMUNICATIONS","cbCount":195574.0,"coveredCbCount":6913.0,"fiberCoveredCbCount":3070.0,"fiberNetworkMiles":512.0,"cbPercent":3.5347234294947185},{"carrierId":46,"alias":"VERIZON","cbCount":195574.0,"coveredCbCount":5550.0,"fiberCoveredCbCount":8196.0,"fiberNetworkMiles":517.0,"cbPercent":2.8378005256322414},{"carrierId":28,"alias":"ORBITCOM","cbCount":195574.0,"coveredCbCount":4644.0,"fiberCoveredCbCount":4320.0,"fiberNetworkMiles":320.0,"cbPercent":2.3745487641506537},{"carrierId":30,"alias":"GRANT PUD","cbCount":195574.0,"coveredCbCount":3665.0,"fiberCoveredCbCount":8780.0,"fiberNetworkMiles":3182.0,"cbPercent":1.873970977737327},{"carrierId":3,"alias":"FATBEAM","cbCount":195574.0,"coveredCbCount":3131.0,"fiberCoveredCbCount":4506.0,"fiberNetworkMiles":351.0,"cbPercent":1.6009285487846032},{"carrierId":18,"alias":"STARTOUCH","cbCount":195574.0,"coveredCbCount":2644.0,"fiberCoveredCbCount":2372.0,"fiberNetworkMiles":372.0,"cbPercent":1.3519179441029994},{"carrierId":24,"alias":"RAIL AMERICA ROW","cbCount":195574.0,"coveredCbCount":2417.0,"fiberCoveredCbCount":1274.0,"fiberNetworkMiles":586.0,"cbPercent":1.2358493460275906},{"carrierId":41,"alias":"WINDSTREAM","cbCount":195574.0,"coveredCbCount":2112.0,"fiberCoveredCbCount":1340.0,"fiberNetworkMiles":85.0,"cbPercent":1.0798981459703234},{"carrierId":27,"alias":"CROWN CASTLE","cbCount":195574.0,"coveredCbCount":1724.0,"fiberCoveredCbCount":1946.0,"fiberNetworkMiles":94.0,"cbPercent":0.8815077668810782},{"carrierId":11,"alias":"BENTON PUD","cbCount":195574.0,"coveredCbCount":1585.0,"fiberCoveredCbCount":1330.0,"fiberNetworkMiles":220.0,"cbPercent":0.8104349248877661},{"carrierId":38,"alias":"CITY OF FRANKLIN PUD","cbCount":195574.0,"coveredCbCount":1333.0,"fiberCoveredCbCount":2380.0,"fiberNetworkMiles":222.0,"cbPercent":0.6815834415617619},{"carrierId":43,"alias":"PORT OF WHITMAN","cbCount":195574.0,"coveredCbCount":1245.0,"fiberCoveredCbCount":2032.0,"fiberNetworkMiles":357.0,"cbPercent":0.6365876854796649},{"carrierId":39,"alias":"BONNEVILLE POWER","cbCount":195574.0,"coveredCbCount":1236.0,"fiberCoveredCbCount":298.0,"fiberNetworkMiles":343.0,"cbPercent":0.6319858467894506},{"carrierId":4,"alias":"CITY OF BELLEVUE","cbCount":195574.0,"coveredCbCount":1068.0,"fiberCoveredCbCount":2628.0,"fiberNetworkMiles":143.0,"cbPercent":0.5460848579054476},{"carrierId":52,"alias":"CLICK! NETWORK","cbCount":195574.0,"coveredCbCount":867.0,"fiberCoveredCbCount":1280.0,"fiberNetworkMiles":98.0,"cbPercent":0.44331046049065825},{"carrierId":12,"alias":"STARCOM","cbCount":195574.0,"coveredCbCount":809.0,"fiberCoveredCbCount":610.0,"fiberNetworkMiles":72.0,"cbPercent":0.41365416670927624},{"carrierId":29,"alias":"UPN","cbCount":195574.0,"coveredCbCount":805.0,"fiberCoveredCbCount":827.0,"fiberNetworkMiles":76.0,"cbPercent":0.411608905069181},{"carrierId":34,"alias":"PACIFIC COUNTY PUD","cbCount":195574.0,"coveredCbCount":783.0,"fiberCoveredCbCount":734.0,"fiberNetworkMiles":114.0,"cbPercent":0.40035996604865676},{"carrierId":19,"alias":"TDS TELECOM","cbCount":195574.0,"coveredCbCount":627.0,"fiberCoveredCbCount":458.0,"fiberNetworkMiles":263.0,"cbPercent":0.32059476208493976},{"carrierId":33,"alias":"CITY OF REDMOND","cbCount":195574.0,"coveredCbCount":584.0,"fiberCoveredCbCount":1124.0,"fiberNetworkMiles":64.0,"cbPercent":0.29860819945391515},{"carrierId":35,"alias":"SKAGIT COUNTY","cbCount":195574.0,"coveredCbCount":581.0,"fiberCoveredCbCount":689.0,"fiberNetworkMiles":49.0,"cbPercent":0.2970742532238437},{"carrierId":6,"alias":"US CROSSINGS","cbCount":195574.0,"coveredCbCount":508.0,"fiberCoveredCbCount":550.0,"fiberNetworkMiles":26.0,"cbPercent":0.2597482282921043},{"carrierId":51,"alias":"OPALCO FIBER","cbCount":195574.0,"coveredCbCount":503.0,"fiberCoveredCbCount":848.0,"fiberNetworkMiles":161.0,"cbPercent":0.2571916512419851},{"carrierId":40,"alias":"COLUMBUS FIBERNET","cbCount":195574.0,"coveredCbCount":475.0,"fiberCoveredCbCount":670.0,"fiberNetworkMiles":31.0,"cbPercent":0.24287481976131797},{"carrierId":1,"alias":"GRAYS HARBOR PUD","cbCount":195574.0,"coveredCbCount":440.0,"fiberCoveredCbCount":209.0,"fiberNetworkMiles":19.0,"cbPercent":0.224978780410484},{"carrierId":36,"alias":"CITY OF KIRKLAND","cbCount":195574.0,"coveredCbCount":436.0,"fiberCoveredCbCount":570.0,"fiberNetworkMiles":30.0,"cbPercent":0.2229335187703887},{"carrierId":49,"alias":"VIACOM","cbCount":195574.0,"coveredCbCount":380.0,"fiberCoveredCbCount":652.0,"fiberNetworkMiles":33.0,"cbPercent":0.19429985580905437},{"carrierId":5,"alias":"CITY OF BELLINGHAM","cbCount":195574.0,"coveredCbCount":327.0,"fiberCoveredCbCount":180.0,"fiberNetworkMiles":16.0,"cbPercent":0.16720013907779152},{"carrierId":20,"alias":"CITY OF OLYMPIA","cbCount":195574.0,"coveredCbCount":306.0,"fiberCoveredCbCount":370.0,"fiberNetworkMiles":18.0,"cbPercent":0.15646251546729115},{"carrierId":23,"alias":"COAST COMMUNICATIONS","cbCount":195574.0,"coveredCbCount":257.0,"fiberCoveredCbCount":82.0,"fiberNetworkMiles":13.0,"cbPercent":0.13140806037612363},{"carrierId":50,"alias":"BROADSTRIPE","cbCount":195574.0,"coveredCbCount":160.0,"fiberCoveredCbCount":172.0,"fiberNetworkMiles":11.0,"cbPercent":0.08181046560381237},{"carrierId":7,"alias":"BELLEVUE SCHOOL DISTRICT","cbCount":195574.0,"coveredCbCount":121.0,"fiberCoveredCbCount":220.0,"fiberNetworkMiles":11.0,"cbPercent":0.061869164612883096},{"carrierId":44,"alias":"NETVERSANT","cbCount":195574.0,"coveredCbCount":94.0,"fiberCoveredCbCount":118.0,"fiberNetworkMiles":6.0,"cbPercent":0.04806364854223977},{"carrierId":47,"alias":"VIALITE","cbCount":195574.0,"coveredCbCount":67.0,"fiberCoveredCbCount":74.0,"fiberNetworkMiles":10.0,"cbPercent":0.03425813247159643},{"carrierId":2,"alias":"SAWNET","cbCount":195574.0,"coveredCbCount":53.0,"fiberCoveredCbCount":38.0,"fiberNetworkMiles":2.0,"cbPercent":0.02709971673126285},{"carrierId":53,"alias":"CITY OF ABERDEEN","cbCount":195574.0,"coveredCbCount":53.0,"fiberCoveredCbCount":8.0,"fiberNetworkMiles":2.0,"cbPercent":0.02709971673126285},{"carrierId":42,"alias":"RTI","cbCount":195574.0,"coveredCbCount":39.0,"fiberCoveredCbCount":86.0,"fiberNetworkMiles":22.0,"cbPercent":0.019941300990929264},{"carrierId":22,"alias":"BCE NEXXIA","cbCount":195574.0,"coveredCbCount":26.0,"fiberCoveredCbCount":9.0,"fiberNetworkMiles":0.0,"cbPercent":0.01329420066061951},{"carrierId":32,"alias":"PUGET SOUND ENERGY","cbCount":195574.0,"coveredCbCount":18.0,"fiberCoveredCbCount":16.0,"fiberNetworkMiles":1.0,"cbPercent":0.009203677380428892},{"carrierId":45,"alias":"FIRST STEP INTERNET","cbCount":195574.0,"coveredCbCount":9.0,"fiberCoveredCbCount":6.0,"fiberNetworkMiles":1.0,"cbPercent":0.004601838690214446},{"carrierId":9,"alias":"CITY OF LEWISTON","cbCount":195574.0,"coveredCbCount":4.0,"fiberCoveredCbCount":2.0,"fiberNetworkMiles":1.0,"cbPercent":0.0020452616400953093},{"carrierId":10,"alias":"BOEING","cbCount":195574.0,"coveredCbCount":1.0,"fiberCoveredCbCount":2.0,"fiberNetworkMiles":0.0,"cbPercent":5.113154100238273E-4},{"carrierId":0,"alias":null,"cbCount":77189.0,"coveredCbCount":0.0,"fiberCoveredCbCount":0.0,"fiberNetworkMiles":0.0,"cbPercent":0.0}]
        
        carrierResultDataArray.forEach(ele => {
          newCarriersById[ele.carrierId] = ele
          newStrengthsById[ele.carrierId] = getDefaultStrength(ele.carrierId)
        })
        
        this.carriersById = newCarriersById
        
        carrierResult.data.sort((a,b) => {return b.cbPercent - a.cbPercent})

        dispatch({
          type: Actions.RESOURCE_EDITOR_CARRIERS_BY_PCT,
          payload: carrierResultDataArray
        })

        AroHttp.get(`/service/v1/competitor-manager/${competitorManagerId}/strengths?states=${regionsString}&user_id=${loggedInUser.id}`)
        .then((strengthsResult) => {

          var strengthsResultArr = [{"providerTypeId":"retail","carrierId":26,"strength":1.0},{"providerTypeId":"wholesale","carrierId":26,"strength":1.0},{"providerTypeId":"tower","carrierId":26,"strength":1.0},{"providerTypeId":"wholesale","carrierId":21,"strength":1.0},{"providerTypeId":"tower","carrierId":21,"strength":1.0},{"providerTypeId":"retail","carrierId":21,"strength":1.0}]
          
          // ToDo: strength types should be dynamic, either get this list from the server OR have the server initilize strengths 
          var newStrengthColsDict = {wholesale: "wholesale", tower: "tower", retail: "retail"}
          
          var newStrengthCols = ["wholesale", "tower", "retail"]
          
          strengthsResultArr.forEach(ele => {
            
            if (!newStrengthColsDict.hasOwnProperty(ele.providerTypeId)){
              newStrengthColsDict[ele.providerTypeId] = ele.providerTypeId
              newStrengthCols.push(ele.providerTypeId)
            }
            if (!newStrengthsById.hasOwnProperty(ele.carrierId)){
              newStrengthsById[ele.carrierId] = {}
            }
            newStrengthsById[ele.carrierId][ele.providerTypeId] = ele
          })
          let pristineStrengthsById = newStrengthsById
          let strengthsById = JSON.parse(JSON.stringify(pristineStrengthsById))

          dispatch({
            type: Actions.RESOURCE_EDITOR_STRENGTH_COLS,
            payload: {
              pristineStrengthsById: pristineStrengthsById,
              strengthsById: strengthsById,
              strengthCols: newStrengthCols
            }
          })
        })
      })
      .catch(err => console.error(err))
    }
  }

  function  getDefaultStrength (carrierId) {
    return {
      retail: {providerTypeId: "retail", carrierId: carrierId, strength: 0.0}, 
      tower: {providerTypeId: "tower", carrierId: carrierId, strength: 0.0}, 
      wholesale: {providerTypeId: "wholesale", carrierId: carrierId, strength: 0.0}
    }
  }

  function saveCompManConfig(competitorManagerId, pristineStrengthsById, strengthsById){

    return dispatch => {

      var changedModels = []
      for (var carrierId in strengthsById){
        for (var providerTypeId in strengthsById[carrierId]){
          var strengthJSON = angular.toJson(strengthsById[carrierId][providerTypeId] )
          if (strengthJSON !== JSON.stringify(pristineStrengthsById[carrierId][providerTypeId])) {
            changedModels.push(JSON.parse(strengthJSON))
          }
        }
      }

      if (changedModels.length > 0) {
        AroHttp.put(`/service/v1/competitor-manager/${competitorManagerId}/strengths`, changedModels)
          .then((result) => {
            if (!this.doRecalc){
              AroHttp.get(`/service/v1/competitor-manager/${competitorManagerId}/state`)
              .then((result) => {
                if (result.data.modifiedCount > 0){
                  //this.doRecalc = true
                }
                dispatch(setIsResourceEditor(true))
              })
            }else{
              dispatch(setIsResourceEditor(true))
            }
          })
          .catch((err) => console.error(err))
      } else {
        console.log('Competitor Editor: No models were changed. Nothing to save.')
      }
    }
  }

  export default {
    getResourceTypes,
    getResourceManagers,
    nextOrPrevPageClick,
    searchManagers,
    canMakeNewFilter,
    setIsResourceEditor,
    getPriceBookStrategy,
    createPriceBook,
    rebuildPricebookDefinitions,
    createRateReachManager,
    deleteResourceManager,
    newManager,
    editSelectedManager,
    startEditingResourceManager,
    loadArpuManagerConfiguration,
    loadCompManMeta,
    saveConfigurationToServer,
    setArpuStrategy,
    setArpuRevenue,
    getRegions,
    loadCompManForStates,
    saveCompManConfig
  }