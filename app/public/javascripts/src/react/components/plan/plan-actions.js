import { batch } from 'react-redux'
import Actions from '../../common/actions'
import CoverageActions from '../coverage/coverage-actions'
import SelectionActions from '../selection/selection-actions'
import RfpActions from '../optimization/rfp/rfp-actions'
import RfpStatusTypes from '../optimization/rfp/constants'
import { ClientSocketManager } from '../../common/client-sockets'
import PlanEditorActions from '../plan-editor/plan-editor-actions'
import RingEditActions from '../ring-edit/ring-edit-actions'
import NetworkOptimizationActions from '../optimization/network-optimization/network-optimization-actions'
import UserActions from '../user/user-actions'
import ToolBarActions from '../header/tool-bar-actions.js'
import AroHttp from '../../common/aro-http'
import fetch from 'cross-fetch'
import { Notifier } from '../../common/notifications'
import mapDataActions from '../common/tile-overlay/map-data-actions'
import RoicReportsActions from '../sidebar/analysis/roic-reports/roic-reports-actions'

function setActivePlanState (planState) {
  return dispatch => {
    if (planState === "COMPLETED" || planState === "FAILED") {
      dispatch(setActivePlanErrors())
    }

    dispatch({
      type: Actions.PLAN_SET_ACTIVE_PLAN_STATE,
      payload: planState
    })
  }
}

function setActivePlanErrors() {
  return (dispatch, getState) => {
    const state = getState()
    const activePlan = state.plan.activePlan
    AroHttp.get(`/service/v1/plan/${activePlan.id}/errors?user_id=${activePlan.createdBy}`)
      .then(({ data }) => {
        const activePlanErrors = {
          PRE_VALIDATION: {},
          NONE: {},
          CANCELLED: {},
          RUNTIME_EXCEPTION: {},
          ROOT_OPTIMIZATION_FAILURE: {}
        }

        data.forEach(error => {
          activePlanErrors[error.errorCategory][error.serviceAreaCode] = error.errorMessage
        })
        batch(() => {
          dispatch({
            type: Actions.PLAN_SET_ACTIVE_PLAN_ERRORS,
            payload: activePlanErrors,
          })
          dispatch(RoicReportsActions.loadROICResultsForPlan(activePlan.id))
        })
      })
  }
}

// Loads a plan with the specified plan id from the server, then sets it as the active plan
function loadPlan (planId) {
  return dispatch => {
    AroHttp.get(`/service/v1/plan/${planId}`)
      .then(result => dispatch(setActivePlan(result.data)))
      .catch(error => Notifier.error(error))
  }
}

function manageLibrarySubscriptions (currentSelectedLibraryItems, newSelectedLibraryItems) {
  // Subscribe to events from any new library items, unsubscribe from any removed library items
  const currentSelectedLibraryIds = new Set(currentSelectedLibraryItems.map(libraryItem => libraryItem.identifier))
  const newSelectedLibraryIds = new Set(newSelectedLibraryItems.map(libraryItem => libraryItem.identifier))
  const subscriptionsToAdd = [...newSelectedLibraryIds].filter(item => !currentSelectedLibraryIds.has(item))
  const subscriptionsToDelete = [...currentSelectedLibraryIds].filter(item => !newSelectedLibraryIds.has(item))
  subscriptionsToDelete.forEach(libraryId => ClientSocketManager.leaveRoom('library', libraryId))
  subscriptionsToAdd.forEach(libraryId => ClientSocketManager.joinRoom('library', libraryId))
}

function loadPlanDataSelectionFromServer (planId) {
  return dispatch => {
    // these should maybe be split up into seperate actions
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
              name: dataTypeEntity.name,
              description: dataTypeEntity.description,
              minValue: dataTypeEntity.name === "equipment" ? 1 : dataTypeEntity.minValue,
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
      .catch(error => Notifier.error(error))
  }
}

