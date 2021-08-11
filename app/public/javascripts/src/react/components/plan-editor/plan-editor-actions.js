import Actions from '../../common/actions'
import TransactionManager from './transaction-manager'
import Transaction from './transaction'
import AroHttp from '../../common/aro-http'
import MenuItemFeature from '../context-menu/menu-item-feature'
import MenuItemAction from '../context-menu/menu-item-action'
import ContextMenuActions from '../context-menu/actions'
import ResourceActions from '../resource-editor/resource-actions'
//import SelectionActions from '../selection/selection-actions'
import { batch } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import PlanEditorSelectors from './plan-editor-selectors.js'

function resumeOrCreateTransaction (planId, userId) {
  return (dispatch, getState) => {
    const state = getState()
    dispatch({
      type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
      payload: true
    })
    TransactionManager.resumeOrCreateTransaction(planId, userId)
      .then(result => {
        dispatch({
          type: Actions.PLAN_EDITOR_SET_TRANSACTION,
          payload: Transaction.fromServiceObject(result.data)
        })
        const transactionId = result.data.id
        return Promise.all([
          AroHttp.get(`/service/plan-transactions/${transactionId}/transaction-features/equipment`),
          // depricated? 
          AroHttp.get(`/service/plan-transactions/${transactionId}/transaction-features/equipment_boundary`),
          // need to get ALL the subnets upfront 
          //AroHttp.get(`/service/plan-transaction/${transactionId}/subnet-refs`),
        ])
      })
      .then(results => {
        let equipmentList = results[0].data
        let boundaryList = results[1].data
        //let subnetRefList = results[2].data

        const resource = 'network_architecture_manager'
        const { id, name } = state.plan.resourceItems[resource].selectedManager
        /*
        let subnetIds = []
        subnetRefList.forEach(subnetRef => {
          subnetIds.push(subnetRef.node.id)
        })
        */
        batch(() => {
          // NOTE: need to load resource manager so drop cable
          // length is available for plan-editor-selectors
          dispatch(ResourceActions.loadResourceManager(id, resource, name))
          dispatch(addTransactionFeatures(equipmentList))
          dispatch(addTransactionFeatures(boundaryList))

          //dispatch(addSubnets(subnetIds))

          dispatch({
            type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
            payload: false
          })
        })
      })
      .catch(err => {
        console.error(err)
        dispatch({
          type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
          payload: false
        })
      })
  }
}

function clearTransaction () {
  return dispatch => {
    dispatch({ type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION })
    dispatch({
      type: Actions.SELECTION_SET_PLAN_EDITOR_FEATURES, // DEPRICATED
      payload: []
    })
    batch(() => {
      dispatch(setIsCommittingTransaction(false))
      dispatch({
        type: Actions.PLAN_EDITOR_CLEAR_SUBNETS,
      })
      dispatch({
        type: Actions.PLAN_EDITOR_CLEAR_FEATURES,
      })
      dispatch({
        type: Actions.TOOL_BAR_SET_SELECTED_DISPLAY_MODE,
        payload: 'VIEW', // ToDo: globalize the constants in tool-bar including displayModes
      })
    })
  }
}

// ToDo: there's only one transaction don't require the ID
function commitTransaction (transactionId) {
  return dispatch => {
    return dispatch(recalculateSubnets(transactionId))
      .then(() => {
        dispatch(setIsCommittingTransaction(true))
        return AroHttp.put(`/service/plan-transactions/${transactionId}`)
          .then(() => dispatch(clearTransaction()))
          .catch(err => {
            console.error(err)
            dispatch(clearTransaction())
          })
      })
  }
}

// ToDo: there's only one transaction don't require the ID
function discardTransaction (transactionId) {
  return dispatch => {
    dispatch(setIsCommittingTransaction(true))
    TransactionManager.discardTransaction(transactionId)
      .then(() => dispatch(clearTransaction()))
      .catch(err => {
        console.error(err)
        dispatch(clearTransaction())
      })
  }
}

function createFeature (feature) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    
    const body = {
      commands: [{
        childId: feature,
        type: 'add', 
      }]
    }

    AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        let updatedSubnets = JSON.parse(JSON.stringify(state.planEditor.subnets))
        const newFeatures = {}
        // the subnet and equipment updates are not connected, right now we get back two arrays
        // For now I am assuming the relevent subnet is the one with type 'modified'
        // TODO: handle there being multiple updated subnets

        if (result.data.subnetUpdates.length === 1 || result.data.subnetUpdates.length === 2 && result.data.equipmentUpdates) {
          const modifiedSubnet = result.data.subnetUpdates.find(subnet => subnet.type === 'modified')
          const subnetId = modifiedSubnet.subnet.id
          
          result.data.equipmentUpdates.forEach(equipment => {
            const feature = parseSubnetFeature(equipment.subnetNode)

            newFeatures[feature.objectId] = {
              feature: feature,
              subnetId: subnetId,
            }

            if (updatedSubnets[subnetId]) {
              updatedSubnets[subnetId].children.push(feature.objectId)
            }
          })

          batch(() => {
            dispatch({
              type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
              payload: newFeatures,
            }),
            dispatch({
              type: Actions.PLAN_EDITOR_ADD_SUBNETS,
              payload: updatedSubnets,
            })
          })
      }
      })
      .catch(err => console.error(err))
  }
}

