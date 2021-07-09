import Actions from '../../common/actions'
import TransactionManager from './transaction-manager'
import Transaction from './transaction'
import AroHttp from '../../common/aro-http'
import MenuItemFeature from '../context-menu/menu-item-feature'
import MenuItemAction from '../context-menu/menu-item-action'
import ContextMenuActions from '../context-menu/actions'
//import SelectionActions from '../selection/selection-actions'
import { batch } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'

function resumeOrCreateTransaction (planId, userId) {
  return dispatch => {
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
          AroHttp.get(`/service/plan-transactions/${transactionId}/transaction-features/equipment_boundary`)
        ])
      })
      .then(results => {
        dispatch(addTransactionFeatures(results[0].data))
        dispatch(addTransactionFeatures(results[1].data))
        dispatch({
          type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
          payload: false
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
    dispatch(setIsCommittingTransaction(true))
    return AroHttp.put(`/service/plan-transactions/${transactionId}`)
      .then(() => dispatch(clearTransaction()))
      .catch(err => {
        console.error(err)
        dispatch(clearTransaction())
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

function createFeature (featureType, feature) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    // Do a POST to send the equipment over to service
    AroHttp.post(`/service/plan-transactions/${transactionId}/modified-features/${featureType}`, feature)
      .then(result => {
        // Decorate the created feature with some default values
        const createdFeature = {
          crudAction: 'create',
          deleted: false,
          valid: true,
          feature: result.data
        }
        dispatch(addTransactionFeatures([createdFeature]))
      })
      .catch(err => console.error(err))
  }
}

function modifyFeature (featureType, feature) {
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

// ToDo: there's only one transaction don't require the ID
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

function showContextMenuForEquipment (equipmentObjectId, x, y) {
  return (dispatch, getState) => {
    const state = getState()
    const planId = state.plan.activePlan.id
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    const selectedBoundaryTypeId = state.mapLayers.selectedBoundaryType.id

    // Get details on the boundary (if any) for this equipment
    AroHttp.get(`/boundary/for_network_node/${planId}/${equipmentObjectId}/${selectedBoundaryTypeId}`)
      .then(result => {
        var menuActions = []
        var isAddBoundaryAllowed = (result.data.length === 0) // No results for this combination of planid, object_id, selectedBoundaryTypeId. Allow users to add boundary
        if (isAddBoundaryAllowed) {
          menuActions.push(new MenuItemAction('ADD_BOUNDARY', 'Add boundary', 'PlanEditorActions', 'startDrawingBoundaryFor', equipmentObjectId))
        }
        menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteTransactionFeature', transactionId, 'equipment', equipmentObjectId))
        const menuItemFeature = new MenuItemFeature('EQUIPMENT', 'Equipment', menuActions)
        // Show context menu
        dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
        dispatch(ContextMenuActions.showContextMenu(x, y))
      })
      .catch(err => console.error(err))
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

function setIsCalculatingSubnets (isCalculatingSubnets) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS,
    payload: isCalculatingSubnets
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
    let subnetFeature = state.planEditor.subnetFeatures[featureId].feature
    subnetFeature = JSON.parse(JSON.stringify(subnetFeature))
    let subnetId = state.planEditor.subnetFeatures[featureId].subnetId
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    
    subnetFeature.geometry.coordinates = coordinates
    const body = {
      commands: [{
        // `childId` is one of the children nodes of the subnets
        // service need to chagen this to "childNode"
        childId: unparseSubnetFeature(subnetFeature),
        subnetId: subnetId, // parent subnet id, don't add when `type: 'add'`
        type: 'update', // `add`, `update`, or `delete`
      }]
    }
    // Do a PUT to send the equipment over to service
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        console.log(result)
        
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: [subnetFeature]
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
            let networkNodeType = state.planEditor.features[featureId].feature.networkNodeType
            if (networkNodeType === "central_office"
              || networkNodeType === "fiber_distribution_hub"
            ) {
              subnetFeatures.push(featureId)
            }
          }
        })
        batch(() => {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS, 
            payload: validFeatures,
          })
          // later we may highlight more than one subnet
          dispatch(setSelectedSubnetId(subnetFeatures[0]))
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
  return (dispatch, getState) => {

    const { transaction, subnets: cachedSubnets } = getState().planEditor

    // this little dance only fetches uncached subnets
    const cachedSubnetIds = Object.keys(cachedSubnets)
    const uncachedSubnetIds = subnetIds.filter(id => !cachedSubnetIds.includes(id))

    const subnetApiPromises = uncachedSubnetIds.map(subnetId => {
      return AroHttp.get(`/service/plan-transaction/${transaction.id}/subnet/${subnetId}`)
    })
    
    return Promise.all(subnetApiPromises)
      .then(subnetResults => {
        let apiSubnets = subnetResults.map(result => result.data)
        dispatch(parseAddApiSubnets(apiSubnets))
      })
      .catch(err => console.error(err))
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
          .then( () => {
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

function recalculateBoundary ({ transactionId, subnetId }) {
  return dispatch => {

    // FIXME: FIXME: FIXME: FIXME: FIXME: FIXME: FIXME: FIXME: FIXME: FIXME: FIXME: 
    // hardcore fixme: need to actually attach map objects / boundaries to state
    // this was 1,000,000% just to get it working quickly
    const newPolygon = WktUtils.getWKTMultiPolygonFromGoogleMapPaths(window.TEMPORARY_MAP_BOUNDARY.getPaths())
    const boundaryBody = {
      locked: true,
      polygon: newPolygon,
    }

    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet/${subnetId}/boundary`, boundaryBody)
      .then(res => {
        console.log(res)
        // debugger
        // dispatch({
        //   type: Actions.PLAN_EDITOR_RECALCULATE_BOUNDARY,
        //   payload: subnetResults.map(result => result.data),
        // })
      })
      .catch(err => console.error(err))
  }
}

function recalculateSubnets ({ transactionId, subnetIds }) {
  return dispatch => {
    const recalcBody = { subnetIds }
    console.log(recalcBody)
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet-cmd/recalc`, recalcBody)
      .then(res => {
        console.log(res)
        // dispatch({
        //   type: Actions.PLAN_EDITOR_RECALCULATE_SUBNETS,
        //   payload: subnetResults.map(result => result.data),
        // })
      })
      .catch(err => console.error(err))
  }
}

// --- //

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
      batch(() => {
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
  moveFeature,
  deleteTransactionFeature,
  addTransactionFeatures,
  showContextMenuForEquipment,
  showContextMenuForEquipmentBoundary,
  startDrawingBoundaryFor,
  stopDrawingBoundary,
  setIsCalculatingSubnets,
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
  recalculateBoundary,
  recalculateSubnets,
}