// Set the currently active plan
function setActivePlan (plan) {
  return (dispatch, getState) => {
    getState().plan.activePlan && getState().plan.activePlan.id &&
      ClientSocketManager.leaveRoom('plan', getState().plan.activePlan.id) // leave previous plan
    batch(() => {
      dispatch(mapDataActions.clearAllSubnetTileData())
      dispatch({
        type: Actions.PLAN_SET_ACTIVE_PLAN,
        payload: {
          plan: plan
        }
      })
      dispatch({
        type: Actions.NETWORK_OPTIMIZATION_SET_ACTIVE_FILTERS,
        payload: []
      })
    })

    // clear any old plan edit data 
    dispatch(PlanEditorActions.clearTransaction(false))
    // Join room for this plan
    ClientSocketManager.joinRoom('plan', plan.id)
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
    // load errors
    dispatch(setActivePlanErrors())
    // load project id to user and base plan
    dispatch(setSelectedProjectId(plan.projectId))

    if (plan.planType === 'RFP') {
      dispatch({
        type: Actions.RFP_SET_STATUS,
        payload: RfpStatusTypes.FINISHED
      })
    }
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
      .catch(error => Notifier.error(error))
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
      .catch(error => Notifier.error(error))
  }
}

// Resource Selection

function loadPlanResourceSelectionFromServer (plan) {
  return (dispatch, getState) => {
    const state = getState()
    if (!plan) {
      plan = state.plan.activePlan
      if (!plan.id) return Promise.resolve()
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
        var resourceItems = newResourceItems
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
      .catch(error => Notifier.error(error))
  }
}

// Save the plan configuration selections to the server
function savePlanConfiguration(plan, dataItems, resourceItems) {
  return (dispatch, getState) => {

    // to update pristineResourceItems
    const state = getState()
    dispatch({
      type: Actions.PLAN_SET_RESOURCE_ITEMS,
      payload: {
        resourceItems: state.plan.resourceItems,
        pristineResourceItems: state.plan.resourceItems
      }
    })

    if (!dataItems) dataItems = state.plan.dataItems
    if (!resourceItems) resourceItems = state.plan.resourceItems
    let putBody = {
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

    Object.keys(resourceItems).forEach((resourceItemKey) => {
      let selectedManager = resourceItems[resourceItemKey].selectedManager
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
    AroHttp.put(`/service/v1/plan/${plan.id}/configuration`, putBody)
  }
}

function setIsResourceSelection (status) {
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_IS_RESOURCE_SELECTION,
      payload: status
    })
  }
}

function setIsDataSelection (status) {
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
          
        const allProjects = myProjects
        const parentProjectForNewProject = allProjects[0]
        
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
        const selectedProjectId = result.data.projectTemplateId
        dispatch(setSelectedProjectId(selectedProjectId))
      })
      .catch(error => Notifier.error(error))
  }
}

function createNewProject (projectName, parentProject, userId, authPermissions) {
  return dispatch => {
    AroHttp.post(`/service/v1/project-template`, { name: projectName, parentId: parentProject.id })
      .then(result => {
        dispatch(loadProjectConfig(userId, authPermissions))
        dispatch(setProjectMode('HOME'))
      })
      .catch(error => Notifier.error(error))
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
      .catch(error => Notifier.error(error))
  }
}

function setIsDeleting (status) {
  return dispatch => {
    dispatch({
      type: Actions.PLAN_SET_IS_DELETING,
      payload: status
    })
  }
}

function setProjectMode (mode) {
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
      .catch(error => Notifier.error(error))
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
      .catch(error => Notifier.error(error))
    }
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
    dispatch(UserActions.setLoggedInUserProjectId(selectedProjectId))
  }
}

function updateDefaultPlanCoordinates (payload) {
  return {
    type: Actions.PLAN_UPDATE_DEFAULT_PLAN_COORDINATES,
    payload: payload,
  }
}

function loadLibraryEntryById (libraryId) {
  return (dispatch, getState) => {
    const state = getState()
    // technically we shouldn't be using state.user, perhaps make this a parameter
    AroHttp.get(`/service/v1/library-entry/${libraryId}?user_id=${state.user.loggedInUser.id}`)
      .then((result) => {
        dispatch({
          type: Actions.PLAN_APPEND_ALL_LIBRARY_ITEMS,
          payload: {
            dataItemKey: result.data.dataType,
            allLibraryItems: [result.data]
          }
        })
      })
      .catch(error => Notifier.error(error))
  }
}