//TODO: depricate
function modifyFeature (featureType, feature) {
  console.log('modifyFeature should be depricated')
  // ToDo: this causes an error if you edit a new feature that has yet to be sent to service
  //  everything still functions but it's bad form
  // ToDo: figure out POST / PUT perhaps one function 
  //  that determines weather to add (the potentially "modified") feature
  //  or modifiy the feature if it's already been added to the transaction
  //  basically we need service to overwrite or if not present, make 
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    // Do a PUT to send the equipment over to service
    return AroHttp.put(`/service/plan-transactions/${transactionId}/modified-features/${featureType}`, feature.feature)
      .then(result => {
        // Decorate the created feature with some default values
        let crudAction = feature.crudAction || 'read'
        if (crudAction === 'read') crudAction = 'update'
        const newFeature = {
          ...feature,
          crudAction: crudAction,
          feature: result.data
        }
        dispatch({
          type: Actions.PLAN_EDITOR_MODIFY_FEATURES,
          payload: [newFeature]
        })
        return Promise.resolve()
      })
      .catch(err => console.error(err))
  }
}

function updateFeatureProperties (feature) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    let featureEntry = state.planEditor.features[feature.objectId]
    // Do a PUT to send the equipment over to service
    return AroHttp.put(`/service/plan-transaction/${transactionId}/subnet-equipment`, feature)
      .then(result => {
        // Decorate the created feature with some default values
        let crudAction = featureEntry.crudAction || 'read'
        if (crudAction === 'read') crudAction = 'update'
        const newFeatureEntry = {
          ...featureEntry,
          crudAction: crudAction,
          feature: result.data,//feature,
        }
        dispatch({
          type: Actions.PLAN_EDITOR_MODIFY_FEATURES,
          payload: [newFeatureEntry]
        })
        return Promise.resolve()
      })
      .catch(err => console.error(err))
  }
}

// ToDo: there's only one transaction don't require the ID
// TODO: cleanup?
function deleteTransactionFeature (transactionId, featureType, transactionFeatureId) {
  return dispatch => {
    return AroHttp.delete(`/service/plan-transactions/${transactionId}/modified-features/${featureType}/${transactionFeatureId}`)
      .then(result => dispatch({
        type: Actions.PLAN_EDITOR_DELETE_TRANSACTION_FEATURE,
        payload: transactionFeatureId
      }))
      .catch(err => console.error(err))
  }
}

function addTransactionFeatures (features) {
  return {
    type: Actions.PLAN_EDITOR_ADD_FEATURES,
    payload: features
  }
}

function showContextMenuForEquipment (featureId, x, y) {
  return (dispatch) => {
    // debugger
    var menuActions = []
    menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteFeature', featureId))
    const menuItemFeature = new MenuItemFeature('EQUIPMENT', 'Equipment', menuActions)
    // Show context menu
    dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
    dispatch(ContextMenuActions.showContextMenu(x, y))
  }
}

function showContextMenuForLocations (featureIds, event) {
  return (dispatch, getState) => {
    const state = getState()
    const selectedSubnetId = state.planEditor.selectedSubnetId
    if (featureIds.length > 0
      && state.planEditor.subnetFeatures[selectedSubnetId] 
      && state.planEditor.subnetFeatures[selectedSubnetId].feature.dropLinks
    ) {
      let subnetId = state.planEditor.subnetFeatures[selectedSubnetId].subnetId
      // we have locations AND the active feature has drop links
      const selectedSubnetLocations = PlanEditorSelectors.getSelectedSubnetLocations(state)
      const coords = WktUtils.getXYFromEvent(event)
      var menuItemFeatures = []
      featureIds.forEach(location => {
        let id = location.object_id
        var menuActions = []
        if (selectedSubnetLocations[id]) {
          // this location is a part of the selected FDT
          menuActions.push(new MenuItemAction('REMOVE', 'Unassign from terminal', 'PlanEditorActions', 'unassignLocation', id, selectedSubnetId))
        } else {
          // check that the location is part of the same subnet as the FDT
          if (state.planEditor.subnets[subnetId]
            && state.planEditor.subnets[subnetId].subnetLocationsById[id])
          {
            menuActions.push(new MenuItemAction('ADD', 'Assign to terminal', 'PlanEditorActions', 'assignLocation', id, selectedSubnetId))
          }
        }
        if (menuActions.length > 0) {
          menuItemFeatures.push(new MenuItemFeature('LOCATION', 'Location', menuActions))
        }
      })

      // Show context menu
      if (menuItemFeatures.length > 0) {
        dispatch(ContextMenuActions.setContextMenuItems(menuItemFeatures))
        dispatch(ContextMenuActions.showContextMenu(coords.x, coords.y))
      } else {
        return null
      }
    } else {
      return null
    }
  }
}

