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
import PlanEditorSelectors from './plan-editor-selectors'
import { constants } from './shared'

let validSubnetTypes = [
  'central_office',
  'fiber_distribution_hub',
  'dslam',
  'subnet_node',
]


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
        // TODO: how much of this is legacy??????
        // it might need a lot of cleanup
        // i.e., we might not need to load from these end points. unclear.
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

        const resource = 'network_architecture_manager'
        const { id, name } = state.plan.resourceItems[resource].selectedManager

        batch(async() => {
          // ToDo: do we need to clearTransaction?
          await dispatch(addSubnetTree())
          // NOTE: need to load resource manager so drop cable
          // length is available for plan-editor-selectors
          await dispatch(ResourceActions.loadResourceManager(id, resource, name))
          await dispatch(addTransactionFeatures(equipmentList))
          await dispatch(addTransactionFeatures(boundaryList))
          const state = getState()
          const rootSubnet = PlanEditorSelectors.getRootSubnet(state)
          if (rootSubnet) {
            await dispatch(selectEditFeaturesById([rootSubnet.subnetNode]))
          }
          dispatch(setFiberRenderRequired(true))
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

function clearTransaction (doOpenView = true) {
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
      if (doOpenView) {
        dispatch({
          type: Actions.TOOL_BAR_SET_SELECTED_DISPLAY_MODE,
          payload: 'VIEW', // ToDo: globalize the constants in tool-bar including displayModes
        })
      }
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

function createFeature(feature) {
  return async(dispatch, getState) => {

    try {

      const state = getState()
      const transactionId = state.planEditor.transaction && state.planEditor.transaction.id

      // creating a feature on a blank plan
      const rootSubnet = PlanEditorSelectors.getRootSubnet(state)
      if (!rootSubnet) {
        const coordinatesResponse = await dispatch(addSubnets({ coordinates: feature.point.coordinates }))
      }

      const url = `/service/plan-transaction/${transactionId}/subnet_cmd/update-children`
      const commandsBody = { childId: feature, type: 'add' };
      // If it is a ring plan we need to pass in the parentID of the dumby subnet
      // inorder to find the correct ring plan in service
      if (state.plan.activePlan.planType === "RING" && rootSubnet) {
        commandsBody.subnetId = rootSubnet.subnetNode;
      }
      const featureResults = await AroHttp.post(url, {
        commands: [commandsBody]
      })
      const { subnetUpdates, equipmentUpdates } = featureResults.data

      // 1. dispatch addSubnets w/ everything that came back...
      const updatedSubnetIds = subnetUpdates.map((subnet) => subnet.subnet.id)
      const subnetIdsResponse = await dispatch(addSubnets({ subnetIds: updatedSubnetIds }))

      // 2. wait for return, and run rest after
      let subnetsCopy = JSON.parse(JSON.stringify(getState().planEditor.subnets))
      const newFeatures = {}
      // the subnet and equipment updates are not connected, right now we get back two arrays
      // For now I am assuming the relevent subnet is the one with type 'modified'
      // TODO: handle there being multiple updated subnets

      // For a standard plan there should always be motified subnets
      // however that is not the case for ring plans as the rootSubnet
      // is not a real and is used to work in the single parent hirearchy so we can just grab that.
      const modifiedSubnet = state.plan.activePlan.planType === "RING" && rootSubnet
        ? rootSubnet
        : subnetUpdates.find(subnet => subnet.type === 'modified');

      const subnetId = modifiedSubnet.subnet
        ? modifiedSubnet.subnet.id
        : modifiedSubnet.subnetNode

      equipmentUpdates.forEach(equipment => {
        // fix difference between id names
        const parsedFeature = parseSubnetFeature(equipment.subnetNode)

        newFeatures[parsedFeature.objectId] = {
          feature: parsedFeature,
          subnetId: subnetId,
        }
        if (subnetsCopy[subnetId]) {
          subnetsCopy[subnetId].children.push(parsedFeature.objectId)
        }
      })

      batch(() => {
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: newFeatures,
        })
        dispatch({
          type: Actions.PLAN_EDITOR_ADD_SUBNETS,
          payload: subnetsCopy,
        })
      })
      } catch (error) {
        console.error(error)
      }


  }
}

//TODO: depricate
// TODO: tuneing - still used in equipment bounds edit, depricate then delete
/*
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
*/

function updateFeatureProperties({ feature, rootSubnetId }) {
  return async(dispatch, getState) => {
    try {
      const state = getState()
      const transactionId = state.planEditor.transaction && state.planEditor.transaction.id

      // Do a PUT to send the equipment over to service
      const url = `/service/plan-transaction/${transactionId}/subnet-equipment?parentSubnetId=${rootSubnetId}`
      const result = await AroHttp.put(url, feature)

      // Decorate the created feature with some default values
      const featureEntry = state.planEditor.features[feature.objectId]
      let crudAction = featureEntry.crudAction || 'read'
      if (crudAction === 'read') crudAction = 'update'

      dispatch({
        type: Actions.PLAN_EDITOR_MODIFY_FEATURES,
        payload: [{
          ...featureEntry,
          crudAction: crudAction,
          feature: result.data,
        }],
      })
      return Promise.resolve()
    } catch (error) {
      console.error(err)
    }
  }
}

// ToDo: there's only one transaction don't require the ID
// TODO: cleanup?
// TODO: tuneing - no longer used delete
/*
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
*/

// TODO: depricate this and planEditor.features
function addTransactionFeatures (features) {
  return {
    type: Actions.PLAN_EDITOR_ADD_FEATURES,
    payload: features
  }
}

function createConstructionArea(constructionArea) {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const transactionId = state.planEditor.transaction && state.planEditor.transaction.id

      const url = `/service/plan-transaction/${transactionId}/edge-construction-area`
      const constructionAreaResults = await AroHttp.post(url, {
        ...constructionArea
      })
      const { modifiedSubnets, newFeature } = constructionAreaResults.data

      // Update the modified subnets
      const updatedSubnetIds = modifiedSubnets.map((subnet) => subnet.node.id)
      await dispatch(addSubnets({ subnetIds: updatedSubnetIds }))

      // Move a parsed copy of the construction area in to the global state for subnets
      const [newSubnet, parsedFeature] = parseAPIConstructionAreasToStore(newFeature)
      const subnetsCopy = JSON.parse(JSON.stringify(getState().planEditor.subnets))
      subnetsCopy[newFeature.objectId] = newSubnet;

      // Move a parsed copoy of the construction area in to the global state for features
      const newFeatures = {};
      newFeatures[parsedFeature.objectId] = {
        feature: parsedFeature,
        subnetId: null,
      }

      batch(() => {
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: newFeatures,
        })
        dispatch({
          type: Actions.PLAN_EDITOR_ADD_SUBNETS,
          payload: subnetsCopy,
        })
      })
    } catch (e) {
      console.warn(e);
    }
  }
}

