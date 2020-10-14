/* globals */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import { batch } from 'react-redux'

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
      batch(() => {
        dispatch({
          type: Actions.RESOURCE_EDITOR_IS_RESOURCE_EDITOR,
          payload: status
        })
        if(status === true){
          dispatch(setModalTitle('Resource Managers'))
        }
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
          batch(() => {
            dispatch(getResourceManagers(resourceType))
            if (result.data && result.data.resourceType === null) result.data.resourceType = resourceType
            dispatch(editSelectedManager(result.data))
          })
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
          batch(() => {
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
            dispatch(setIsResourceEditor(false))
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
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('price_book'))
        })
      })
      .catch((err) => console.error(err))
    }
  }

  // Pricebook editor

  function getEquipmentTags () {
    return dispatch => {
      AroHttp.get('/service/category-tags/equipment/tags')
      .then(result => dispatch({
        type: Actions.RESOURCE_EDITOR_EQUIPMENT_TAGS,
        payload: result.data
      }))
      .catch(err => console.error(err))
    }
  }

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
          let priceBookDefinitions = results[1].data
          // Save a deep copy of the result, we can use this later if we save modifications to the server
          let pristineAssignments = JSON.parse(JSON.stringify(results[2].data))

          batch(() => {
            dispatch({
              type: Actions.RESOURCE_EDITOR_STATES_STRATEGY,
              payload: {
                statesForStrategy: statesForStrategy,
                selectedStateForStrategy: selectedStateForStrategy,
                priceBookDefinitions: priceBookDefinitions,
                pristineAssignments: pristineAssignments
              }
            })

            dispatch(definePriceBookForSelectedState(selectedStateForStrategy, priceBookDefinitions, pristineAssignments))
          })
        })
        .catch((err) => console.log(err))
    }
  }

  // Ensures that pristine cost assignments contain items for the specified state code.
  // If cost assignments are not present, the ones from state code '*' are copied into the ones for statecode.
  function ensurePristineCostAssignmentsForState (stateCode, pristineAssignments) {
    let DEFAULT_STATE_CODE = '*'
    const defaultConstructionRatios = {
      code: 'MORPHOLOGY_CODE',
      constructionRatios: {
        cableConstructionRatios: [
          { type: 'AERIAL', ratio: 0.7 },
          { type: 'BURIED', ratio: 0.3 }
        ]
      }
    }
    return dispatch => {
      const hasCostAssignmentsForState = pristineAssignments.costAssignments.filter((item) => item.state === stateCode).length > 0
      if (!hasCostAssignmentsForState) {
        // We don't have cost assignments for this state. Copy them over from state code '*'
        const defaultCostAssignments = pristineAssignments.costAssignments.filter((item) => item.state === DEFAULT_STATE_CODE)
        const stateCodeAssignments = defaultCostAssignments.map((item) => {
          var clonedItem = JSON.parse(JSON.stringify(item)) // Trying to move away from angular.copy
          clonedItem.state = stateCode
          return clonedItem
        })
        pristineAssignments.costAssignments = pristineAssignments.costAssignments.concat(stateCodeAssignments)
      }
      const hasConstructionRatiosForState = pristineAssignments.constructionRatios.filter(item => item.code === stateCode).length > 0
      if (!hasConstructionRatiosForState) {
        // Add default construction ratios for this state
        var constructionRatio = JSON.parse(JSON.stringify(defaultConstructionRatios))
        constructionRatio.code = stateCode
        pristineAssignments.constructionRatios.push(constructionRatio)
      }
    }
  }

  function definePriceBookForSelectedState (selectedStateForStrategy, priceBookDefinitions, pristineAssignments) {

    return dispatch => {
      // First ensure that we have pristine assignments for the given state code
      dispatch(ensurePristineCostAssignmentsForState(selectedStateForStrategy, pristineAssignments))

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
      var setOfSelectedEquipmentTags = {}

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
        setOfSelectedEquipmentTags[definition.id] = new Set()
      })
      let selectedDefinitionId = structuredPriceBookDefinitions[0].id
      batch(() => {
        dispatch({
          type: Actions.RESOURCE_EDITOR_PRICEBOOK_DEFINITION,
          payload: {
            selectedDefinitionId: selectedDefinitionId,
            structuredPriceBookDefinitions: structuredPriceBookDefinitions,
            selectedEquipmentTags: selectedEquipmentTags,
            setOfSelectedEquipmentTags: setOfSelectedEquipmentTags
          }
        })
        // Save construction ratios keyed by state
        dispatch(defineConstructionRatiosForSelectedState(selectedStateForStrategy,priceBookDefinitions, pristineAssignments))
      })
    }
  }

  function defineConstructionRatiosForSelectedState (selectedStateForStrategy,priceBookDefinitions, pristineAssignments) {
    return dispatch => {
      var constructionRatios = constructionRatios || {}
      if (!constructionRatios[selectedStateForStrategy]) {
        pristineAssignments.constructionRatios.forEach(ratio => {
          // Also change the "ratio" object so that the ratios are keyed by cable type (e.g. AERIAL or BURIED)
          var ratioValues = {}
          ratio.constructionRatios.cableConstructionRatios.forEach(item => { ratioValues[item.type] = item })
          // Make sure that we have values for all types of cable construction ratios
          priceBookDefinitions.fiberLaborList.forEach(item => {
            if (!ratioValues[item.cableConstructionType]) {
              ratioValues[item.cableConstructionType] = {
                type: item.cableConstructionType,
                ratio: 0
              }
            }
          })
          var keyedRatio = JSON.parse(JSON.stringify(ratio))
          keyedRatio.constructionRatios.cableConstructionRatios = ratioValues
          constructionRatios[keyedRatio.code] = keyedRatio
          dispatch({
            type: Actions.RESOURCE_EDITOR_CONSTRUCTION_RATIOS,
            payload: constructionRatios
          })
        })
      }
    }
  }

  function saveAssignmentsToServer (pristineAssignments, structuredPriceBookDefinitions, constructionRatios, priceBookId) {
    return dispatch => {

      // Build a map of cost assignment ids to their index within the array
      var assignments = JSON.parse(JSON.stringify(pristineAssignments))
      var itemIdToCostAssignmentIndex = {}
      var itemDetailIdToDetailAssignmentIndex = {}
      assignments.costAssignments.forEach((costAssignment, index) => {
        itemIdToCostAssignmentIndex[`${costAssignment.itemId}_${costAssignment.state}`] = index
      })

      // Build a map of detail assignment ids to their index within the array
      assignments.detailAssignments.forEach((detailAssignment, index) => {
        itemDetailIdToDetailAssignmentIndex[detailAssignment.itemDetailId] = index
      })

      // Loop through the pricebook definitions
      structuredPriceBookDefinitions.forEach((priceBookDefinition) => {
        // Loop through items in this definition
        priceBookDefinition.items.forEach((item) => {
          if (item.costAssignment) {
            // Item has a cost assignment. Save it.
            var costAssignmentIndex = itemIdToCostAssignmentIndex[`${item.id}_${item.state}`]
            assignments.costAssignments[costAssignmentIndex] = item.costAssignment
          }
          // Loop through all subitems
          item.subItems.forEach((subItem) => {
            if (subItem.costAssignment) {
              // Sub item has a cost assignment. Save it.
              var costAssignmentIndex = itemIdToCostAssignmentIndex[`${subItem.item.id}_${subItem.state}`]
              assignments.costAssignments[costAssignmentIndex] = subItem.costAssignment
            }
            if (subItem.detailAssignment) {
              // Sub item has a detail assignment. Save it.
              var detailAssignmentIndex = itemDetailIdToDetailAssignmentIndex[subItem.id]
              assignments.detailAssignments[detailAssignmentIndex] = subItem.detailAssignment
            }
          })
        })
      })
      // Save cable construction ratios. Convert back from keyed to array
      assignments.constructionRatios = []
      Object.keys(constructionRatios).forEach(constructionRatioKey => {
        var constructionRatio = JSON.parse(JSON.stringify(constructionRatios[constructionRatioKey]))
        var cableConstructionRatios = []
        Object.keys(constructionRatio.constructionRatios.cableConstructionRatios).forEach(ratioKey => {
          // Only save non-zero ratios
          if (Math.abs(constructionRatio.constructionRatios.cableConstructionRatios[ratioKey].ratio) > 0.001) {
            cableConstructionRatios.push(constructionRatio.constructionRatios.cableConstructionRatios[ratioKey])
          }
        })
        constructionRatio.constructionRatios.cableConstructionRatios = cableConstructionRatios
        assignments.constructionRatios.push(constructionRatio)
      })

      // Save assignments to the server
      AroHttp.put(`/service/v1/pricebook/${priceBookId}/assignment`, assignments)
      .then(result => {
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('price_book'))
        })
      })
      .catch((err) => console.error(err))
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
        return getDefaultConfiguration(loggedInUser, rateReachManager.category)
      })
      .then((defaultConfiguration) => AroHttp.put(`/service/rate-reach-matrix/resource/${createdRateReachManager.id}/config`, defaultConfiguration))
      .then(result => {
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('rate_reach_manager'))
        })
      })
      .catch((err) => console.error(err))
    }
  }

  function getDefaultConfiguration (loggedInUser, categoryType = 'SPEED') {
    const technologyTypes = ['Fiber', 'FiberProximity', 'Copper', 'CellTower']
    const configuration = {
      managerType: 'rate_reach_manager',
      categoryType: categoryType,
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

  function loadArpuManagerConfiguration (arpuManagerId) {

    return dispatch => {
      AroHttp.get(`/service/v1/arpu-manager/${arpuManagerId}`)
      .then((result) => {
        dispatch({
          type: Actions.RESOURCE_EDITOR_ARPU_MANAGER,
          payload: result.data
        })
      })

      AroHttp.get(`/service/v1/arpu-manager/${arpuManagerId}/configuration`)
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

  function saveArpuConfigurationToServer (arpuManagerId, pristineArpuManagerConfiguration, arpuManagerConfiguration) {

    var changedModels = []
    arpuManagerConfiguration.arpuModels.forEach((arpuModel) => {
      var arpuKey = JSON.stringify(arpuModel.id)
      var pristineModel = pristineArpuManagerConfiguration[arpuKey]
      if (pristineModel) {
        // Check to see if the model has changed
        if (JSON.stringify(pristineModel) !== JSON.stringify(arpuModel)) {
          changedModels.push(arpuModel)
        }
      }
    })

    return dispatch => {
      AroHttp.put(`/service/v1/arpu-manager/${arpuManagerId}/configuration`, changedModels)
      .then(result => {
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('arpu_manager'))
        })
      })
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
        
        carrierResult.data.forEach(ele => {
          newCarriersById[ele.carrierId] = ele
          newStrengthsById[ele.carrierId] = getDefaultStrength(ele.carrierId)
        })
        
        this.carriersById = newCarriersById
        
        carrierResult.data.sort((a,b) => {return b.cbPercent - a.cbPercent})

        dispatch({
          type: Actions.RESOURCE_EDITOR_CARRIERS_BY_PCT,
          payload: carrierResult.data
        })

        AroHttp.get(`/service/v1/competitor-manager/${competitorManagerId}/strengths?states=${regionsString}&user_id=${loggedInUser.id}`)
        .then((strengthsResult) => {
          
          // ToDo: strength types should be dynamic, either get this list from the server OR have the server initilize strengths 
          var newStrengthColsDict = {wholesale: "wholesale", tower: "tower", retail: "retail"}
          
          var newStrengthCols = ["wholesale", "tower", "retail"]
          
          strengthsResult.data.forEach(ele => {

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
          var strengthJSON = JSON.stringify(strengthsById[carrierId][providerTypeId] )
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

  // Roic Manager

  function reloadRoicManagerConfiguration (roicManagerId) {
    return dispatch => {
      AroHttp.get(`/service/v1/roic-manager/${roicManagerId}`)
        .then((result) => {
          dispatch({
            type: Actions.RESOURCE_EDITOR_ROIC_MANAGER,
            payload: result.data
          })
        })

      AroHttp.get(`/service/v1/roic-manager/${roicManagerId}/configuration`)
      .then((result) => {
        var roicModels = []
        // Sort the roic models based on the locationTypeEntity
        const locationEntityOrder = ['household', 'smallBusiness', 'mediumBusiness', 'largeBusiness', 'cellTower']
        locationEntityOrder.forEach(locationEntity => {
          const filteredModels = result.data.inputs
            .filter(item => item.id.entityType === locationEntity)
            .sort((a, b) => (a.id.speedCategory < b.id.speedCategory) ? -1 : 1)
          roicModels = roicModels.concat(filteredModels)
        })
        let roicManagerConfiguration = { inputs: roicModels, roicSettingsConfiguration: result.data.roicSettingsConfiguration }
        dispatch({
          type: Actions.RESOURCE_EDITOR_ROIC_MANAGER_CONFIG,
          payload: roicManagerConfiguration
        })
      })
      .catch((err) => console.error(err))
    }
  }

  function saveRoicConfigurationToServer (roicManagerId, roicManagerConfiguration) {
    return dispatch => {
      AroHttp.put(`/service/v1/roic-manager/${roicManagerId}/configuration`, roicManagerConfiguration)
      .then(result => {
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('roic_manager'))
        })
      })
      .catch((err) => console.error(err))
    }
  }

  // Impedance Editor

  function reloadImpedanceManagerConfiguration (impedanceManagerId) {
    return dispatch => {
      AroHttp.get(`/service/v1/impedance-manager/${impedanceManagerId}`)
        .then((result) => {
          dispatch({
            type: Actions.RESOURCE_EDITOR_IMPEDANCE_MANAGER,
            payload: result.data
          })
        })
        .catch(err => console.error(err))

      AroHttp.get(`/service/v1/impedance-manager/${impedanceManagerId}/configuration`)
        .then((result) => {
          let impedanceManagerConfiguration = result.data
          // The map is a set of key value pairs, we convert it to a sorted array
          let orderedImpedanceMapKeys = Object.keys(impedanceManagerConfiguration.map)
          orderedImpedanceMapKeys.sort((a, b) => (a < b) ? -1 : 1)
          dispatch({
            type: Actions.RESOURCE_EDITOR_IMPEDANCE_MANAGER_CONFIG,
            payload: {
              impedanceManagerConfiguration: impedanceManagerConfiguration,
              orderedImpedanceMapKeys: orderedImpedanceMapKeys,
            }
          })
        })
        .catch((err) => console.error(err))
    }
  }

  function saveImpedanceConfigurationToServer (impedanceManagerId, impedanceManagerConfiguration) {
    return dispatch => {
      AroHttp.put(`/service/v1/impedance-manager/${impedanceManagerId}/configuration`, impedanceManagerConfiguration)
      .then(result => {
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('impedance_mapping_manager'))
        })
      })
      .catch((err) => console.error(err))
    }
  }

  // TSM Manager

  function reloadTsmManagerConfiguration (tsmManagerId) {
    return dispatch => {
      AroHttp.get(`/service/v1/tsm-manager/${tsmManagerId}`)
      .then((result) => {
        dispatch({
          type: Actions.RESOURCE_EDITOR_TSM_MANAGER,
          payload: result.data
        })
      })

      AroHttp.get(`/service/v1/tsm-manager/${tsmManagerId}/strengths`)
      .then((result) => {
        let tsmManagerConfiguration = result.data
        let pristineTsmManagerConfiguration = JSON.parse(JSON.stringify(result.data))

        dispatch({
          type: Actions.RESOURCE_EDITOR_TSM_MANAGER_CONFIG,
          payload: {
            tsmManagerConfiguration: tsmManagerConfiguration,
            pristineTsmManagerConfiguration: pristineTsmManagerConfiguration,
          }
        })
      })
      .catch((err) => console.error(err))
    }
  }

  function saveTsmConfigurationToServer (loggedInUser, tsmManagerId, tsmManagerConfiguration, pristineTsmManagerConfiguration) {

    return dispatch => {
      // Only save those configurations that have changed
      var changedModels = []
      tsmManagerConfiguration.forEach((tsmModel, index) => {
        var pristineModel = pristineTsmManagerConfiguration[index]
        if (pristineModel) {
          // Check to see if the model has changed
          if (JSON.stringify(pristineModel) !== JSON.stringify(tsmModel)) {
            var tsmModelToSend = JSON.parse(JSON.stringify(tsmModel))
            delete tsmModelToSend.dimensionName // Can't send this over to aro-service
            changedModels.push(tsmModelToSend)
          }
        }
      })

      if (changedModels.length > 0) {
        AroHttp.put(`/service/v1/tsm-manager/${tsmManagerId}/spends?refreshState=true&user_id=${loggedInUser.id}`, changedModels)
        .then(result => {
          batch(() => {
            dispatch(setIsResourceEditor(true))
            dispatch(getResourceManagers('tsm_manager'))
          })
        })
        .catch((err) => console.error(err))
      } else {
        console.log('TSM Editor: No models were changed. Nothing to save.')
      }
    }
  }

  // Rate Reach Manager

  var matrixOrders = {}
  var technologyTypeDetails = {}

  function reloadRateReachManagerConfiguration (rateReachManagerId, loggedInUser) {

    var rateReachConfig = []
    return dispatch => {
      AroHttp.get(`/service/rate-reach-matrix/resource/${rateReachManagerId}`)
      .then((result) => {
        dispatch({
          type: Actions.RESOURCE_EDITOR_RATE_REACH_MANAGER,
          payload: result.data
        })
      })
      .catch(err => console.error(err))

      AroHttp.get(`/service/rate-reach-matrix/resource/${rateReachManagerId}/config`)
      .then(result => {
        rateReachConfig = result.data
        return loadAllTechnologyTypeDetails(loggedInUser, rateReachConfig)
      })
      .then(() => {
        rateReachConfig = matrixMapsToOrderedArray(rateReachConfig)
        dispatch({
          type: Actions.RESOURCE_EDITOR_RATE_REACH_MANAGER_CONFIG,
          payload: {
            rateReachConfig: rateReachConfig,
            technologyTypeDetails: technologyTypeDetails,
          }
        })      
      })
      .catch(err => console.error(err))
    }
  }

    // Replaces matrix maps with ordered arrays and returns a new rate reach configuration. Used to show
  // matrix maps in the correct order in the UI
  function matrixMapsToOrderedArray (rateReachConfig) {
    Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      var matrixMap = rateReachConfig.rateReachGroupMap[technologyType].matrixMap
      var orderedMatrixMap = [] // Note, we are converting to an array
      Object.keys(matrixMap).forEach(key => {
        orderedMatrixMap.push({
          id: key,
          value: matrixMap[key]
        })
      })

      // At the point the array is unordered. Order it!
      orderedMatrixMap.sort((a, b) => {
        // Slow check for indexOfs, but the array is small
        const aIndex = matrixOrders[technologyType].findIndex(item => item.id === a.id)
        const bIndex = matrixOrders[technologyType].findIndex(item => item.id === b.id)
        return (aIndex < bIndex) ? -1 : 1
      })
      rateReachConfig.rateReachGroupMap[technologyType].matrixMap = orderedMatrixMap
    })
    return rateReachConfig
  }

  function loadAllTechnologyTypeDetails (loggedInUser, rateReachConfig) {
    var ttPromises = []
    Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      ttPromises.push(loadTechnologyTypeDetails(loggedInUser,technologyType))
    })
    return Promise.all(ttPromises)
      .catch(err => console.error(err))
  }

  function loadTechnologyTypeDetails (loggedInUser, technologyType) {

    return Promise.all([
      AroHttp.get(`/service/rate-reach-matrix/network-structures?technology_type=${technologyType}&user_id=${loggedInUser.id}`),
      AroHttp.get(`/service/rate-reach-matrix/technologies?technology_type=${technologyType}&user_id=${loggedInUser.id}`)
    ])
    .then(results => {
      technologyTypeDetails[technologyType] = {
        networkStructures: results[0].data,
        technologies: {}
      }
      matrixOrders[technologyType] = results[1].data
      results[1].data.forEach(technology => {
        technologyTypeDetails[technologyType].technologies[technology.id] = technology
      })
      return Promise.resolve()
    })
    .catch(err => console.error(err))
  }

  function saveRateReachConfig (rateReachManagerId, rateReachConfig) {

    return dispatch => {
      var configuration = JSON.parse(angular.toJson(rateReachConfig)) // Remove angularjs-specific properties from object
      configuration = orderedArrayToMatrixMaps(configuration) // Transform object in aro-service format
      AroHttp.put(`/service/rate-reach-matrix/resource/${rateReachManagerId}/config`, configuration)
      .then(result => {
        batch(() => {
          dispatch(setIsResourceEditor(true))
          dispatch(getResourceManagers('rate_reach_manager'))
        })
      })
      .catch((err) => console.error(err))
    }
  }

  // Replaces ordered arrays with matrix maps and returns a new rate reach configuration. Used to convert
  // from ui-specific arrays to something that aro-service can process.
  function orderedArrayToMatrixMaps (rateReachConfig) {
    Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
      var matrixMapArray = rateReachConfig.rateReachGroupMap[technologyType].matrixMap
      var matrixMap = {}
      matrixMapArray.forEach(item => {
        matrixMap[item.id] = item.value
      })
      rateReachConfig.rateReachGroupMap[technologyType].matrixMap = matrixMap
    })
    return rateReachConfig
  }

  function setModalTitle (title){
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_MODAL_TITLE,
        payload: title
      })
    }
  }

  function setIsRrmManager (value){
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_IS_RRM_MANAGER,
        payload: value
      })
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
    definePriceBookForSelectedState,
    getEquipmentTags,
    saveAssignmentsToServer,
    createRateReachManager,
    deleteResourceManager,
    newManager,
    editSelectedManager,
    startEditingResourceManager,
    loadArpuManagerConfiguration,
    loadCompManMeta,
    saveArpuConfigurationToServer,
    getRegions,
    loadCompManForStates,
    saveCompManConfig,
    reloadRoicManagerConfiguration,
    saveRoicConfigurationToServer,
    reloadImpedanceManagerConfiguration,
    saveImpedanceConfigurationToServer,
    reloadTsmManagerConfiguration,
    saveTsmConfigurationToServer,
    reloadRateReachManagerConfiguration,
    saveRateReachConfig,
    setModalTitle,
    setIsRrmManager
  }