// helper
function _updateSubnetFeatures (subnetFeatures) {
  return (dispatch, getState) => {
    const state = getState()
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    let commands = []
    let subnetFeaturesById = {}
    let subnetIds = []
    subnetFeatures.forEach(subnetFeature => {
      subnetFeaturesById[subnetFeature.feature.objectId] = subnetFeature
      let subnetId = subnetFeature.subnetId
      subnetIds.push(subnetId)
      commands.push(
        {
          childId: unparseSubnetFeature(subnetFeature.feature),
          subnetId: subnetId, // parent subnet id, don't add when `type: 'add'`
          type: 'update', // `add`, `update`, or `delete`
        }
      )
    })
    
    if (!transactionId || commands.length <= 0) return null

    const body = {commands}
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        //console.log(result) // we do NOT get the child feature back in the result
        
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: subnetFeaturesById,
        })
        dispatch(recalculateSubnets(transactionId, subnetIds))
        
      })
      .catch(err => console.error(err))
  }
}

// helper
function _spliceLocationFromTerminal (state, locationId, terminalId) {
  let subnetFeature = state.planEditor.subnetFeatures[terminalId]
  subnetFeature = JSON.parse(JSON.stringify(subnetFeature))
  
  let index = subnetFeature.feature.dropLinks.findIndex(dropLink => {
    //planEditor.subnetFeatures["0c9e9415-e5e2-4146-9594-bb3057ca54dc"].feature.dropLinks[0].locationLinks[0].locationId
    return (0 <= dropLink.locationLinks.findIndex(locationLink => {
      return (locationId === locationLink.locationId)
    }))
  })
  
  if (index !== -1) {
    subnetFeature.feature.dropLinks.splice(index, 1)
    return subnetFeature
  } else {
    return null
  }
}

function unassignLocation (locationId, terminalId) {
  return (dispatch, getState) => {
    const state = getState()
    let subnetFeature = _spliceLocationFromTerminal(state, locationId, terminalId)
    if (subnetFeature) {
      return dispatch(_updateSubnetFeatures([subnetFeature]))
    } else {
      return null
    }
  }
}

function assignLocation (locationId, terminalId) {
  return (dispatch, getState) => {
    const state = getState()
    let features = []

    let toFeature = state.planEditor.subnetFeatures[terminalId]
    toFeature = JSON.parse(JSON.stringify(toFeature))
    let subnetId = toFeature.subnetId

    // unassign location
    let fromTerminalId = state.planEditor.subnets[subnetId].subnetLocationsById[locationId].parentEquipmentId
    let fromFeature = _spliceLocationFromTerminal(state, locationId, fromTerminalId)
    if (fromFeature) features.push(fromFeature)

    // assign location
    let defaultDropLink = {
      dropCableLength: 0, // ?
      locationLinks: [
        {
          locationId: locationId,
          atomicUnits: 1, // ?
          arpu: 50, // ?
          penetration: 1, // ?
        }
      ]
    }

    toFeature.feature.dropLinks.push(defaultDropLink)
    features.push(toFeature)

    return dispatch(_updateSubnetFeatures(features))
  }
}

function showContextMenuForEquipmentBoundary (equipmentObjectId, x, y) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    
    var menuActions = []
    menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteTransactionFeature', transactionId, 'equipment_boundary', equipmentObjectId))
    const menuItemFeature = new MenuItemFeature('BOUNDARY', 'Equipment Boundary', menuActions)
    // Show context menu
    dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
    dispatch(ContextMenuActions.showContextMenu(x, y))
  }
}
/*
function viewFeatureProperties (featureType, planId, objectId, transactionFeatures) {
  return dispatch => {
    var equipmentPromise = null
    if (transactionFeatures[objectId]) {
      equipmentPromise = Promise.resolve()
    } else {
      equipmentPromise = AroHttp.get(`/service/plan-feature/${planId}/${featureType}/${objectId}`)
        .then(result => {
          // Decorate the equipment with some default values. Technically this is not yet "created" equipment
          // but will have to do for now.
          const createdEquipment = {
            crudAction: 'read',
            deleted: false,
            valid: true,
            feature: result.data
          }
          return dispatch(addTransactionFeatures([createdEquipment]))
        })
    }
    // At this point we are guaranteed to have a created equipment object
    equipmentPromise
      .then(result => dispatch(SelectionActions.setPlanEditorFeatures([objectId])))
      .catch(err => console.error(err))
  }
}
*/
function startDrawingBoundaryFor (equipmentObjectId) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR,
    payload: equipmentObjectId
  }
}

