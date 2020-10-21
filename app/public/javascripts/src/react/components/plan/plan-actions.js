import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'
import RfpActions from '../optimization/rfp/rfp-actions'
import SocketManager from '../../../react/common/socket-manager'
import RingEditActions from '../ring-edit/ring-edit-actions'
import NetworkOptimizationActions from '../optimization/network-optimization/network-optimization-actions'
import AroHttp from '../../common/aro-http'

function setActivePlanState (planState) {
  return {
    type: Actions.PLAN_SET_ACTIVE_PLAN_STATE,
    payload: planState
  }
}

// Loads a plan with the specified plan id from the server, then sets it as the active plan
function loadPlan (planId) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${planId}`)
      .then(result => dispatch(setActivePlan(result.data)))
      .catch(err => console.error(err))
  }
}

function manageLibrarySubscriptions (currentSelectedLibraryItems, newSelectedLibraryItems) {
  // Subscribe to events from any new library items, unsubscribe from any removed library items
  const currentSelectedLibraryIds = new Set(currentSelectedLibraryItems.map(libraryItem => libraryItem.identifier))
  const newSelectedLibraryIds = new Set(newSelectedLibraryItems.map(libraryItem => libraryItem.identifier))
  const subscriptionsToAdd = [...newSelectedLibraryIds].filter(item => !currentSelectedLibraryIds.has(item))
  const subscriptionsToDelete = [...currentSelectedLibraryIds].filter(item => !newSelectedLibraryIds.has(item))
  subscriptionsToDelete.forEach(libraryId => SocketManager.leaveRoom('library', libraryId))
  subscriptionsToAdd.forEach(libraryId => SocketManager.joinRoom('library', libraryId))
}

function loadPlanDataSelectionFromServer (planId) {
  return dispatch => {
    const promises = [
      AroHttp.get('/service/odata/datatypeentity'),
      AroHttp.get(`/service/v1/library-entry`),
      AroHttp.get(`/service/v1/plan/${planId}/configuration`)
    ]

    Promise.all(promises)
      .then((results) => {
        // Results will be returned in the same order as the promises array
        var dataTypeEntityResult = results[0].data
        var libraryResult = results[1].data
        var configurationResult = results[2].data

        var uploadDataSources = []
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          if (dataTypeEntity.uploadSupported) {
            dataTypeEntity.label = dataTypeEntity.description
            uploadDataSources.push(dataTypeEntity)
          }
        })

        var newDataItems = {}
        dataTypeEntityResult.forEach((dataTypeEntity) => {
          if (dataTypeEntity.maxValue > 0) {
            newDataItems[dataTypeEntity.name] = {
              id: dataTypeEntity.id,
              description: dataTypeEntity.description,
              minValue: dataTypeEntity.minValue,
              maxValue: dataTypeEntity.maxValue,
              uploadSupported: dataTypeEntity.uploadSupported,
              isMinValueSelectionValid: true,
              isMaxValueSelectionValid: true,
              selectedLibraryItems: [],
              allLibraryItems: [],
              proxyFor: dataTypeEntity.proxyFor || null
            }
          }
        })

        // For each data item, construct the list of all available library items
        Object.keys(newDataItems).forEach((dataItemKey) => {
          // Add the list of all library items for this data type
          libraryResult.forEach((libraryItem) => {
            if (libraryItem.dataType === dataItemKey) {
              newDataItems[dataItemKey].allLibraryItems.push(libraryItem)
            }
          })
          newDataItems[dataItemKey].allLibraryItems.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
        })

        // For each data item, construct the list of selected library items
        configurationResult.configurationItems.forEach((configurationItem) => {
          // For this configuration item, find the data item based on the dataType
          var dataItem = newDataItems[configurationItem.dataType]
          // Find the item from the allLibraryItems based on the library id
          var selectedLibraryItems = configurationItem.libraryItems
          selectedLibraryItems.forEach((selectedLibraryItem) => {
            var matchedLibraryItem = dataItem.allLibraryItems.filter((libraryItem) => libraryItem.identifier === selectedLibraryItem.identifier)
            dataItem.selectedLibraryItems = dataItem.selectedLibraryItems.concat(matchedLibraryItem) // Technically there will be only one matched item
          })
        })

        Object.keys(newDataItems).forEach(dataItemKey => {
          const dataItem = newDataItems[dataItemKey]
          manageLibrarySubscriptions([], dataItem.selectedLibraryItems)
        })

        dispatch({
          type: Actions.PLAN_SET_DATA_ITEMS,
          payload: {
            dataItems: newDataItems,
            uploadDataSources: uploadDataSources
          }
        })
      })
      .catch(err => console.error(err))
  }
}

// Set the currently active plan
function setActivePlan (plan) {
  return (dispatch, getState) => {
    getState().plan.activePlan && getState().plan.activePlan.id &&
      SocketManager.leaveRoom('plan', getState().plan.activePlan.id) // leave previous plan

    dispatch({
      type: Actions.PLAN_SET_ACTIVE_PLAN,
      payload: {
        plan: plan
      }
    })

    // Join room for this plan
    SocketManager.joinRoom('plan', plan.id)
    // Get current plan data items
    dispatch(loadPlanDataSelectionFromServer(plan.id))
    // Update details on the coverage report
    dispatch(CoverageActions.updateCoverageStatus(plan.id))
    // Clear plan target selection
    dispatch(SelectionActions.loadPlanTargetSelectionsFromServer(plan.id))
    // Clear RFP state
    dispatch(RfpActions.clearRfpState())
    // load optomize inputs
    dispatch(NetworkOptimizationActions.loadOptimizationInputs(plan.id))
    // load rings
    dispatch(RingEditActions.loadRings(plan.id))
    // load rings
    dispatch(loadPlanResourceSelectionFromServer(plan))
  }
}

function selectDataItems (dataItemKey, selectedLibraryItems) {
  return (dispatch, getState) => {
    manageLibrarySubscriptions(getState().plan.dataItems[dataItemKey].selectedLibraryItems, selectedLibraryItems)
    // Subscriptions taken care of, now set the state
    dispatch({
      type: Actions.PLAN_SET_SELECTED_DATA_ITEMS,
      payload: {
        dataItemKey,
        selectedLibraryItems
      }
    })
  }
}

function setAllLibraryItems (dataItemKey, allLibraryItems) {
  return {
    type: Actions.PLAN_SET_ALL_LIBRARY_ITEMS,
    payload: {
      dataItemKey,
      allLibraryItems
    }
  }
}

function setHaveDataItemsChanged (haveDataItemsChanged) {
  return {
    type: Actions.PLAN_SET_HAVE_DATA_ITEMS_CHANGED,
    payload: haveDataItemsChanged
  }
}

function deleteLibraryEntry (dataSource) {
  return (dispatch, getState) => {
    const state = getState()
    const dataType = dataSource.dataType
    const updatedLib = state.plan.dataItems[dataType].allLibraryItems.filter(item => item.identifier !== dataSource.identifier)
    AroHttp.delete(`/service/v1/library-entry/${dataSource.identifier}`)
      .then(() => {
        // wait for success before updating local state, keep in sync
        dispatch(setAllLibraryItems(dataType, updatedLib))
      })
      .catch((err) => console.error(err))
  }
}

 // Saves the plan Data Selection configuration to the server
 function saveDataSelectionToServer (plan, dataItems) {
  return dispatch => {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }
    Object.keys(dataItems).forEach(dataItemKey => {
      // An example of dataItemKey is 'location'
      if (dataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: dataItems[dataItemKey].selectedLibraryItems
        }
        putBody.configurationItems.push(configurationItem)
      }
    })

    // Save the configuration to the server
    AroHttp.put(`/service/v1/plan/${plan.id}/configuration`, putBody)
  }
}

function clearAllSelectedSA (plan, dataItems, selectedServiceAreas) {
  return dispatch => {
    // Get a list of selected service areas that are valid, given the (possibly) changed service area library selection
    const selectedServiceAreaLibraryId = dataItems.service_layer.selectedLibraryItems[0].identifier
    AroHttp.get(`/service_areas/${plan.id}/selectedServiceAreasInLibrary?libraryId=${selectedServiceAreaLibraryId}`)
      .then(result => {
        const validServiceAreas = new Set(result.data)
        var invalidServiceAreas = [...selectedServiceAreas].filter(serviceAreaId => !validServiceAreas.has(serviceAreaId))
        if (invalidServiceAreas.length > 0) {
          dispatch(SelectionActions.removePlanTargets(plan.id, { serviceAreas: new Set(invalidServiceAreas) }))
        }
      })
      .catch(err => console.error(err))
  }
}

// Resource Selection

function loadPlanResourceSelectionFromServer (plan) {
  return dispatch => {
    if (!plan) {
      return Promise.resolve()
    }
    var currentPlan = plan
    return Promise.all([
      AroHttp.get('/service/odata/resourcetypeentity'), // The types of resource managers
      AroHttp.get('/service/v2/resource-manager'),
      AroHttp.get(`/service/v1/plan/${currentPlan.id}/configuration`)
    ])
      .then((results) => {
        var resourceManagerTypes = results[0].data
        var allResourceManagers = results[1].data
        var selectedResourceManagers = results[2].data.resourceConfigItems

        var resourceManOrder = [
          'price_book',
          'arpu_manager',
          'roic_manager',
          'rate_reach_manager',
          'impedance_mapping_manager',
          'tsm_manager',
          'competition_manager',
          'fusion_manager',
          'network_architecture_manager',
          'planning_constraints_manager'
        ]

        // First set up the resource items so that we display all types in the UI
        var newResourceItems = {}
        resourceManagerTypes.forEach((resourceManager) => {
          if (!resourceManOrder.includes(resourceManager.name)) resourceManOrder.push(resourceManager.name)

          newResourceItems[resourceManager.name] = {
            id: resourceManager.id,
            description: resourceManager.description,
            allManagers: [],
            selectedManager: null,
            order: resourceManOrder.indexOf(resourceManager.name)
          }
        })

        // Then add all the managers in the system to the appropriate type
        allResourceManagers.forEach((resourceManager) => {
          // Once the backend supports the permission filtering on the odata API
          // or durinng the react migration  managerType - resourceType maping can 
          // be removed as managerType is used in many old Angular code
          resourceManager['managerType'] = resourceManager['resourceType']
          delete resourceManager['resourceType']
          if (!resourceManager.deleted) {
            newResourceItems[resourceManager.managerType].allManagers.push(resourceManager)
          }
          newResourceItems[resourceManager.managerType].allManagers.sort((a, b) => (a.name > b.name) ? 1 : -1)
        })
        
        // Then select the appropriate manager for each type
        selectedResourceManagers.forEach((selectedResourceManager) => {
          var allManagers = newResourceItems[selectedResourceManager.aroResourceType].allManagers
          var matchedManagers = allManagers.filter((item) => item.id === selectedResourceManager.resourceManagerId)
          if (matchedManagers.length === 1) {
            newResourceItems[selectedResourceManager.aroResourceType].selectedManager = matchedManagers[0]
          }
        })
        var resourceItems = newResourceItems;
        var pristineResourceItems = JSON.parse(JSON.stringify(resourceItems))
        dispatch({
          type: Actions.PLAN_SET_RESOURCE_ITEMS,
          payload: {
            resourceItems: resourceItems,
            pristineResourceItems: pristineResourceItems
          }
        })
        return Promise.resolve()
      })
      .catch((err) => console.error(err))
  }
}

  // Save the plan resource selections to the server
  function savePlanResourceSelectionToServer (plan, resourceItems) {
    return dispatch => {
        var putBody = {
          configurationItems: [],
          resourceConfigItems: []
        }

        Object.keys(resourceItems).forEach((resourceItemKey) => {
          var selectedManager = resourceItems[resourceItemKey].selectedManager
          if (selectedManager) {
            // We have a selected manager
            putBody.resourceConfigItems.push({
              aroResourceType: resourceItemKey,
              resourceManagerId: selectedManager.id,
              name: selectedManager.name,
              description: selectedManager.description
            })
          }
        })

        // Save the configuration to the server
        var currentPlan = plan
        AroHttp.put(`/service/v1/plan/${currentPlan.id}/configuration`, putBody)
      }
    }


function setIsResourceSelection (status){
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_IS_RESOURCE_SELECTION,
      payload: status
    })
  }
}

function setIsDataSelection (status){
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_IS_DATA_SELECTION,
      payload: status
    })
  }
}

function loadProjectConfig (userId, authPermissions) {
  return dispatch => {
    const filter = `deleted eq false and userId eq ${userId}`
    // const RESOUSRCE_READ = 4
    AroHttp.get(`/service/odata/userprojectentity?$select=id,name,permissions&$filter=${filter}&$orderby=name&$top=10000`)
      .then((result) => {
        let myProjects = []

        // loop through the project and find check the permission bits to see
        // if the current user has READ and ADMIN privilage to manage the resource
        for(let i = 0; i < result.data.length; i++) {
          const permissions = result.data[i].permissions
          const hasView = Boolean(permissions & authPermissions.RESOURCE_READ.permissionBits)
          if(hasView) {
            const hasAdmin = Boolean(permissions & authPermissions.RESOURCE_ADMIN.permissionBits)
            result.data[i].hasAdminPermission = hasAdmin
            myProjects.push(result.data[i])
          }
        }
          
        var allProjects = myProjects
        var parentProjectForNewProject = allProjects[0]
        
        dispatch({
          type: Actions.PLAN_SET_ALL_PROJECT,
          payload: {
            allProjects: allProjects,
            parentProjectForNewProject: parentProjectForNewProject
          }
        })
        return AroHttp.get(`/service/auth/users/${userId}/configuration`)
      })
      .then((result) => {
        var selectedProjectId = result.data.projectTemplateId
        dispatch({
          type: Actions.PLAN_SET_SELECTED_PROJECT_ID,
          payload: selectedProjectId
        })
      })
      .catch((err) => console.error(err))
  }
}

function createNewProject (projectName, parentProject, userId, authPermissions) {
  return dispatch => {
    AroHttp.post(`/service/v1/project-template`, { name: projectName, parentId: parentProject.id })
      .then(result => {
        dispatch(loadProjectConfig(userId, authPermissions))
        dispatch(setProjectMode('HOME'))
      })
      .catch(err => console.error(err))
  }
}

function deleteProjectConfig (project,userId, authPermissions) {
  return dispatch => {
    AroHttp.delete(`/service/v1/project-template/${project.id}`)
      .then(result => {
        dispatch(setIsDeleting(false))
        dispatch(loadProjectConfig(userId, authPermissions))
        dispatch(setProjectMode('HOME'))
      })
      .catch(err => console.error(err))
  }
}

function setIsDeleting (status){
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_IS_DELETING,
      payload: status
    })
  }
}

function setProjectMode (mode){
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_PROJECT_MODE,
      payload: mode
    })
  }
}

function planSettingsToProject (selectedProjectId, dataItems, resourceItems) {
  return dispatch => {
    // Making these calls in parallel causes a crash in aro-service. Call sequentially.
    return savePlanDataAndResourceSelectionToProject(selectedProjectId, dataItems, resourceItems)
      .then(() => {
        dispatch(setProjectMode('HOME'))
      })
      .catch((err) => console.error(err))
  }
}

  // Saves the plan Data Selection and Resource Selection to the project
 function savePlanDataAndResourceSelectionToProject (selectedProjectId, dataItems, resourceItems) {
    var putBody = {
      configurationItems: [],
      resourceConfigItems: []
    }

    Object.keys(dataItems).forEach((dataItemKey) => {
      // An example of dataItemKey is 'location'
      if (dataItems[dataItemKey].selectedLibraryItems.length > 0) {
        var configurationItem = {
          dataType: dataItemKey,
          libraryItems: dataItems[dataItemKey].selectedLibraryItems
        }
        putBody.configurationItems.push(configurationItem)
      }
    })

    Object.keys(resourceItems).forEach((resourceItemKey) => {
      var selectedManager = resourceItems[resourceItemKey].selectedManager
      if (selectedManager) {
        // We have a selected manager
        putBody.resourceConfigItems.push({
          aroResourceType: resourceItemKey,
          resourceManagerId: selectedManager.id,
          name: selectedManager.name,
          description: selectedManager.description
        })
      }
    })

    // Save the configuration to the project
    return AroHttp.put(`/service/v1/project-template/${selectedProjectId}/configuration`, putBody)
  }

  function updateDataSourceEditableStatus (isDataSourceEditable, dataSourceKey, loggedInUser, authPermissions, dataItems) {
    return dispatch => {
      isDataSourceEditable[dataSourceKey] = (dataSourceKey === 'location' || dataSourceKey === 'service_layer') && (dataItems[dataSourceKey].selectedLibraryItems.length === 1)
        if (isDataSourceEditable[dataSourceKey]) {
        // We still think this is editable, now check for ACL by making a call to service
        const libraryId = dataItems[dataSourceKey].selectedLibraryItems[0].identifier  // Guaranteed to have 1 selection at this point
        const dataSourceFilterString = `metaDataId eq ${libraryId}`
        const filterString = `${dataSourceFilterString} and userId eq ${loggedInUser.id}`
        AroHttp.get(`/service/odata/UserLibraryViewEntity?$select=dataSourceId,permissions&$filter=${filterString}&$top=1000`)
          .then(result => {
            const permissions = (result.data.length === 1) ? result.data[0].permissions : 0
            const hasWrite = Boolean(permissions & authPermissions.RESOURCE_WRITE.permissionBits)
            const hasAdmin = Boolean(permissions & authPermissions.RESOURCE_ADMIN.permissionBits)
            const hasResourceWorkflow = Boolean(permissions & authPermissions.RESOURCE_WORKFLOW.permissionBits)
            isDataSourceEditable[dataSourceKey] = hasWrite || hasAdmin || hasResourceWorkflow
            dispatch({
              type: Actions.PLAN_SET_IS_DATASOURCE_EDITABLE,
              payload: isDataSourceEditable
            })
        })
        .catch(err => console.error(err))
        }
    }
  }

  function setSelectedDisplayMode (value){
    return dispatch => {
      dispatch({
        type: Actions.PLAN_SET_SELECTED_DISPLAY_MODE,
        payload: value
      })
    }
  }

  function setActiveViewModePanel (value){
    return dispatch => {
      dispatch({
        type: Actions.PLAN_SET_ACTIVE_VIEW_MODE_PANEL,
        payload: value
      })
    }
  }

  function setParentProjectForNewProject (parentProjectForNewProject){
    return dispatch => {
      dispatch({
        type: Actions.PLAN_SET_PARENT_PROJECT_FOR_NEW_PROJECT,
        payload: parentProjectForNewProject
      })
    }
  }

  function setSelectedProjectId (selectedProjectId){
    return dispatch => {
      dispatch({
        type: Actions.PLAN_SET_SELECTED_PROJECT_ID,
        payload: selectedProjectId
      })
    }
  }

export default {
  setActivePlan,
  setActivePlanState,
  loadPlan,
  selectDataItems,
  setAllLibraryItems,
  setHaveDataItemsChanged,
  deleteLibraryEntry,
  saveDataSelectionToServer,
  clearAllSelectedSA,
  loadPlanResourceSelectionFromServer,
  savePlanResourceSelectionToServer,
  setIsResourceSelection,
  setIsDataSelection,
  loadProjectConfig,
  createNewProject,
  deleteProjectConfig,
  setIsDeleting,
  setProjectMode,
  planSettingsToProject,
  updateDataSourceEditableStatus,
  setSelectedDisplayMode,
  setActiveViewModePanel,
  setParentProjectForNewProject,
  setSelectedProjectId
}