function deleteBoundaryVertex (mapObject, vertex) {
  return dispatch => {
    // checks it is a valid vertex and that there are at least 3 other vertices left
    if (vertex && mapObject.getPath().getLength() > 3) {
      mapObject.getPath().removeAt(vertex)
    }
  }
}

function deleteBoundaryVertices (mapObject, vertices, callBack) {
  return dispatch => {
      // We are tracking the multiple selected verticies to delete by markers created.
      // And storing vertex index on the corrosponding marker.
      vertices.sort((a, b) => {
        return Number(b.title) - Number(a.title)
      })

      for (let marker of vertices) {
        if (marker && marker.title && mapObject.getPath().getLength() > 3) {
          mapObject.getPath().removeAt(Number(marker.title))
        }
      }     

      callBack();
  }
}

function showContextMenuForEquipment (featureId, x, y) {
  return (dispatch) => {
    var menuActions = []
    menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteFeature', featureId))
    const menuItemFeature = new MenuItemFeature('EQUIPMENT', 'Equipment', menuActions)
    // Show context menu
    dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
    dispatch(ContextMenuActions.showContextMenu(x, y))
  }
}

function showContextMenuForConstructionAreas (featureId, x, y) {
  return (dispatch) => {
    var menuActions = []
    menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteConstructionArea', featureId))
    const menuItemFeature = new MenuItemFeature('CONSTRUCTION_AREA', 'Construction Area', menuActions)
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

    let fromTerminalId = state.planEditor.subnets[subnetId].subnetLocationsById[locationId].parentEquipmentId

    // unassign location if location is assigned
    if (fromTerminalId && state.planEditor.subnetFeatures[fromTerminalId]){
      let fromFeature = _spliceLocationFromTerminal(state, locationId, fromTerminalId)
      if (fromFeature) features.push(fromFeature)
    }

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

function showContextMenuForEquipmentBoundary (mapObject, x, y, vertex, callBack) {
  return (dispatch) => {
    const menuActions = []
    menuActions.push(
      new MenuItemAction(
        Array.isArray(vertex) ? 'DELETE_ALL' : 'DELETE',
        'Delete',
        'PlanEditorActions',
        Array.isArray(vertex) ? 'deleteBoundaryVertices' : 'deleteBoundaryVertex',
        mapObject,
        vertex,
        // Callback is utilized to update the local state of the react class if it is a multi-delete.
        callBack
      )
    )

    const menuItemFeature = new MenuItemFeature(
      'BOUNDARY',
      `Boundary ${Array.isArray(vertex) ? 'Vertices' : 'Vertex' }`,
      menuActions
    )

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

function updatePlanThumbInformation (payload) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction.id
    const subnet = state.planEditor.subnets[payload.key]
    const body = JSON.parse(JSON.stringify(state.planEditor.subnetFeatures[payload.key].feature))
    const isBlocker = payload.planThumbInformation === constants.BLOCKER.KEY
    body.geometry.type = "Polygon";
    body.geometry.coordinates = subnet.subnetBoundary.polygon.coordinates[0]
    body.costMultiplier = isBlocker
      ? constants.BLOCKER.COST_MULTIPLIER
      : constants.INCLUSION.COST_MULTIPLIER
    body.priority = isBlocker
      ? constants.BLOCKER.PRIORITY
      : constants.INCLUSION.PRIORITY


    return AroHttp.put(`/service/plan-transaction/${transactionId}/edge-construction-area`, body)
      .then(async (res) => {
        dispatch(setIsCalculatingBoundary(false)) // may need to extend this for multiple boundaries? (make it and int incriment, decriment)
        if (res.data.modifiedSubnets) {
          const updatedSubnetIds = res.data.modifiedSubnets.map((subnet) => subnet.node.id)
          await dispatch(addSubnets({ subnetIds: updatedSubnetIds }))
        }
        const feature = parseAPIConstructionAreasToFeature(res.data.newFeature)
        const newFeature = {}
        newFeature[feature.objectId] = { feature, subnetId: null };

        batch(() => {
          dispatch({
            type: Actions.PLAN_EDITOR_UPDATE_PLAN_THUMB_INFORMATION,
            payload: payload
          })
          dispatch({
            type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
            payload: newFeature
          })
        })
      })
      .catch(err => {
        console.error(err)
      })
  }
}

function setPlanThumbInformation (payload) {
  return {
    type: Actions.PLAN_EDITOR_SET_PLAN_THUMB_INFORMATION,
    payload
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

function moveConstructionArea (objectId, newCoordinates) {
  return async (dispatch, getState) => {
    // Take in the new cordinates and move the entire polygon by the difference between them and the old coordinates
    const state = getState()
    let constructionAreaSubnet = JSON.parse(JSON.stringify(state.planEditor.subnets[objectId]))
    let constructionAreaFeature = JSON.parse(JSON.stringify(state.planEditor.subnetFeatures[objectId].feature))
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    // Finding difference in lat and lng between old and new
    const oldCoordinates = constructionAreaFeature.geometry.coordinates;
    const differenceBetweenCoordinates = [newCoordinates[0] - oldCoordinates[0], newCoordinates[1] - oldCoordinates[1]]

    // Update the "Point" Coordinates on the feature
    constructionAreaFeature.geometry.coordinates = newCoordinates;

    // Update the boundary coordinates on the subnet.
    constructionAreaSubnet.subnetBoundary.polygon.coordinates[0][0].forEach((coordinates, j) => {
      coordinates.forEach((coord, i) => {
        // loops through coordinates in each path
        // 0 - left <-> right
        // 1 - up <-> down
        constructionAreaSubnet.subnetBoundary.polygon.coordinates[0][0][j][i] += differenceBetweenCoordinates[i];
      })
    })

    // The front end requires a Polygon while the front end requires a MultiPolygon. This is parsing it for the back end but maintaining it as is on the front end.
    const body = JSON.parse(JSON.stringify(constructionAreaFeature))
    body.geometry.type = "Polygon";
    body.geometry.coordinates = constructionAreaSubnet.subnetBoundary.polygon.coordinates[0]
    const featurePayload = {};
    const subnetsCopy = JSON.parse(JSON.stringify(state.planEditor.subnets))
    featurePayload[objectId] = { feature: constructionAreaFeature, subnetId: null }
    subnetsCopy[objectId] = constructionAreaSubnet
    
    const result = await AroHttp.put(`/service/plan-transaction/${transactionId}/edge-construction-area`, body)
    const updatedSubnetIds = result.data.modifiedSubnets.map((subnet) => subnet.node.id)

    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_ADD_SUBNETS,
        payload: subnetsCopy
      })
      dispatch({
        type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
        payload: featurePayload
      })
      dispatch(addSubnets({ subnetIds: updatedSubnetIds }))
    })
  }
}