function stopDrawingBoundary () {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_DRAWING_BOUNDARY_FOR,
    payload: null
  }
}

// does this need to be it's own function? it's only used in the recalc subnets function
function setIsCalculatingSubnets (isCalculatingSubnets) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS,
    payload: isCalculatingSubnets
  }
}

// does this need to be it's own function? it's only used in the recalc boundary function
function setIsCalculatingBoundary (isCalculatingBoundary) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CALCULATING_BOUNDARY,
    payload: isCalculatingBoundary
  }
}

function setIsCreatingObject (isCreatingObject) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CREATING_OBJECT,
    payload: isCreatingObject
  }
}

function setIsModifyingObject (isModifyingObject) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_MODIFYING_OBJECT,
    payload: isModifyingObject
  }
}

function setIsDraggingFeatureForDrop (isDraggingFeatureForDrop) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_DRAGGING_FEATURE_FOR_DROP,
    payload: isDraggingFeatureForDrop
  }
}

function setIsEditingFeatureProperties (isEditingFeatureProperties) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_EDITING_FEATURE_PROPERTIES,
    payload: isEditingFeatureProperties
  }
}

function setIsCommittingTransaction (isCommittingTransaction) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_COMMITTING_TRANSACTION,
    payload: isCommittingTransaction
  }
}

function setIsEnteringTransaction (isEnteringTransaction) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
    payload: isEnteringTransaction
  }
}

function moveFeature (featureId, coordinates) {
  return (dispatch, getState) => {
    const state = getState()
    let subnetFeature = state.planEditor.subnetFeatures[featureId]
    subnetFeature = JSON.parse(JSON.stringify(subnetFeature))
    let subnetId = subnetFeature.subnetId
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    
    subnetFeature.feature.geometry.coordinates = coordinates
    const body = {
      commands: [{
        // `childId` is one of the children nodes of the subnets
        // service need to change this to "childNode"
        childId: unparseSubnetFeature(subnetFeature.feature),
        subnetId: subnetId, // parent subnet id, don't add when `type: 'add'`
        type: 'update', // `add`, `update`, or `delete`
      }]
    }
    // TODO: this is VERY similar to code above, use _updateSubnetFeatures?
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: {[featureId]: subnetFeature}
        })
      })
      .catch(err => console.error(err))
  }
}

function deleteFeature (featureId) {
  return (dispatch, getState) => {
    const state = getState()

    let subnetFeature = state.planEditor.subnetFeatures[featureId]
    subnetFeature = JSON.parse(JSON.stringify(subnetFeature))
    let subnetId = subnetFeature.subnetId
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    const body = {
      commands: [{
        childId: unparseSubnetFeature(subnetFeature.feature),
        subnetId, // parent subnet id, don't add when `type: 'add'`
        type: 'delete',
      }]
    }

    // Do a PUT to send the equipment over to service
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        const hiddenFeatures = []
        hiddenFeatures.push(featureId)

        // TODO: do those children need to be collected and sent to service to be fully removed?
        if (subnetFeature.feature.networkNodeType === "central_office" ||
         subnetFeature.feature.networkNodeType === "fiber_distribution_hub") {

          // pull ids of children to add them to hidden feaures in state
          state.planEditor.subnets[featureId].children.forEach(childId => {
            hiddenFeatures.push(childId)
          })
          
        }
        batch(() => {
          dispatch({
          type: Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE,
            payload: featureId
          })
          dispatch({
            type: Actions.PLAN_EDITOR_SET_HIDDEN_FEATURES,
            payload: hiddenFeatures
          })
          dispatch({
            type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE,
            payload: featureId,
          })
          dispatch(recalculateSubnets(transactionId))
        })
      })
      .catch(err => console.error(err))
  }
}

function readFeatures (featureIds) {
  return (dispatch, getState) => {
    const state = getState()
    let featuresToGet = []
    featureIds.forEach(featureId => {
      if (!state.planEditor.features[featureId]) {
        featuresToGet.push(featureId)
      }
    })
    let retrievedIds = []
    let promises = [Promise.resolve()]
    let retrievedFeatures = []
    featuresToGet.forEach(featureId => {
      promises.push(
        AroHttp.get(`/service/plan-feature/${state.plan.activePlan.id}/equipment/${featureId}`)
          .then(result => {
            if (result.data) {
              // Decorate the equipment with some default values. Technically this is not yet "created" equipment
              // but will have to do for now.
              retrievedIds.push(featureId)
              retrievedFeatures.push({
                crudAction: 'read',
                deleted: false,
                valid: true,
                feature: result.data
              })
              //return dispatch(addTransactionFeatures([createdEquipment]))
            }
          })
          .catch(err => console.error(err))
      )
    })
    return Promise.all(promises)
      .then(() => {
        return dispatch(addTransactionFeatures(retrievedFeatures))
      })
      .then(() => {
        Promise.resolve(retrievedIds)
      })
  }
}

