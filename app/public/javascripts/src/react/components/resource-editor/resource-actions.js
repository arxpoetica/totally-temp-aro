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

  function setIsResourceEditor () {
    return dispatch => {
      dispatch({
        type: Actions.RESOURCE_EDITOR_IS_RESOURCE_EDITOR
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

  // Price-Book

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
        priceStrategy : priceBook.strategy,
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
      .then(result => dispatch(
        getResourceManagers('price_book')
      ))
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
        return getDefaultConfiguration(loggedInUser)
      })
      .then((defaultConfiguration) => AroHttp.put(`/service/rate-reach-matrix/resource/${createdRateReachManager.id}/config`, defaultConfiguration))
      .then(result => dispatch(
        getResourceManagers('rate_reach_manager')
      ))
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

  export default {
    getResourceTypes,
    getResourceManagers,
    nextOrPrevPageClick,
    searchManagers,
    canMakeNewFilter,
    setIsResourceEditor,
    getPriceBookStrategy,
    createPriceBook,
    createRateReachManager,
    deleteResourceManager,
    loadArpuManagerConfiguration,
    saveConfigurationToServer,
    setArpuStrategy,
    setArpuRevenue
  }