function deleteFeature (featureId) {
  return (dispatch, getState) => {
    const state = getState()

    let subnetFeature = state.planEditor.subnetFeatures[featureId]
    let selectedSubnetId = state.planEditor.selectedSubnetId
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
        batch(() => {
          dispatch({
          type: Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE,
            payload: featureId
          })
          dispatch({
            type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE,
            payload: featureId,
          })
          // if deleted equipment is currently selected, move selection to parent
          if (featureId === selectedSubnetId){
            dispatch(setSelectedSubnetId(subnetId))
          }
          dispatch(recalculateSubnets(transactionId))
        })
      })
      .catch(err => console.error(err))
  }
}

function deleteConstructionArea (featureId) {
  return async (dispatch, getState) => {
    const state = getState()
    let subnetFeature = state.planEditor.subnetFeatures[featureId]
    let subnet = state.planEditor.subnets[featureId]
    subnetFeature = JSON.parse(JSON.stringify(subnetFeature))
    subnet = JSON.parse(JSON.stringify(subnet))
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    await AroHttp.delete(`/service/plan-transaction/${transactionId}/edge-construction-area/${featureId}`)
    batch(() => {
      dispatch({
      type: Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE,
        payload: featureId
      })
      dispatch({
        type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE,
        payload: featureId,
      })
      dispatch({
        type: Actions.PLAN_EDITOR_REMOVE_SUBNETS,
        payload: [subnet]
      })
      dispatch(recalculateSubnets(transactionId))
    })
  }
}