function selectEditFeaturesById (featureIds) {
  return (dispatch, getState) => {
    dispatch(readFeatures(featureIds))
      .then(retrievedIds => {
        // we should have all of our features in state at this point (all valid features that is)
        let state = getState()
        let validFeatures = []
        let subnetFeatures = []
        featureIds.forEach(featureId => {
          if (state.planEditor.features[featureId]) { 
            validFeatures.push(featureId) 
            /*
            let networkNodeType = state.planEditor.features[featureId].feature.networkNodeType
            // TODO: do other networkNodeTypes have subnets?
            if (networkNodeType === "central_office"
              || networkNodeType === "fiber_distribution_hub"
            ) {
              subnetFeatures.push(featureId)
            }
            */
          }
        })
        batch(() => {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS, 
            payload: validFeatures,
          })
          // later we may highlight more than one subnet
          //dispatch(setSelectedSubnetId(subnetFeatures[0]))
          dispatch(setSelectedSubnetId(validFeatures[0]))
        })
      })
  }
}

function deselectEditFeatureById (objectId) {
  return {
    type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE,
    payload: objectId,
  }
}

function addSubnets (subnetIds) {
  // TODO: I (BRIAN) needs to refactor this, it works for the moment but does a lot of extranious things
  //  ALSO there is a "bug" where if we select an FDT before selecting the CO or one of the hubs, we get no info
  //  to fix this we need to find out what subnet the FDT is a part of and run that through here
  return (dispatch, getState) => {

    const { transaction, subnets: cachedSubnets, requestedSubnetIds, features, subnetFeatures} = getState().planEditor

    // this little dance only fetches uncached subnets
    const cachedSubnetIds = Object.keys(cachedSubnets).concat(requestedSubnetIds)
    let uncachedSubnetIds = subnetIds.filter(id => !cachedSubnetIds.includes(id))
    
    // we have everything, no need to query service
    if (uncachedSubnetIds.length <= 0) return Promise.resolve(subnetIds)

    // pull out any ids that are not subnets
    let validPsudoSubnets = []
    uncachedSubnetIds = uncachedSubnetIds.filter(id => {
      if (!features[id]) return true // unknown so we'll try it
      let networkNodeType = features[id].feature.networkNodeType
      // TODO: do other networkNodeTypes have subnets?
      //  how would we know? solve that
      if (networkNodeType === "central_office"
        || networkNodeType === "fiber_distribution_hub"
      ) {
        return true
      } else {
        if (subnetFeatures[id]) validPsudoSubnets.push(id)
        return false
      }
    })

    // the selected ID isn't a subnet persay so don't query for it
    // TODO: we need to fix this selection discrepancy
    if (uncachedSubnetIds.length <= 0) {
      // is the FDT in state? If so we can select it
      if (validPsudoSubnets.length > 0) {
        return Promise.resolve(validPsudoSubnets)
      } else {
        // if not we can't
        return Promise.resolve()
      }
    }

    /*
    dispatch({
      type: Actions.PLAN_EDITOR_ADD_REQUESTED_SUBNET_IDS,
      payload: uncachedSubnetIds,
    })
    */
    
    let command = {
      cmdType: 'QUERY_SUBNET_TREE', //"QUERY_SELECTED_SUBNETS",
      subnetIds: uncachedSubnetIds,
    }
    // should we rename that now that we are using it for retreiving subnets as well?
    dispatch(setIsCalculatingSubnets(true))
    return AroHttp.post(`/service/plan-transaction/${transaction.id}/subnet_cmd/query-subnets`, command)
      .then(result => {
        let apiSubnets = result.data.filter(x => x)
        let fiberApiPromises = []
        apiSubnets.forEach(subnet => {
          // subnet could be null (don't ask me)
          const subnetId = subnet.subnetId.id
          fiberApiPromises.push(AroHttp.get(`/service/plan-transaction/${transaction.id}/subnetfeature/${subnetId}`)
            .then(fiberResult => {
              subnet.fiber = fiberResult.data
            })
          )
        })
    
        return Promise.all(fiberApiPromises)
          .then(() => {
            
            /*
            dispatch({
              type: Actions.PLAN_EDITOR_REMOVE_REQUESTED_SUBNET_IDS,
              payload: uncachedSubnetIds,
            })
            */
            //return dispatch(parseAddApiSubnets(apiSubnets))
            //  .then(() => Promise.resolve(apiSubnets))
            dispatch(setIsCalculatingSubnets(false))
            return new Promise((resolve, reject) => {
              dispatch(parseAddApiSubnets(apiSubnets))
              resolve(subnetIds)
            })
          })
          .catch(err => {
            console.error(err)
            /*
            dispatch({
              type: Actions.PLAN_EDITOR_REMOVE_REQUESTED_SUBNET_IDS,
              payload: uncachedSubnetIds,
            })
            */
            dispatch(setIsCalculatingSubnets(false))
            return Promise.reject()
          })
      }).catch(err => {
        console.error(err)
        dispatch(setIsCalculatingSubnets(false))
        return Promise.reject()
      })
  }
}

