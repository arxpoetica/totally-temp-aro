/* globals */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import { batch } from 'react-redux'
// ToDo: probably shouldn't be importing PlanActions into another action creator
//  BUT resource managers are listed in two places, DRY this up!
import PlanActions from '../plan/plan-actions'
import GlobalSettingsActions from '../global-settings/globalsettings-action'
import { Notifier } from '../../common/notifications'
import { RECALC_STATES } from './competitor/competitor-shared'

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

function getResourceManagers (selectedResourceKey) {
  return (dispatch, getState) => {
    const state = getState()
    const loggedInUser = state.user.loggedInUser
    const searchText = state.resourceEditor.searchText

    if (!loggedInUser) {
      return
    }

    let params = ''
    if (searchText.trim() !== '') {
      params += `&name=${searchText}`
    }
    if (selectedResourceKey && (selectedResourceKey !== 'all')) {
      params += `&resourceType=${selectedResourceKey}`
    }
    if (params !== '') {
      params = '?' + params
    }

    AroHttp.get(`service/v2/resource-manager${params}`)
    .then(result => dispatch({
      type: Actions.RESOURCE_EDITOR_SET_RESOURCE_MANAGERS,
      payload: result.data
    }))
    .catch(err => console.error(err))
  }
}

function loadResourceManager (resourceManagerId, managerType, resourceManagerName) {
  return async dispatch => {
    const result = await AroHttp.get(`/service/v2/resource-manager/${resourceManagerId}/${managerType}`)
    dispatch({
      type: Actions.RESOURCE_MANAGER_SET_MANAGER_DEFINITION,
      payload: {
        resourceManagerId: resourceManagerId,
        resourceManagerName: resourceManagerName,
        definition: result.data,
      },
    })
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

function setEditingMode (editingMode) {
  return dispatch => {
    dispatch({
      type: Actions.RESOURCE_MANAGER_SET_EDITING_MODE,
      payload: {
        editingMode
      }
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
      if (status === true){
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
    const managerId = resourceKeyToEndpointId[resourceType]
    if (managerId === 'pricebook') {
      // Have to put this switch in here because the API for pricebook cloning is different
      // Can remove once API is unified.
      createByEditMode(createPriceBookMode, sourceId)
    } else if (managerId === 'rate-reach-matrix') {
      createByEditMode(createRateReachManagerMode, sourceId)
    } else {
      // Create a resource manager
      let idParam = ''
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
          dispatch(PlanActions.loadPlanResourceSelectionFromServer())
        })
      })
      .catch((err) => console.error(err))
    }
  }
}

function editSelectedManager(selectedManager){
  return dispatch => {
    dispatch(startEditingResourceManager(
      selectedManager.id, selectedManager.resourceType, selectedManager.name, 'EDIT_RESOURCE_MANAGER'
    ))
  }
}

function startEditingResourceManager (resourceManagerId, managerType, resourceManagerName, editingMode) {
  return dispatch => {
    // TODO: dispatch to `loadResourceManager` above, since it performs the same action
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
          // To Resize Resoure Editor Popup to xl (Extra large) whille Edit rate_reach_manager
          if (managerType === 'rate_reach_manager') {
            dispatch(setIsRrmManager(true))
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

function createPriceBook (priceBook, cloneManager) {
  // Create a new pricebook with the specified name and description
  let createdManagerId = null
  let sourcePriceBookId = null
  return (dispatch, getState) => {
    const state = getState()
    AroHttp.post(`/service/v1/pricebook`,{
      priceStrategy: priceBook.strategy,
      name: priceBook.name,
      description: priceBook.description
    })
    .then((result) => {
      createdManagerId = result.data.id
      sourcePriceBookId = cloneManager.id
      // Return the assignments of either the 0th pricebook (if creating a new one) or the source pricebook (if cloning)
      if (sourcePriceBookId) {
        return AroHttp.get(`/service/v1/pricebook/${sourcePriceBookId}/assignment`)
      } else {
        return AroHttp.get('/service/v1/pricebook')
          .then((result) => AroHttp.get(`/service/v1/pricebook/${result.data[0].id}/assignment`))
      }
    })
    .then((result) => {
      const newManagerAssignments = result.data
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
        dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
        dispatch(PlanActions.loadPlanResourceSelectionFromServer())
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

  const DEFAULT_STATE_CODE = '*'
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
        const selectedStateForStrategy = statesForStrategy[0]
        const priceBookDefinitions = results[1].data
        // Save a deep copy of the result, we can use this later if we save modifications to the server
        const pristineAssignments = JSON.parse(JSON.stringify(results[2].data))

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
  const DEFAULT_STATE_CODE = '*'
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
        const clonedItem = JSON.parse(JSON.stringify(item)) // Trying to move away from angular.copy
        clonedItem.state = stateCode
        return clonedItem
      })
      pristineAssignments.costAssignments = pristineAssignments.costAssignments.concat(stateCodeAssignments)
    }
    const hasConstructionRatiosForState = pristineAssignments.constructionRatios.filter(item => item.code === stateCode).length > 0
    if (!hasConstructionRatiosForState) {
      // Add default construction ratios for this state
      const constructionRatio = JSON.parse(JSON.stringify(defaultConstructionRatios))
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
    const itemIdToCostAssignment = {}
    const itemDetailIdToDetailAssignment = {}
    const costAssignmentsForState = pristineAssignments.costAssignments.filter((item) => item.state === selectedStateForStrategy)
    costAssignmentsForState.forEach((costAssignment) => {
      itemIdToCostAssignment[costAssignment.itemId] = costAssignment
    })

    // Build a map of detail assignment ids to objects
    pristineAssignments.detailAssignments.forEach((detailAssignment) => {
      itemDetailIdToDetailAssignment[detailAssignment.itemDetailId] = detailAssignment
    })

    // Build the pricebookdefinitions
    const structuredPriceBookDefinitions = []
    const selectedEquipmentTags = {}
    const setOfSelectedEquipmentTags = {}

    Object.keys(priceBookDefinitions).forEach((definitionKey) => {
      const definitionItems = priceBookDefinitions[definitionKey]
      const definition = {
        id: definitionKey,
        description: definitionKey,
        items: []
      }
      definitionItems.forEach((definitionItem) => {
        // If this item id is in cost assignments, add it
        const item = {
          id: definitionItem.id,
          name: definitionItem.name,
          description: definitionItem.description,
          unitOfMeasure: definitionItem.unitOfMeasure,
          costAssignment: itemIdToCostAssignment[definitionItem.id],
          cableConstructionType: definitionItem.cableConstructionType,
          subItems: [],
          tagMapping: definitionItem.tagMapping
        }
        if (definitionItem.subItems) {
          definitionItem.subItems.forEach((subItem) => {
            const subItemToPush = {
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
      }
        definition.items.push(item)
      })
      structuredPriceBookDefinitions.push(definition)
      selectedEquipmentTags[definition.id] = []
      setOfSelectedEquipmentTags[definition.id] = new Set()
    })
    const selectedDefinitionId = structuredPriceBookDefinitions[0].id
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
    const constructionRatios = constructionRatios || {}
    if (!constructionRatios[selectedStateForStrategy]) {
      pristineAssignments.constructionRatios.forEach(ratio => {
        // Also change the "ratio" object so that the ratios are keyed by cable type (e.g. AERIAL or BURIED)
        const ratioValues = {}
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
        const keyedRatio = JSON.parse(JSON.stringify(ratio))
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
  return (dispatch, getState) => {
    const state = getState()
    // Build a map of cost assignment ids to their index within the array
    const assignments = JSON.parse(JSON.stringify(pristineAssignments))
    const itemIdToCostAssignmentIndex = {}
    const itemDetailIdToDetailAssignmentIndex = {}
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
          const costAssignmentIndex = itemIdToCostAssignmentIndex[`${item.id}_${item.state}`]
          assignments.costAssignments[costAssignmentIndex] = item.costAssignment
        }
        // Loop through all subitems
        item.subItems.forEach((subItem) => {
          if (subItem.costAssignment) {
            // Sub item has a cost assignment. Save it.
            const costAssignmentIndex = itemIdToCostAssignmentIndex[`${subItem.item.id}_${subItem.state}`]
            assignments.costAssignments[costAssignmentIndex] = subItem.costAssignment
          }
          if (subItem.detailAssignment) {
            // Sub item has a detail assignment. Save it.
            const detailAssignmentIndex = itemDetailIdToDetailAssignmentIndex[subItem.id]
            assignments.detailAssignments[detailAssignmentIndex] = subItem.detailAssignment
          }
        })
      })
    })
    // Save cable construction ratios. Convert back from keyed to array
    assignments.constructionRatios = []
    Object.keys(constructionRatios).forEach(constructionRatioKey => {
      const constructionRatio = JSON.parse(JSON.stringify(constructionRatios[constructionRatioKey]))
      const cableConstructionRatios = []
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
        dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
      })
    })
    .catch((err) => console.error(err))
  }
}

//Rate-Reach_Manager

function createRateReachManager (rateReachManager, cloneManager, loggedInUser) {
  // Create a new rate reach manager with the specified name and description
  const sourceRateReachManagerId = cloneManager.id
  let createUrl = `/service/rate-reach-matrix/resource`
  if (sourceRateReachManagerId) {
    createUrl += `?source_resource_manager=${sourceRateReachManagerId}`
  }
  let createdRateReachManager = null
  return (dispatch, getState) => {
    const state = getState()
     AroHttp.post(createUrl,{
      name: rateReachManager.name,
      description: rateReachManager.description
    })
    .then(result => {
      if (sourceRateReachManagerId) {
        return result
      } else {
        createdRateReachManager = result.data
        return getDefaultConfiguration(loggedInUser, rateReachManager.category)
        .then(defaultConfiguration => AroHttp.put(`/service/rate-reach-matrix/resource/${createdRateReachManager.id}/config?user_id=${loggedInUser.id}`, defaultConfiguration))
      }
    })
    .then(result => {
      batch(() => {
        dispatch(setIsResourceEditor(true))
        dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
        // ToDo: resource managers are listed in two places, DRY that up!
        dispatch(PlanActions.loadPlanResourceSelectionFromServer())
      })
    })
    .catch((err) => console.error(err))
  }
}

function getDefaultConfiguration (loggedInUser, categoryType = 'SPEED') {
  // ToDo: technologyTypes should be dynamic
  let technologyTypes = []
  if (categoryType === 'BAND') {
    technologyTypes = ['FiberProximity']
  } else {
    technologyTypes = ['Fiber', 'FiberProximity', 'Copper', 'CellTower']
  }
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

  const configPromises = []
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

function loadArpuManagerConfiguration(arpuManagerId) {
  return dispatch => {
    AroHttp.get(`/service/v1/arpu-manager/${arpuManagerId}`)
      .then((result) => {
        dispatch({
          type: Actions.RESOURCE_EDITOR_ARPU_MANAGER,
          payload: result.data,
        })
      })

    const promises = [
      AroHttp.get(`/service/v1/arpu-products`),
      AroHttp.get(`/service/v1/arpu-segments`),
      AroHttp.get(`/service/v1/arpu-manager/${arpuManagerId}/configuration`),
    ]

    Promise.all(promises)
      .then(([{ data: products }, { data: segments }, { data: config }]) => {

        // Sort the arpu models based on the `locationEntityType`
        // NOTE: the location order is hard typed here...
        const businessOrder = ['small', 'medium', 'large']
        const locationOrder = ['household', ...businessOrder, 'celltower']
        let arpuModels = []
        for (const type of locationOrder) {
          // NOTE: right now there's only the capture-all morphology `*` group hence `[0]`
          const filteredModels = config.morphologyGroups[0].arpuModels
            .filter(item => item.arpuModelKey.locationEntityType === type)
            .sort((one, two) => one.arpuModelKey.speedCategory
              .localeCompare(two.arpuModelKey.speedCategory)
            )
          arpuModels = arpuModels.concat(filteredModels)
        }

        const titles = {
          'householdcat3': 'Residential (Legacy - Copper Cat3)',
          'householdcat7': 'Residential (Planned)',
          'smallcat3': 'Small Business (Legacy - Copper Cat3)',
          'smallcat7': 'Small Business (Planned)',
          'mediumcat3': 'Medium Business (Legacy - Copper Cat3)',
          'mediumcat7': 'Medium Business (Planned)',
          'largecat3': 'Large Business (Legacy - Copper Cat3)',
          'largecat7': 'Large Business (Planned)',
          'celltowercat3': 'Celltower (Legacy - Copper Cat3)',
          'celltowercat7': 'Celltower (Planned)',
        }

        arpuModels = arpuModels.map(model => {
          const { locationEntityType, speedCategory } = model.arpuModelKey
          model.title = titles[locationEntityType + speedCategory]

          // NOTE: we're rewiring the strategy for UI purposes.
          // ON SAVE, THIS IS REVERSED BACK INTO THE CONFIG
          // ===> strategy options
          model.options = [{ value: 'global', label: 'Global' }]
          if (businessOrder.includes(locationEntityType)) {
            model.options.push({ value: 'tsm', label: 'Telecom Spend Matrix' })
          } else if (locationEntityType === 'household') {
            model.options.push({ value: 'segmentation', label: 'Segmentation' })
          }
          model.options.push({ value: 'override', label: 'Location Layer' })

          // first make sure things are in order
          model.cells.sort((one, two) => {
            return one.key.segmentId === two.key.segmentId
              ? one.key.productId - two.key.productId
              : one.key.segmentId - two.key.segmentId
          })

          // ===> strategy value
          if (model.arpuStrategy === 'arpu') {
            if (locationEntityType === 'celltower'
              || (
                model.cells.length === 1
                && model.cells[0].key.productId === 1
                && model.cells[0].key.segmentId === 1
                && model.cells[0].key.segmentId === 1
                && model.cells[0].arpuPercent === 1
              )
              || !model.cells.length
            ) {
              // ===> single cell, arpuPercent === 1, `arpu` means `global` here
              model.strategy = 'global'
            } else {
              // ===> multiple cell, `arpu` means `segmentation` here
              model.strategy = 'segmentation'
            }
          } else {
            // ===> should only be `tsm` or `override` left over
            model.strategy = model.arpuStrategy
          }

          model.products = products
            .sort((one, two) => one.id - two.id)
            .map(product => {
              const found = model.productAssignments.find(prod => {
                return prod.productId === product.id
              })
              return Object.assign({}, product, {
                arpu: found ? found.arpu : 0,
                opex: found ? found.opex : 0,
                fixedCost: found ? found.fixedCost : 0,
              })
            })

          model.segments = segments
            .sort((one, two) => one.id - two.id)
            .map(segment => {
              segment.percents = model.products.map(product => {
                const found = model.cells.find(cell => {
                  return cell.key.productId === product.id
                    && cell.key.segmentId === segment.id
                })
                // NOTE: multiplying by 100 because percents are
                // stored in decimal but must be displayed in 100s
                return (found ? found.arpuPercent : 0) * 100
              })
              return Object.assign({}, segment)
            })

          // global value treated separately for convenience in the UI
          model.global = model.products[0].arpu

          delete model.arpuStrategy
          delete model.productAssignments
          delete model.segmentAssignments
          delete model.cells
          return model
        })

        dispatch({
          type: Actions.RESOURCE_EDITOR_SET_ARPU_MODELS,
          payload: arpuModels,
        })
      })
      .catch((err) => console.error(err))
  }
}

function saveArpuModels(arpuManagerId, models) {

  const arpuModels = JSON.parse(JSON.stringify(models)).map(model => {

    model.productAssignments = model.products.map(product => {
      // if it's global, need to set it
      if (model.strategy === 'global') {
        let arpu = 0
        if (product.id === 1) {
          arpu = model.global
        }
        product = Object.assign({}, product, { arpu, opex: 0, fixedCost: 0 })
      }
      product.productId = product.id
      delete product.id
      delete product.name
      delete product.description
      return product
    })

    if (model.strategy === 'override' || model.strategy === 'tsm') {
      // ===> tsm or override
      model.arpuStrategy = model.strategy
      model.cells = []
    } else if (model.strategy === 'global') {
      // ===> global
      model.arpuStrategy = 'arpu'
      // since global, just set to 1 (which is the decimal of 100%)
      model.cells = [{ key: { productId: 1, segmentId: 1 }, arpuPercent: 1 }]
    } else { // model.strategy === 'segmentation'
      // ===> segmentation
      model.arpuStrategy = 'arpu'
      model.cells = model.segments.reduce((cells, segment) => {
        const productCells = model.products.map((product, index) => {
          const arpuPercent = segment.percents[index]
          if (arpuPercent) {
            return {
              key: {
                productId: product.productId,
                segmentId: segment.id,
              },
              // NOTE: dividing by 100 because percents are
              // displayed in 100s but must be stored in decimal
              arpuPercent: parseFloat(arpuPercent) / 100,
            }
          }
          return false
        }).filter(Boolean)
        return [...cells, ...productCells]
      }, [])
    }

    model.segmentAssignments = model.segments.map(segment => {
      segment.segmentId = segment.id
      delete segment.id
      delete segment.name
      delete segment.description
      delete segment.percents
      return segment
    })

    delete model.title
    delete model.options
    delete model.strategy
    delete model.global
    delete model.products
    delete model.segments

    return model
  })

  return (dispatch, getState) => {
    if (arpuModels.length) {
      const state = getState()
      AroHttp.put(`/service/v1/arpu-manager/${arpuManagerId}/configuration`, {
        morphologyGroups: [{
          arpuModels,
          morphology: '*',
        }]
      })
        .then(result => {
          batch(() => {
            dispatch(setIsResourceEditor(true))
            dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
          })
        })
        .catch(err => {
          console.error(err)
          dispatch(GlobalSettingsActions.httpErrorhandle(err))
        })
    } else {
      console.log('ARPU Editor: No models were changed. Nothing to save.')
    }
  }
}

// Competition System

function getRegions () {
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

    if ('undefined' === typeof competitorManagerId || selectedRegions.length < 1) return
    const regionsString = selectedRegions.map(ele => ele.value).join(",")

    AroHttp.get(`/service/v1/competitor-profiles?states=${regionsString}`)
    .then((carrierResult) => {
      const newCarriersById = {}
      const newStrengthsById = {}

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
        const newStrengthColsDict = {wholesale: "wholesale", tower: "tower", retail: "retail"}

        const newStrengthCols = ["wholesale", "tower", "retail"]

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
        const pristineStrengthsById = newStrengthsById
        const strengthsById = JSON.parse(JSON.stringify(pristineStrengthsById))

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
  return async(dispatch) => {
    try {
      const changedModels = []
      for (const carrierId in strengthsById) {
        for (const providerTypeId in strengthsById[carrierId]){
          const strengthJSON = JSON.stringify(strengthsById[carrierId][providerTypeId] )
          if (strengthJSON !== JSON.stringify(pristineStrengthsById[carrierId][providerTypeId])) {
            changedModels.push(JSON.parse(strengthJSON))
          }
        }
      }

      if (changedModels.length > 0) {
        await AroHttp.put(`/service/v1/competitor-manager/${competitorManagerId}/strengths`, changedModels)
        if (!this.doRecalc){
          const url = `/service/v2/resource-manager/${competitorManagerId}/competition_manager`
          const { data } = await AroHttp.get(url)
          dispatch(setRecalcState(data.state))
        }
      } else {
        console.log('Competitor Editor: No models were changed. Nothing to save.')
      }
    } catch (error) {
      Notifier.error(error)
    }
  }
}

// Recalcing
function executeRecalc(userId, competitorManagerId) {
  return async(dispatch) => {
    try {
      dispatch(setRecalcState(RECALC_STATES.RECALCULATING))
      const url = `/service/v1/competitor-manager/${competitorManagerId}/refresh/?user_id=${userId}`
      await AroHttp.post(url)
    } catch (error) {
      Notifier.error(error)
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
      let roicModels = []
      // Sort the roic models based on the locationTypeEntity
      const locationEntityOrder = ['household', 'smallBusiness', 'mediumBusiness', 'largeBusiness', 'cellTower']
      locationEntityOrder.forEach(locationEntity => {
        const filteredModels = result.data.inputs
          .filter(item => item.id.entityType === locationEntity)
          .sort((a, b) => (a.id.speedCategory < b.id.speedCategory) ? -1 : 1)
        roicModels = roicModels.concat(filteredModels)
      })
      const roicManagerConfiguration = { inputs: roicModels, roicSettingsConfiguration: result.data.roicSettingsConfiguration }
      dispatch({
        type: Actions.RESOURCE_EDITOR_ROIC_MANAGER_CONFIG,
        payload: roicManagerConfiguration
      })
    })
    .catch((err) => console.error(err))
  }
}

function saveRoicConfigurationToServer (roicManagerId, roicManagerConfiguration) {
  return (dispatch, getState) => {
    const state = getState()
    AroHttp.put(`/service/v1/roic-manager/${roicManagerId}/configuration`, roicManagerConfiguration)
    .then(result => {
      batch(() => {
        dispatch(setIsResourceEditor(true))
        dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
        dispatch(setEditingMode('LIST_RESOURCE_MANAGERS'))
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
        const impedanceManagerConfiguration = result.data
        // The map is a set of key value pairs, we convert it to a sorted array
        const orderedImpedanceMapKeys = Object.keys(impedanceManagerConfiguration.map)
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
  return (dispatch, getState) => {
    const state = getState()
    AroHttp.put(`/service/v1/impedance-manager/${impedanceManagerId}/configuration`, impedanceManagerConfiguration)
    .then(result => {
      batch(() => {
        dispatch(setIsResourceEditor(true))
        dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
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
      const tsmManagerConfiguration = result.data
      const pristineTsmManagerConfiguration = JSON.parse(JSON.stringify(result.data))

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

  return (dispatch, getState) => {
    const state = getState()
    // Only save those configurations that have changed
    const changedModels = []
    tsmManagerConfiguration.forEach((tsmModel, index) => {
      const pristineModel = pristineTsmManagerConfiguration[index]
      if (pristineModel) {
        // Check to see if the model has changed
        if (JSON.stringify(pristineModel) !== JSON.stringify(tsmModel)) {
          const tsmModelToSend = JSON.parse(JSON.stringify(tsmModel))
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
          dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
        })
      })
      .catch((err) => console.error(err))
    } else {
      console.log('TSM Editor: No models were changed. Nothing to save.')
    }
  }
}

// Rate Reach Manager

const matrixOrders = {}
const technologyTypeDetails = {}

function reloadRateReachManagerConfiguration (rateReachManagerId, loggedInUser) {

  let rateReachConfig = []
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
    const matrixMap = rateReachConfig.rateReachGroupMap[technologyType].matrixMap
    const orderedMatrixMap = [] // Note, we are converting to an array
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
  const ttPromises = []
  Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
    ttPromises.push(loadTechnologyTypeDetails(loggedInUser, technologyType))
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

  return (dispatch, getState) => {
    const state = getState()
    let configuration = JSON.parse(angular.toJson(rateReachConfig)) // Remove angularjs-specific properties from object
    configuration = orderedArrayToMatrixMaps(configuration) // Transform object in aro-service format
    AroHttp.put(`/service/rate-reach-matrix/resource/${rateReachManagerId}/config`, configuration)
    .then(result => {
      batch(() => {
        dispatch(setIsResourceEditor(true))
        dispatch(getResourceManagers(state.resourceEditor.selectedResourceKey))
      })
    })
    .catch((err) => console.error(err))
  }
}

// Replaces ordered arrays with matrix maps and returns a new rate reach configuration. Used to convert
// from ui-specific arrays to something that aro-service can process.
function orderedArrayToMatrixMaps (rateReachConfig) {
  Object.keys(rateReachConfig.rateReachGroupMap).forEach(technologyType => {
    const matrixMapArray = rateReachConfig.rateReachGroupMap[technologyType].matrixMap
    const matrixMap = {}
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

function convertlengthUnitsToMeters (input) {
  return (dispatch, getState) => {
    // To get length_units_to_meters from redux state
    const state = getState()
    const lengthUnitsToMeters = state.toolbar.appConfiguration.units.length_units_to_meters
    // Convert user-input value (in user units) to meters
    input = input || '0'
    return (+input) * lengthUnitsToMeters
  }
}

function convertMetersToLengthUnits (input) {
  return (dispatch, getState) => {
    // To get meters_to_length_units from redux state
    const state = getState()
    const metersToLengthUnits = state.toolbar.appConfiguration.units.meters_to_length_units
    // Convert model value (always in meters) to user units before displaying it to the user
    input = input || '0'
    const inputTransformed = (+input) * metersToLengthUnits

    // toFixed() converts it to a string, and + converts it back to a number before returning
    return +inputTransformed.toFixed(2)
  }
}

function setRecalcState(nextRecalcState) {
  return (dispatch, getState) => {
    const { recalcState: prevRecalcState, recalcNotificationId } = getState().resourceEditor
    dispatch({
      type: Actions.RESOURCE_EDITOR_SET_RECALC_STATE,
      payload: nextRecalcState,
    })
    if (nextRecalcState !== prevRecalcState && nextRecalcState === RECALC_STATES.RECALCULATING) {
      const id = Notifier.warning([
        'The competition manager is being updated.',
        'You should not run any plans until this operation is complete.',
        'Please contact your system admin with any questions.',
      ].join(' '), {
        title: 'Updating Competition Manager',
        loading: true,
      })
      dispatch(setRecalcNotificationId(id))
    } else if (recalcNotificationId && nextRecalcState !== RECALC_STATES.RECALCULATING) {
      setRecalcNotificationId(null)
      Notifier.done(recalcNotificationId, {
        title: 'Updated Competition Manager',
        message: [
          'The competition manager has finished updating.',
          'It is now safe to continue running plans.',
        ].join(' '),
      })
    }
  }
}

function setRecalcNotificationId(recalcNotificationId) {
  return {
    type: Actions.RESOURCE_EDITOR_SET_RECALC_NOTIFICATION_ID,
    payload: recalcNotificationId,
  }
}

export default {
  getResourceTypes,
  getResourceManagers,
  loadResourceManager,
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
  saveArpuModels,
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
  setIsRrmManager,
  convertMetersToLengthUnits,
  convertlengthUnitsToMeters,
  setEditingMode,
  setRecalcState,
  setRecalcNotificationId,
  executeRecalc,
}