function deletePlan (plan) {
  return (dispatch) => {
    if (!plan) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      swal({
        title: 'Are you sure?',
        text: 'You will not be able to recover the deleted plan!',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Yes, delete it!',
        showCancelButton: true,
        closeOnConfirm: true
      }, (deletePlan) => {
        if (deletePlan) {
          AroHttp.delete(`/service/v1/plan/${plan.id}`)
            .then((response) => {
              resolve()
              return dispatch(getOrCreateEphemeralPlan())
            })
            .then((ephemeralPlan) => dispatch(setActivePlan(ephemeralPlan.data)))
            .catch(error => {
              Notifier.error(error)
              reject(error)
            })
        } else {
          resolve()
        }
      })
    })
  }
}

 // Gets the last ephemeral plan in use, or creates a new one if no ephemeral plan exists.
function getOrCreateEphemeralPlan () {
  return (dispatch, getState) => {
    return AroHttp.get(`/service/v1/plan/ephemeral/latest`)
      .then((result) => {
        // We have a valid ephemeral plan if we get back an object with *some* properties
        // When there is no plan API return empty string instead of empty object, Hence this method Object.getOwnPropertyNames(result.data).length always return 1
        var isValidEphemeralPlan = result.data ? true : false
        if (isValidEphemeralPlan) {
          // We have a valid ephemeral plan. Return it.
          return Promise.resolve(result)
        } else {
          // We dont have an ephemeral plan. Create one and send it back
          return dispatch(ToolBarActions.createNewPlan(true))
        }
      })
  }
}

function editActivePlan (plan) {
  return {
    type: Actions.PLAN_EDIT_ACTIVE_PLAN,
    payload: plan
  }
}

// TODO: see https://www.pivotaltracker.com/n/projects/2468285/stories/182441351
// NOT an action, this needs to move elsewhere
function exportPlan (userId, planId, filename) {
  let payload = {
    "inlcudeLinkedResources": true,
    "planIds": [planId],
    "projectIds": [],
    "resourceIds": [],
  }
  AroHttp.post(`/service/v1/export-svc/export-plan-data.zip?user_id=${userId}`, payload, true)
  .then(rawResult => {
    saveAs(new Blob([rawResult]), filename)
  })
  .catch(error => {
    Notifier.error(error)
  })
}

// TODO: see https://www.pivotaltracker.com/n/projects/2468285/stories/182441351
// only sort of an action, this needs to move elsewhere
function importPlan (userId, file) {
  return (dispatch) => {
    if (!file) return Promise.resolve()
    var formData = new FormData()
    formData.append('file', file)
    const url = `/uploadservice/v1/export-svc/import-plan-data?user_id=${userId}&as_new=true`
    dispatch({
      type: Actions.PLAN_SET_UPLOAD_NAME,
      payload: file.name,
    })
    AroHttp.postRaw(url, formData)
    .then(response => {
      dispatch({
        type: Actions.PLAN_SET_UPLOAD_NAME,
        payload: null,
      })
    })
    .catch(error => {
      Notifier.error(error)
      dispatch({
        type: Actions.PLAN_SET_UPLOAD_NAME,
        payload: null,
      })
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
  clearAllSelectedSA,
  loadPlanResourceSelectionFromServer,
  savePlanConfiguration,
  setIsResourceSelection,
  setIsDataSelection,
  loadProjectConfig,
  createNewProject,
  deleteProjectConfig,
  setIsDeleting,
  setProjectMode,
  planSettingsToProject,
  updateDataSourceEditableStatus,
  setParentProjectForNewProject,
  setSelectedProjectId,
  updateDefaultPlanCoordinates,
  loadLibraryEntryById,
  deletePlan,
  getOrCreateEphemeralPlan,
  editActivePlan,
  setActivePlanErrors,

  // TODO: move this. see https://www.pivotaltracker.com/n/projects/2468285/stories/182441351
  exportPlan,
  // TODO: move this. see https://www.pivotaltracker.com/n/projects/2468285/stories/182441351
  importPlan,
}