function addSubnetTreeByLatLng (latLng) {
  return (dispatch, getState) => {
    const state = getState()
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    // TODO: we should make a call on standardization
    //  do we pass around the latLng object or the actual values 
    let command = {
      cmdType: "QUERY_CO_SUBNET",
      point:{
        type: "Point",
        coordinates: [latLng.lng(), latLng.lat()],
      }
    }
    dispatch(setIsCalculatingSubnets(true))
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/query-subnets`, command)
      .then(result => {
        let rootId = null
        if (result.data 
          && result.data[0] 
          && result.data[0].subnetId 
          && result.data[0].subnetId.id
        ){ 
          rootId = result.data[0].subnetId.id
        }
        if (rootId) {
          // TODO: the addSubnets function needs to be broken up
          return dispatch(addSubnets([rootId]))
            .then(subnetRes => {
              return Promise.resolve(subnetRes)
            })
        } else {
          dispatch(setIsCalculatingSubnets(false))
          return Promise.resolve([])
        }
      }).catch(err => {
        console.error(err)
        dispatch(setIsCalculatingSubnets(false))
        return Promise.reject()
      })
  }
}

function setSelectedSubnetId (selectedSubnetId) {
  return (dispatch) => {
    if (!selectedSubnetId) {
      dispatch({
        type: Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID,
        payload: '',
      })
    } else {
      batch(() => {
        dispatch(addSubnets([selectedSubnetId]))
          .then( (result) => {
            // TODO: we need to figure out the proper subnet select workflow
            // FDTs aren't subnets but can be selcted as such
            // that is where the following discrepancy comes from 
            //console.log(result)
            if (!result) selectedSubnetId = ''
            dispatch({
              type: Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID,
              payload: selectedSubnetId,
            })
          }).catch(err => {
            console.error(err)
            dispatch({
              type: Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID,
              payload: '',
            })
          })

      })
    }
  }
}

function onMapClick (featureIds, latLng) {
  // TODO: this is a bit of a shim for the moment to handle selecting a terminal that isn't yet loaded
  //  next we'll be selecting subnets by bounds using addSubnetTreeByLatLng 
  // TODO: this file is has become a two course meal of spaghetti and return dispatch soup
  //  Corr, fix yer mess!
  return (dispatch, getState) => {
    const state = getState()
    if (!featureIds.length || state.planEditor.subnetFeatures[featureIds[0]]) { 
      dispatch(selectEditFeaturesById(featureIds))
    } else {
      dispatch(addSubnetTreeByLatLng(latLng))
        .then(result => {
          dispatch(selectEditFeaturesById(featureIds))
        }) 
    }
  }
}

function recalculateBoundary (subnetId) {
  return (dispatch, getState) => {
    dispatch(setIsCalculatingBoundary(true))
    const state = getState()
    //const transactionId = state.planEditor.transaction.id
    if (!state.planEditor.subnets[subnetId] || !state.planEditor.transaction) return null // null? meh
    const transactionId = state.planEditor.transaction.id
    const newPolygon = state.planEditor.subnets[subnetId].subnetBoundary.polygon
    const boundaryBody = {
      locked: true,
      polygon: newPolygon,
    }

    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet/${subnetId}/boundary`, boundaryBody)
      .then(res => {
        dispatch(setIsCalculatingBoundary(false)) // may need to extend this for multiple boundaries? (make it and int incriment, decriment)
      })
      .catch(err => {
        console.error(err)
        dispatch(setIsCalculatingBoundary(false))
      })
  }
}