function readFeatures (featureIds) {
  return (dispatch, getState) => {
    const state = getState()
    let featuresToGet = []
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    featureIds.forEach(featureId => {
      if (!state.planEditor.features[typeof featureId === "string" ? featureId : featureId.objectId]) {
        featuresToGet.push(featureId)
      }
    })
    let retrievedIds = []
    let promises = [Promise.resolve()]
    let retrievedFeatures = []
    featuresToGet.forEach(featureId => {
      const featureType = typeof featureId !== "string" && featureId.dataType === 'edge_construction_area' 
        ? 'edge-construction-area' 
        : 'subnet-equipment'
      promises.push(
        AroHttp.get(`/service/plan-transaction/${transactionId}/${featureType}/${typeof featureId === "string" ? featureId : featureId.objectId}`)
          .then(result => {
            if (result.data) {
              // Decorate the equipment with some default values. Technically this is not yet "created" equipment
              // but will have to do for now.
              retrievedIds.push(typeof featureId === "string" ? featureId : featureId.objectId)
              if (result.data.dataType === 'edge_construction_area') {
                result.data = parseAPIConstructionAreasToFeature(result.data)
              }
              retrievedFeatures.push({
                crudAction: 'read',
                deleted: false,
                valid: true,
                feature: result.data
              })
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
        featureIds.forEach(featureId => {
          if (state.planEditor.features[typeof featureId === "string" ? featureId : featureId.objectId]) { 
            validFeatures.push(typeof featureId === "string" ? featureId : featureId.objectId) 
          }
        })
        batch(() => {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS, 
            payload: validFeatures,
          })
          dispatch(setSelectedSubnetId(validFeatures[0]))
        })
      })
  }
}

function getConsructionAreaByRoot (rootSubnet) {
  return async (dispatch, getState) => {
    const state = getState();
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    const body = { area: rootSubnet.subnetBoundary.polygon }
    const response = await AroHttp.post(`/service/plan-transaction/${transactionId}/cmd-edge-construction-area/search`, body)
    const subnetsCopy = JSON.parse(JSON.stringify(getState().planEditor.subnets))
    const newFeatures = {};
    response.data.forEach(constructionArea => {
      const [newSubnet, newFeature] = parseAPIConstructionAreasToStore(constructionArea.feature)
      subnetsCopy[newFeature.objectId] = newSubnet;
      newFeatures[newFeature.objectId] = {
        feature: newFeature,
        subnetId: null,
      }
    })

    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
        payload: newFeatures,
      })
      dispatch({
        type: Actions.PLAN_EDITOR_ADD_SUBNETS,
        payload: subnetsCopy,
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

function addSubnets({ subnetIds = [], forceReload = false, coordinates }) {
  // FIXME: I (BRIAN) needs to refactor this, it works for the moment but does a lot of extranious things
  //  ALSO there is a "bug" where if we select an FDT before selecting the CO or one of the hubs, we get no info
  //  to fix this we need to find out what subnet the FDT is a part of and run that through here
  return async (dispatch, getState) => {

    const {
      transaction,
      subnets: cachedSubnets,
      requestedSubnetIds,
      features,
      subnetFeatures,
    } = getState().planEditor

    let command = {}
    if (coordinates) {
      command.cmdType = 'QUERY_CO_SUBNET'
      command.point = { type: 'Point', coordinates }

    } else {
      // this little dance only fetches uncached (or forced to reload) subnets
      const cachedSubnetIds = [...Object.keys(cachedSubnets), ...requestedSubnetIds]
      let uncachedSubnetIds = subnetIds.filter(id => {
        let isNotCached = !cachedSubnetIds.includes(id)
        return forceReload || isNotCached // gotta love that double negative...
      })

      // we have everything, no need to query service
      if (uncachedSubnetIds.length <= 0) {
        dispatch(setIsCalculatingSubnets(false))
        return Promise.resolve(subnetIds)
      }
      // pull out any ids that are not subnets
      let validPseudoSubnets = []
      uncachedSubnetIds = uncachedSubnetIds.filter(id => {
        if (!features[id]) return true // unknown so we'll try it
        let networkNodeType = features[id].feature.networkNodeType
        // TODO: do other networkNodeTypes have subnets?
        //  how would we know? solve that
        if (validSubnetTypes.includes(networkNodeType)) {
          return true
        }
        if (subnetFeatures[id]) validPseudoSubnets.push(id)
        return false
      })

      // the selected ID isn't a subnet persay so don't query for it
      // TODO: we need to fix this selection discrepancy
      if (uncachedSubnetIds.length <= 0) {
        // is the FDT in state? If so we can select it
        if (validPseudoSubnets.length > 0) {
          return Promise.resolve(validPseudoSubnets)
        }
        // if not we can't
        return Promise.resolve()
      }

      command.cmdType = 'QUERY_SUBNET_TREE'
      command.subnetIds = uncachedSubnetIds
    }

    // should we rename that now that we are using it for retreiving subnets as well?
    dispatch(setIsCalculatingSubnets(true))
    return AroHttp.post(`/service/plan-transaction/${transaction.id}/subnet_cmd/query-subnets`, command)
      .then(({ data }) => {
        let apiSubnets = data.filter(Boolean)
        let fiberApiPromises = []
        // TODO: break this out into fiber actions
        apiSubnets.forEach(subnet => {
          // subnet could be null (don't ask me)
          const subnetId = subnet.subnetId.id
          if (!subnet.parentSubnetId) {
            dispatch(getConsructionAreaByRoot(subnet))
          }
          fiberApiPromises.push(
            AroHttp.get(`/service/plan-transaction/${transaction.id}/subnetfeature/${subnetId}`)
              .then(fiberResult => subnet.fiber = fiberResult.data)
          )
        })

        return Promise.all(fiberApiPromises)
          .then(() => {
            dispatch(setIsCalculatingSubnets(false))
            return new Promise((resolve, reject) => {
              dispatch(parseAddApiSubnets(apiSubnets))
              resolve(subnetIds)
            })
          })
          .catch(err => {
            console.error(err)
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

// FIXME: this should be called `addSubnetTreeBy...Something` because
// we need to enhance the UI to allow selecting by service areas.
function addSubnetTree() {
  return (dispatch, getState) => {
    const state = getState()
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    dispatch(setIsCalculatingSubnets(true))
    return AroHttp.get(`/service/plan-transaction/${transactionId}/subnet-root-refs`)
      .then(result => {
        const data = result.data || []
        let rootIds = []
        data.forEach(subnet => {
          if (subnet.node && subnet.node.id) {
            rootIds.push(subnet.node.id)
          }
        })
        if (rootIds.length) {
          rootIds.forEach((id) => {
            // get feeder fiber annotations
            dispatch(getFiberAnnotations(id))
          })
          
          // TODO: the addSubnets function needs to be broken up
          return dispatch(addSubnets({ subnetIds: rootIds }))
            .then(subnetRes => Promise.resolve(subnetRes))
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

function addSubnetTreeByLatLng([lng, lat]) {
  return async(dispatch, getState) => {

    try {
      const state = getState()
      let transactionId = state.planEditor.transaction && state.planEditor.transaction.id
      const command = {
        cmdType: 'QUERY_CO_SUBNET',
        point:{ type: 'Point', coordinates: [lng, lat] },
      }
      dispatch(setIsCalculatingSubnets(true))
      const endpoint = `/service/plan-transaction/${transactionId}/subnet_cmd/query-subnets`
      const { data } = await AroHttp.post(endpoint, command)

      let rootId = null
      if (data && data[0] && data[0].subnetId && data[0].subnetId.id) {
        rootId = data[0].subnetId.id
      }

      if (rootId) {
        return dispatch(addSubnets({ subnetIds: [rootId] }))
      } else {
        dispatch(setIsCalculatingSubnets(false))
        return Promise.resolve([])
      }
    } catch (error) {
      console.error(err)
      dispatch(setIsCalculatingSubnets(false))
      return Promise.reject()
    }

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
        dispatch(addSubnets({ subnetIds: [selectedSubnetId] }))
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

function onMapClick(featureIds, latLng) {
  // TODO: this is a bit of a shim for the moment to handle selecting a terminal that isn't yet loaded
  //  next we'll be selecting subnets by bounds using addSubnetTreeByLatLng 
  // TODO: this file is has become a two course meal of spaghetti and return dispatch soup
  //  Corr, fix yer mess!
  return async(dispatch, getState) => {
    const state = getState()
    if (!featureIds.length || state.planEditor.subnetFeatures[featureIds[0]]) { 
      dispatch(selectEditFeaturesById(featureIds))
    } else {
      await dispatch(addSubnetTreeByLatLng([latLng.lng(), latLng.lat()]))
      dispatch(selectEditFeaturesById(featureIds))
    }
  }
}

function setCursorLocationIds(payload) {
  return (dispatch, getState) => {
    const { cursorLocationIds } = getState().planEditor
    if (JSON.stringify(cursorLocationIds) !== JSON.stringify(payload)) {
      dispatch({ type: Actions.PLAN_EDITOR_SET_CURSOR_LOCATION_IDS, payload })
    }
  }
}

function clearCursorLocationIds() {
  return this.setCursorLocationIds([])
}

function addCursorEquipmentIds(payload) {
  return { type: Actions.PLAN_EDITOR_ADD_CURSOR_EQUIPMENT_IDS, payload }
}

function clearCursorEquipmentIds() {
  return { type: Actions.PLAN_EDITOR_CLEAR_CURSOR_EQUIPMENT_IDS, payload: [] }
}

function recalculateBoundary (subnetId) {
  return (dispatch, getState) => {
    dispatch(setIsCalculatingBoundary(true))
    const state = getState()
    //const transactionId = state.planEditor.transaction.id
    const subnet = state.planEditor.subnets[subnetId]
    if (!subnet || !state.planEditor.transaction) return null // null? meh
    const transactionId = state.planEditor.transaction.id
    let body, url, method;
    if (subnet.dataType !== "edge_construction_area") {
      const { locked, polygon: newPolygon } = subnet.subnetBoundary
      body = { locked, polygon: newPolygon }
      url = `/service/plan-transaction/${transactionId}/subnet/${subnetId}/boundary`
      method = "post"
    } else {
      body = JSON.parse(JSON.stringify(state.planEditor.subnetFeatures[subnetId].feature))
      body.geometry.type = "Polygon";
      body.geometry.coordinates = subnet.subnetBoundary.polygon.coordinates[0]
      url = `/service/plan-transaction/${transactionId}/edge-construction-area`
      method = "put"
    }

    return AroHttp[method](url, body)
      .then(async (res) => {
        dispatch(setIsCalculatingBoundary(false)) // may need to extend this for multiple boundaries? (make it and int incriment, decriment)
        if (res.data.modifiedSubnets) {
          const updatedSubnetIds = res.data.modifiedSubnets.map((subnet) => subnet.node.id)
          await dispatch(addSubnets({ subnetIds: updatedSubnetIds }))
        }
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
    /*
    subnetIds.forEach(subnetId => {
      dispatch(setFiberAnnotations({[subnetId]: []}, subnetId))
      if (state.planEditor.subnets[subnetId]) {
        activeSubnets.push(subnetId)
      } else if (state.planEditor.subnetFeatures[subnetId]
        && state.planEditor.subnetFeatures[subnetId].subnetId
      ) {
        activeSubnets.push(state.planEditor.subnetFeatures[subnetId].subnetId)
      }
    })
    */
    dispatch(setIsCalculatingSubnets(true))
    const recalcBody = { subnetIds: activeSubnets }

    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet-cmd/recalc`, recalcBody)
      .then(res => {
        console.log(res)
        dispatch(setIsCalculatingSubnets(false))
        batch(() => {
          // remove annotations from recalculated subnets
          res.data.subnets.forEach(subnet => {
            let subnetId = subnet.feature.objectId
            dispatch(setFiberAnnotations({[subnetId]: []}, subnetId))
          })
          // parse changes
          dispatch(parseRecalcEvents(res.data))
        })
      })
      .catch(err => {
        console.error(err)
        dispatch(setIsCalculatingSubnets(false))
      })
  }
}

// TODO: with this we're using state to send messages, 
//  this is incorrect. It points out a flaw in our architecture, fix.
function setFiberRenderRequired (bool) {
  return {
    type: Actions.PLAN_EDITOR_SET_FIBER_RENDER_REQUIRED,
    payload: bool,
  }
}

function setSelectedFiber (fiberObjects) {
  return (dispatch) => {
    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_SET_FIBER_SELECTION,
        payload: fiberObjects,
      })
      dispatch({
        type: Actions.PLAN_EDITOR_SET_FIBER_RENDER_REQUIRED,
        payload: true,
      })
    })
  }
}

// helper function
function getNearestSubnet(planEditor, featureId) {
  if (featureId in planEditor.subnets) return featureId
  if (!(featureId in planEditor.subnetFeatures)) return featureId // may not have loaded yet, lets try it
  return planEditor.subnetFeatures[featureId].subnetId 
}

function getFiberAnnotations (subnetId) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    subnetId = getNearestSubnet(state.planEditor, subnetId)
    if (subnetId){
      AroHttp.get(`/service/plan-transaction/${transactionId}/subnet/${subnetId}/annotations`)
        .then((res) => {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_FIBER_ANNOTATIONS,
            payload: { [subnetId]: res.data }
          })
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }
}

function setFiberAnnotations (fiberAnnotations, subnetId) {
  return (dispatch, getState) => {
    const state = getState()
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    subnetId = getNearestSubnet(state.planEditor, subnetId)
    if (subnetId){
      let annotationList = fiberAnnotations[subnetId] || []
      AroHttp.put(`/service/plan-transaction/${transactionId}/subnet/${subnetId}/annotations`, annotationList)
        .then((res) => {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_FIBER_ANNOTATIONS,
            payload: fiberAnnotations,
          })
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }
}

function leftClickTile (latLng) {
  return (dispatch) => {
    dispatch({
      type: Actions.PLAN_EDITOR_SET_CLICK_LATLNG,
      payload: [latLng.lat(), latLng.lng(), ],
    })
  }
}
// --- //

// helper
function parseRecalcEvents (recalcData) {
  // this needs to be redone and I think we should make a sealed subnet manager
  // that will manage the subnetFeatures list with changes to a subnet (deleting children etc)
  return async(dispatch, getState) => {
    const { subnetFeatures } = getState().planEditor
    let newSubnetFeatures = JSON.parse(JSON.stringify(subnetFeatures))
    let updatedSubnets = {}

    const recalcedSubnetIds = [...new Set(recalcData.subnets.map(subnet => subnet.feature.objectId))]
    // TODO: ??? --->
    // this may have some redundancy in it-- we're only telling the cache to
    // (sadly) clear because we need to reload locations that are in or our of a modified
    // subnet boundary. Another way we could handle this it to pass `subnetLocations`
    // back down with the recalced subnets...
    await dispatch(addSubnets({ subnetIds: recalcedSubnetIds, forceReload: true }))

    // need to recapture state because we've altered it w/ `addSubnets`
    const { planEditor: { subnets } } = getState()
    recalcData.subnets.forEach(subnetRecalc => {
      let subnetId = subnetRecalc.feature.objectId
      // TODO: looks like this needs to be rewritten 
      if (subnets[subnetId]) {
        const subnetCopy = JSON.parse(JSON.stringify(subnets[subnetId]))

        // update fiber
        // TODO: create parser for this???
        // ...also use it above in `addSubnets`, where fiber is added
        subnetCopy.fiber = subnetRecalc.feature

        // update equipment
        subnetRecalc.recalcNodeEvents.forEach(recalcNodeEvent => {
          // bug fix: I think this get done else where
          // given that delete never deletes anything and add always duplicates 
          let objectId = recalcNodeEvent.subnetNode.id
          switch (recalcNodeEvent.eventType) {
            case 'DELETE':
              // need to cover the case of deleteing a hub where we need to pull the whole thing
              delete newSubnetFeatures[objectId]
              let index = subnetCopy.children.indexOf(objectId);
              if (index > -1) {
                subnetCopy.children.splice(index, 1);
              }
              break
            case 'ADD':
              // add only
              //if (subnetCopy.children.includes(objectId)) console.log(`duplicate ADD ${objectId}`) // ALL
              // I don't know why the objectId would alredy be in the children list, we should figure this out
              if (!subnetCopy.children.includes(objectId)) subnetCopy.children.push(objectId)
              // do not break
            case 'MODIFY':
            case 'UPDATE':
              // add || modify || update
              // TODO: this is repeat code from below
              let parsedNode = {
                feature: parseSubnetFeature(recalcNodeEvent.subnetNode),
                subnetId: subnetId,
              }
              newSubnetFeatures[objectId] = parsedNode
              break
          }
        })
        updatedSubnets[subnetId] = subnetCopy
      }
    })

    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_SET_SUBNET_FEATURES,
        payload: newSubnetFeatures,
      })
      dispatch({
        type: Actions.PLAN_EDITOR_ADD_SUBNETS,
        payload: updatedSubnets,
      })
      dispatch({
        type: Actions.PLAN_EDITOR_SET_FIBER_RENDER_REQUIRED,
        payload: true,
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
        let { subnet, subnetFeatures } = parseSubnet(apiSubnet)
        const subnetId = subnet.subnetNode
        subnets[subnetId] = subnet
        allFeatures = { ...allFeatures, ...subnetFeatures }
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
  subnet.coEquipments = subnet.coEquipments.map(feature => parseSubnetFeature(feature))
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
    feature: subnet.subnetNode,
    subnetId: subnet.parentSubnetId,
  }
  // child and coEquipment nodes
  subnet.children.concat(subnet.coEquipments).forEach(feature => {
    subnetFeatures[feature.objectId] = { feature, subnetId }
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
  subnet.coEquipments = subnet.coEquipments.map(feature => feature.objectId)
  subnet.subnetNode = subnet.subnetNode.objectId

  return { subnet, subnetFeatures }
}

// helper function
function parseSubnetFeature (feature) {
  // --- fix service typos - eventually this won't be needed --- //
  feature.objectId = feature.id
  delete feature.id
  if (feature.point) {
    feature.geometry = feature.point
    delete feature.point
    // coEquipment calls it geom not point
  } else if (feature.geom) {
    feature.geometry = feature.geom
    delete feature.geom
  }
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

function parseAPIConstructionAreasToStore(constructionArea) {
    // Move a parsed copy of the construction area in to the global state for subnets
    const newSubnet = parseAPIConstructionAreasToSubnet(constructionArea)

    // Move a parsed copy of the construction area in to the global state for features
    const feature = parseAPIConstructionAreasToFeature(constructionArea)

    return [newSubnet, feature]
}

function parseAPIConstructionAreasToSubnet (constructionArea) {
  const geometry = JSON.parse(JSON.stringify(constructionArea.geometry))
  geometry.type = "MultiPolygon";
  geometry.coordinates = [geometry.coordinates]
  const subnetContents = {
    subnetBoundary: { polygon: geometry },
    subnetNode: constructionArea.objectId,
    children: [],
    state: "recalced",
    parentSubnetId: null,
    coEquipments: [],
    subnetLocationsById: {},
    dataType: constructionArea.dataType
  }      
  return subnetContents
}

function parseAPIConstructionAreasToFeature (constructionArea) {
  constructionArea.geometry.type = "Point";
  constructionArea.geometry.coordinates = [
    (constructionArea.geometry.coordinates[0][0][0] + constructionArea.geometry.coordinates[0][1][0]) / 2,
    (constructionArea.geometry.coordinates[0][0][1] + constructionArea.geometry.coordinates[0][1][1]) / 2
  ]

  return constructionArea;
}

// --- //

export default {
  commitTransaction,
  clearTransaction,
  discardTransaction,
  resumeOrCreateTransaction,
  createFeature,
  //modifyFeature,
  updateFeatureProperties,
  moveFeature,
  deleteFeature,
  //deleteTransactionFeature,
  createConstructionArea,
  moveConstructionArea,
  deleteBoundaryVertex,
  deleteBoundaryVertices,
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
  updatePlanThumbInformation,
  setPlanThumbInformation,
  readFeatures,
  selectEditFeaturesById,
  deselectEditFeatureById,
  addSubnets,
  setSelectedSubnetId,
  onMapClick,
  setCursorLocationIds,
  clearCursorLocationIds,
  addCursorEquipmentIds,
  clearCursorEquipmentIds,
  recalculateBoundary,
  boundaryChange,
  recalculateSubnets,
  setFiberRenderRequired,
  setSelectedFiber,
  setFiberAnnotations,
  getFiberAnnotations,
  leftClickTile,
  showContextMenuForConstructionAreas,
  deleteConstructionArea
}