function boundaryChange (subnetId, geometry) {
  /**
   * makes a delay function that will call recalculateBoundary with the subnetId
   * gets the timeoutId and adds that to state by subnetId 
   * (we may be changeing multiple subnets durring the debounce time)
   * when new change comes in we check if there is already a timeoutId for that subnetId
   * if so we cancel it and make a fresh one set to the full time
   * 
   * the delayed Fn with call recalculateBoundary and pull out it's entry in the delay list
   * the recalculate button will (through a selector) check if there are any delay function waiting
   * if so it will be disabled
   */
  return (dispatch, getState) => {
    const timeoutDuration = 3000 // milliseconds
    const state = getState()
    
    if (state.planEditor.boundaryDebounceBySubnetId[subnetId]) {
      clearTimeout( state.planEditor.boundaryDebounceBySubnetId[subnetId] )
    }
    
    const timeoutId = setTimeout(() => {
      batch(() => {
        dispatch(recalculateBoundary(subnetId))
        dispatch({
          type: Actions.PLAN_EDITOR_CLEAR_BOUNDARY_DEBOUNCE,
          payload: subnetId,
        })
      })
    }, timeoutDuration)

    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_SET_BOUNDARY_DEBOUNCE,
        payload: {subnetId, timeoutId},
      })
      dispatch({
        type: Actions.PLAN_EDITOR_UPDATE_SUBNET_BOUNDARY,
        payload: {subnetId, geometry},
      })
    })
  }
}

function recalculateSubnets (transactionId, subnetIds = []) {
  return (dispatch, getState) => {
    const state = getState()
    let activeSubnets = []
    subnetIds.forEach(subnetId => {
      if (state.planEditor.subnets[subnetId]) {
        activeSubnets.push(subnetId)
      } else if (state.planEditor.subnetFeatures[subnetId]
        && state.planEditor.subnetFeatures[subnetId].subnetId
      ) {
        activeSubnets.push(state.planEditor.subnetFeatures[subnetId].subnetId)
      }
    })
    dispatch(setIsCalculatingSubnets(true))
    const recalcBody = { subnetIds: activeSubnets }
    
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet-cmd/recalc`, recalcBody)
      .then(res => {
        dispatch(setIsCalculatingSubnets(false))
        // parse changes
        dispatch(parseRecalcEvents(res.data))
      })
      .catch(err => {
        console.error(err)
        dispatch(setIsCalculatingSubnets(false))
      })
  }
}

// --- //

// helper
function parseRecalcEvents (recalcData) {
  //copnsole.log(recalcData)
  // this needs to be redone and I think we should make a sealed subnet manager
  // that will manage the subnetFeatures list with changes to a subnet (deleting children etc)
  return (dispatch, getState) => {
    const { subnetFeatures } = getState().planEditor
    let newSubnetFeatures = JSON.parse(JSON.stringify(subnetFeatures))
    let updatedSubnets = {}

    dispatch(addSubnets(
      [...new Set(recalcData.subnets.map(subnet => subnet.feature.objectId))]
    ))
      .then(() => {
        // need to recapture state because we've altered it w/ `addSubnets`
        const state = getState()
        recalcData.subnets.forEach(subnetRecalc => {
          let subnetId = subnetRecalc.feature.objectId
          // TODO: looks like this needs to be rewritten 
          if (state.planEditor.subnets[subnetId]) {
            let newSubnet = JSON.parse(JSON.stringify(state.planEditor.subnets[subnetId]))

            // update fiber
            // TODO: create parser for this???
            // ...also use it above in `addSubnets`, where fiber is added
            newSubnet.fiber = subnetRecalc.feature

            // update equipment
            subnetRecalc.recalcNodeEvents.forEach(recalcNodeEvent => {
              let objectId = recalcNodeEvent.subnetNode.id
              switch (recalcNodeEvent.eventType) {
                case 'DELETE':
                  // need to cover the case of deleteing a hub where we need to pull the whole thing
                  delete newSubnetFeatures[objectId]
                  let index = newSubnet.children.indexOf(objectId);
                  if (index !== -1) {
                    newSubnet.children.splice(index, 1);
                  }
                  break
                case 'ADD':
                  // add only
                  newSubnet.children.push(objectId)
                  // do not break
                case 'MODIFY':
                  // add || modify
                  // TODO: this is repeat code from below
                  let parsedNode = {
                    feature: parseSubnetFeature(recalcNodeEvent.subnetNode),
                    subnetId: subnetId,
                  }
                  newSubnetFeatures[objectId] = parsedNode
                  break
              }
            })
            updatedSubnets[subnetId] = newSubnet
          }
      })

      batch(() => {
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: newSubnetFeatures,
        })
        dispatch({
          type: Actions.PLAN_EDITOR_ADD_SUBNETS,
          payload: updatedSubnets,
        })
      })

    })
  }
}

// helper
function parseAddApiSubnets (apiSubnets) {
  return (dispatch) => {
    if (apiSubnets.length) {
      let subnets = {}
      let allFeatures = {}
      // parse 
      apiSubnets.forEach(apiSubnet => {
        let {subnet, subnetFeatures} = parseSubnet(apiSubnet)
        const subnetId = subnet.subnetNode
        subnets[subnetId] = subnet
        allFeatures = {...allFeatures, ...subnetFeatures}
      })
      // dispatch add subnets and add subnetFeatures
      return batch(() => {
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: allFeatures,
        })
        dispatch({
          type: Actions.PLAN_EDITOR_ADD_SUBNETS,
          payload: subnets,
        })
      })
    }
  }
}

// helper function 
function parseSubnet (subnet) {
  // --- fix service typos - eventually this won't be needed --- //
  subnet.subnetNode = parseSubnetFeature(subnet.subnetId)
  delete subnet.subnetId
  subnet.children = subnet.children.map(feature => parseSubnetFeature(feature))
  // --- end typo section --- //

  // subnetLocations needs to be a dictionary
  subnet.subnetLocationsById = {}
  subnet.subnetLocations.forEach(location => {
    location.objectIds.forEach(objectId => {
      // if subnet.subnetLocationsById[objectId] doesn't exist something has fallen out of sync
      subnet.subnetLocationsById[objectId] = { ...location, parentEquipmentId: null}
    })
  })
  delete subnet.subnetLocations

  // build the subnet feature list
  const subnetId = subnet.subnetNode.objectId
  let subnetFeatures = {}
  // root node
  subnetFeatures[subnetId] = {
    'feature': subnet.subnetNode,
    'subnetId': subnet.parentSubnetId,
  }
  // child nodes
  subnet.children.forEach(feature => {
    subnetFeatures[feature.objectId] = {
      'feature': feature,
      'subnetId': subnetId,
    }
    // if the feature has attached locations we need to note that in the locations list
    //  technically we are duplicating data so we need to be sure the reducer machinery keeps these in sync
    if (feature.dropLinks) {
      feature.dropLinks.forEach(dropLink => {
        dropLink.locationLinks.forEach(locationLink => {
          if (!subnet.subnetLocationsById[locationLink.locationId]) {
            console.warn(`location ${locationLink.locationId} of feature ${feature.objectId} is not in the location list of subnet ${subnetId}`)
          } else {
            subnet.subnetLocationsById[locationLink.locationId].parentEquipmentId = feature.objectId
          }
        })
      })
    }
  })

  // subnet child list is a list of IDs, not full features, features are stored in subnetFeatures
  subnet.children = subnet.children.map(feature => feature.objectId)
  subnet.subnetNode = subnet.subnetNode.objectId

  return {subnet, subnetFeatures}
}

// helper function
function parseSubnetFeature (feature) {
  // --- fix service typos - eventually this won't be needed --- //
  feature.objectId = feature.id
  delete feature.id

  feature.geometry = feature.point
  delete feature.point
  // --- end typo section --- //

  return feature
}

// helper function
function composeSubnet (subnet, state) {
  // to bring in child refrences 
  //  used to unparse subnets to send back to the server 
  //  BUT ALSO may be used internally which why we don't unfix the typos here
  subnet = JSON.parse(JSON.stringify(subnet))
  subnet.children = subnet.children.map(objectId => {
    return JSON.parse(JSON.stringify(state.planEditor.subnetFeatures[objectId].feature))
  })
  subnet.subnetNode = JSON.parse(JSON.stringify(state.planEditor.subnetFeatures[subnet.subnetNode].feature))

  return subnet
}

// helper function 
function unparseSubnet (subnet, state) {
  subnet = composeSubnet(subnet, state)
  subnet.children = subnet.children.map(feature => unparseSubnetFeature(feature))

  subnet.subnetId = unparseSubnetFeature(subnet.subnetNode)
  delete subnet.subnetNode

  return subnet
}

// helper function
function unparseSubnetFeature (feature) {
  feature = JSON.parse(JSON.stringify(feature))
  // --- unfix service typos - eventually this won't be needed --- //
  feature.id = feature.objectId
  delete feature.objectId

  feature.point = feature.geometry
  delete feature.geometry
  // --- end typo section --- //

  return feature
}

// --- //

export default {
  commitTransaction,
  clearTransaction,
  discardTransaction,
  resumeOrCreateTransaction,
  createFeature,
  modifyFeature,
  updateFeatureProperties,
  moveFeature,
  deleteFeature,
  deleteTransactionFeature,
  addTransactionFeatures,
  showContextMenuForEquipment,
  showContextMenuForLocations,
  unassignLocation,
  assignLocation,
  showContextMenuForEquipmentBoundary,
  startDrawingBoundaryFor,
  stopDrawingBoundary,
  setIsCalculatingSubnets,
  setIsCalculatingBoundary,
  setIsCreatingObject,
  setIsModifyingObject,
  setIsDraggingFeatureForDrop,
  setIsEditingFeatureProperties,
  setIsCommittingTransaction,
  setIsEnteringTransaction,
  readFeatures,
  selectEditFeaturesById,
  deselectEditFeatureById,
  addSubnets,
  setSelectedSubnetId,
  onMapClick,
  recalculateBoundary,
  boundaryChange,
  recalculateSubnets,
}
