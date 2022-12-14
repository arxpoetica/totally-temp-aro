import { klona } from 'klona'
import Actions from '../../common/actions'
import TransactionManager from './transaction-manager'
import Transaction from './transaction'
import AroHttp from '../../common/aro-http'
import MenuItemFeature from '../context-menu/menu-item-feature'
import MenuItemAction from '../context-menu/menu-item-action'
import ContextMenuActions from '../context-menu/actions'
import ResourceActions from '../resource-editor/resource-actions'
import SubnetTileActions from './subnet-tile-actions'
import { ClientSocketManager } from '../../common/client-sockets'
import { batch } from 'react-redux'
import WktUtils from '../../../shared-utils/wkt-utils'
import PlanEditorSelectors from './plan-editor-selectors'
import { constants, validSubnetTypes, validLocationConnectionTypes } from './shared'
import { displayModes } from '../sidebar/constants'
const { DRAFT_STATES, BLOCKER, INCLUSION } = constants
import { Notifier } from '../../common/notifications'
import { SOCKET_EVENTS } from '../../../../../../socket-namespaces'


function resumeOrCreateTransaction() {
  return async(dispatch, getState) => {
    try {
      const { planEditor, plan, user } = getState()
      const { isCommittingTransaction, isEnteringTransaction, draftsState } = planEditor
      if (isCommittingTransaction || isEnteringTransaction) {
        throw new Error('Guarding against dual transactions.')
      }

      dispatch({
        type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
        payload: true,
      })

      // NOTE: need to load resource manager so drop cable
      // length is available for plan-editor-selectors
      const resource = 'network_architecture_manager'
      const { id, name } = plan.resourceItems[resource].selectedManager
      await dispatch(ResourceActions.loadResourceManager(id, resource, name))

      const planId = plan.activePlan.id
      const userId = user.loggedInUser.id
      const sessionId = await ClientSocketManager.getSessionId()
      const draftExists = draftsState === DRAFT_STATES.END_INITIALIZATION
      const { data: transactionData }
        = await TransactionManager.resumeOrCreateTransaction(planId, userId, sessionId, draftExists)

      batch(() => {
        dispatch({
          type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
          payload: false,
        })
        dispatch({
          type: Actions.PLAN_EDITOR_SET_TRANSACTION,
          payload: Transaction.fromServiceObject(transactionData),
        })
      })
    } catch (error) {
      Notifier.error(error)
      dispatch({
        type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION,
        payload: false,
      })
    }
  }
}

function clearTransaction (doOpenView = true) {
  return (dispatch, getState) => {
    // FIXME: this functionality is already below in `unsubscribeFromSocket`
    // but I'm calling it here because there's a race condition deleting the
    // unsubscriber somewhere, and I can't isolate it. So clearing it twice.
    // Once up front here, and then again later when it no longer is necessary.
    // The fix should only call `unsubscriber` once.
    const { plan, planEditor: { socketUnsubscriber: unsubscriber } } = getState()
    unsubscriber()

    dispatch({ type: Actions.PLAN_EDITOR_CLEAR_TRANSACTION })
    batch(() => {
      dispatch(setIsCommittingTransaction(false))
      // DEPRECATED ?
      dispatch({ type: Actions.SELECTION_SET_PLAN_EDITOR_FEATURES, payload: [] })
      dispatch({ type: Actions.PLAN_EDITOR_CLEAR_DRAFTS })
      dispatch({ type: Actions.PLAN_EDITOR_SET_DRAFTS_STATE, payload: null })
      dispatch({ type: Actions.PLAN_EDITOR_CLEAR_SUBNETS })
      dispatch({ type: Actions.PLAN_EDITOR_CLEAR_FEATURES })
      if (doOpenView) {
        const displayMode = plan.activePlan.planType === "RING"
          ? displayModes.EDIT_RINGS
          : displayModes.ANALYSIS
        dispatch({
          type: Actions.TOOL_BAR_SET_SELECTED_DISPLAY_MODE,
          payload: displayMode,
        })
      }
    })
  }
}

// ToDo: there's only one transaction don't require the ID
function commitTransaction (transactionId) {
  return async(dispatch, getState) => {
    try {
      const { isCommittingTransaction, isEnteringTransaction, isCalculatingSubnets, plan } = getState()
      if (isCommittingTransaction || isEnteringTransaction || isCalculatingSubnets) {
        return Promise.reject()
      }

      await dispatch(recalculateSubnets(transactionId))
      dispatch(setIsCommittingTransaction(true))
      await AroHttp.put(`/service/plan-transactions/${transactionId}`)
      dispatch(clearTransaction())

      const { data } = await AroHttp.get(`/service/v1/plan/${plan.activePlan.id}`)
      dispatch({ type: Actions.PLAN_SET_ACTIVE_PLAN, payload: { plan: data } })

    } catch (error) {
      Notifier.error(error)
      dispatch(clearTransaction())
    }
  }
}

// ToDo: there's only one transaction don't require the ID
function discardTransaction (transactionId) {
  return async(dispatch) => {
    try {
      dispatch(setIsCommittingTransaction(true))
      const shouldDiscard = await TransactionManager.discardTransaction(transactionId)
      if (shouldDiscard) {
        dispatch(clearTransaction())
      } else {
        dispatch(setIsCommittingTransaction(false))
      }
    } catch (error) {
      Notifier.error(error)
      dispatch(clearTransaction())
    }
  }
}
function getActiveTransaction() {
  return async(dispatch, getState) => {
    const { plan } = getState();
    try {
      const { data } = await AroHttp.get(`/service/plan-transaction?plan_id=${plan.activePlan.id}`)
      if (data[0]) {
        dispatch({
          type: Actions.PLAN_EDITOR_SET_TRANSACTION_ID_ONLY,
          payload: data[0].id
        })
      }
    } catch (error) {
      Notifier.error(error)
    }
  }
}

const utf8decoder = new TextDecoder()
function subscribeToSocket() {
  return async (dispatch, getState) => {
    try {

      // TODO: move this into a controller

      const unsubscriber = ClientSocketManager.subscribe(SOCKET_EVENTS.SUBNET_DATA, rawData => {
        const data = JSON.parse(utf8decoder.decode(rawData.content))
        let message
        const { userId, updateSession, planTransactionId, rootSubnetId } = data
        // asynchronous set up of skeleton from socket data
        switch (data.subnetNodeUpdateType) {
          case DRAFT_STATES.START_INITIALIZATION: break // no op
          case DRAFT_STATES.INITIAL_STRUCTURE_UPDATE:
            let drafts = {}
            data.initialSubnetStructure.rootSubnets.forEach(rootSubnet => {
              const { boundaryMap, rootSubnetDetail, subnetRefs } = rootSubnet

              for (const ref of subnetRefs) {
                const draft = klona(ref)
                draft.nodeSynced = false
                draft.subnetBoundary = klona(boundaryMap[draft.subnetId] || rootSubnetDetail.subnetBoundary)
                draft.equipment = []
                if (draft.nodeType === 'central_office') { 
                  draft.equipment = klona(rootSubnetDetail.children)
                }
                // for ease, throwing CO on itself for display
                draft.equipment.push(klona(rootSubnetDetail.subnetId))
                drafts[draft.subnetId] = draft
              }
            })
            batch(() => {
              dispatch({
                type: Actions.PLAN_EDITOR_SET_DRAFTS_PROGRESS_TUPLE,
                payload: [0, Object.keys(drafts).length],
              })
              dispatch({ type: Actions.PLAN_EDITOR_SET_DRAFTS, payload: drafts })
              dispatch({ type: Actions.PLAN_EDITOR_SET_IS_ENTERING_TRANSACTION, payload: false })
            })
            break
          case DRAFT_STATES.START_SUBNET_TREE: break // no op
          case DRAFT_STATES.SUBNET_NODE_SYNCED:
            const { subnetBoundary, faultTreeSummary, subnetRef } = data.subnetNodeSyncEvent
            const { subnetId } = subnetRef
            const draftProps = {}
            draftProps[subnetId] = { nodeSynced: true }
            if (Object.keys(faultTreeSummary).length) {
              draftProps[subnetId].faultTreeSummary = faultTreeSummary
            }
            if (Object.keys(subnetBoundary).length) {
              draftProps[subnetId].subnetBoundary = subnetBoundary
            }
            if (Object.keys(draftProps[subnetId]).length) {
              dispatch({
                type: Actions.PLAN_EDITOR_MERGE_DRAFT_PROPS,
                payload: draftProps,
              })
            }
            const { planEditor: { draftProgressTuple } } = getState()
            dispatch({
              type: Actions.PLAN_EDITOR_SET_DRAFTS_PROGRESS_TUPLE,
              payload: [draftProgressTuple[0] + 1, draftProgressTuple[1]],
            })
            break
          case DRAFT_STATES.END_SUBNET_TREE: break // no op
          case DRAFT_STATES.END_INITIALIZATION: break // no op
          case DRAFT_STATES.SYNC_ROOT_LOCATIONS:
            // TODO: parse locations to dict
            // TODO: Harry fix your enums! 
            let enumPatch = {
              'small': 'small_businesses', 
              'medium': 'medium_businesses',
              'large': 'large_businesses',
            }
            let enumRank = {
              'household': 0,
              'small_businesses': 1, 
              'medium_businesses': 2,
              'large_businesses': 3,
              'celltower': 4,
            }
            let locations = {
              households: {},
              groups: {},
            }
            
            for (const location of data.rootLocations) {
              if (!location.ids.length) {
                //console.log(location)
                // TODO: thses are dropcoils what do we do with dropcoils?
              } else {
                // TOS: need a hash for each household 
                //  and a hash for groups with identical Lat Long 
                //  this will also have agrigate info like "highest ranking location type" 
                // This layer will not be interactive
                //dispatch(SubnetTileActions.setSubnetsData(tileDataBySubnet))
                
                //let locationId = location.ids[0].uuid // what is there are more than one?
                // TODO: system wide change ALL "xx_businesses" to "xx" eg "medium_businesses" to "medium" - a lot in settings 
                
                // populate the group list
                let groupId = `${location.point.coordinates[1]},${location.point.coordinates[0]}`
                // if (locations.groups[groupId]) {
                //   console.log(' ------- ID ALREADY EXISTS: two locations have the same Lat Long ------- ')
                //   console.log(locations.groups[groupId])
                //   console.log(location)
                // }
                
                // TODO: formalize the structure of tile data items
                //  id: {point: {latitude, longitude}}
                let group = {
                  locationEntityType: 'household',
                  selected: true,
                  ids: location.ids.map(household => household.uuid),
                  point: {
                    latitude: location.point.coordinates[1], 
                    longitude: location.point.coordinates[0],
                  },
                }
                if ('selected' in location) group.selected = location.selected

                if (locations.groups[groupId]) {
                  // a group already exists at this point (uggh)
                  //  so we need to agrigate with that
                  group.locationEntityType = locations.groups[groupId].locationEntityType // will either be household or higher
                  group.selected = group.selected || locations.groups[groupId].selected
                  group.ids = locations.groups[groupId].ids.concat(group.ids)
                }
                

                // populate the household list
                for (let household of location.ids) {
                  if (enumPatch[household.locationEntityType]) {
                    household.locationEntityType = enumPatch[household.locationEntityType]
                  }
                  household.selected = location.selected
                  locations.households[household.uuid] = household

                  // - group locationEntityType (an aggregateType) is the highest ranking locationType in the list - 
                  if (enumRank[household.locationEntityType] > enumRank[group.locationEntityType]) {
                    group.locationEntityType = household.locationEntityType
                  }
                }
                //locations[locationId] = location
                locations.groups[groupId] = group
              }
              // if (location.ids.length > 1) {
              //   console.log('------------ HERE ------------')
              //   console.log(location)
              // }
            }
            dispatch({
              type: Actions.PLAN_EDITOR_SET_DRAFT_LOCATIONS,
              payload: locations,
            })
            dispatch(SubnetTileActions.setSubnetData('all', locations.groups))
            break
          case DRAFT_STATES.ERROR_SUBNET_TREE:
            message = `Type ${data.subnetNodeUpdateType} for SUBNET_DATA socket channel with `
            message += `user id ${userId}, transaction id ${planTransactionId}, `
            message += `session id ${updateSession}, and root subnet id ${rootSubnetId}.`
            Notifier.error(new Error(message))
            break
          default:
            message = `Unhandled type ${data.subnetNodeUpdateType} for SUBNET_DATA socket channel with `
            message += `user id ${userId}, transaction id ${planTransactionId}, `
            message += `session id ${updateSession}, and root subnet id ${rootSubnetId}.`
            Notifier.error(new Error(message))
        }

        if (DRAFT_STATES[data.subnetNodeUpdateType]) {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_DRAFTS_STATE,
            payload: data.subnetNodeUpdateType,
          })
        }

      })
      dispatch({
        type: Actions.PLAN_EDITOR_SET_SOCKET_UNSUBSCRIBER,
        payload: unsubscriber,
      })
      // console.log('...subscribed to subnet socket channel...')
    } catch (error) {
      Notifier.error(error)
    }
  }
}

function unsubscribeFromSocket() {
  return async (dispatch, getState) => {
    try {
      const { planEditor: { socketUnsubscriber: unsubscriber } } = getState()
      unsubscriber()
      // console.log('...unsubscribed from subnet socket channel...')
    } catch (error) {
      Notifier.error(error)
    }
    dispatch({ type: Actions.PLAN_EDITOR_CLEAR_SOCKET_UNSUBSCRIBER })
  }
}

function createFeature(feature) {
  return async(dispatch, getState) => {
    try {
      const { planEditor, plan } = getState()
      const transactionId = planEditor.transaction && planEditor.transaction.id
      const isRingPlan = plan.activePlan.planType === 'RING'

      const url = `/service/plan-transaction/${transactionId}/subnet_cmd/update-children`
      const commandsBody = { childId: feature, type: 'add' }
      // we're relying on `selectedSubnetId` to find the selected subnet for context
      let { drafts, subnetFeatures, selectedSubnetId } = planEditor
      if (selectedSubnetId) {
        // get the correct `selectedSubnetId` since it exists
        selectedSubnetId = drafts[selectedSubnetId]
          ? selectedSubnetId
          : subnetFeatures[selectedSubnetId].subnetId
        commandsBody.subnetId = selectedSubnetId
      } else {
        // otherwise, this call just ensures we have the central office
        // since we don't know the context since no subnet is selected
        const rootSubnet = Object.values(planEditor.drafts).find(draft => {
          return draft.nodeType === 'central_office' || draft.nodeType === 'subnet_node'
        })
        if (rootSubnet) await dispatch(addSubnets({ subnetIds: [rootSubnet.subnetId] }))
      }

      // this can return a 500 if adding a CO to a blank plan 
      // bug: #182578571 
      const updateResponse = await AroHttp.post(url, { commands: [commandsBody] })
      const { subnetUpdates, equipmentUpdates } = updateResponse.data

      let subnetId
      if (isRingPlan && selectedSubnetId) {
        // For a standard plan there should always be modified subnets however
        // that is not the case for ring plans as the rootSubnet is not real and
        // is used to work in the single parent hirearchy so we can just grab that
        subnetId = selectedSubnetId
      } else {
        // looking to modified first could actually be problematic...
        // FIXME: how do we know which is the correct subnet to be attaching stuff to?
        const modified = subnetUpdates.find(subnet => subnet.type === 'modified')
        if (modified) {
          subnetId = modified.subnet.id
        } else {
          // otherwise, it has to be a new one...
          const created = subnetUpdates.find(subnet => subnet.type === 'created')
          subnetId = created.subnet.id
        }
      }

      // 2. wait for return, and run rest after
      const draftsClone = klona(getState().planEditor.drafts)

      // new draft equipment (just subnets are added as equipment)
      let newDraftEquipment = subnetUpdates.map(update => update.subnet)
      // new drafts
      const newDraftProps = {}
      for (const update of subnetUpdates) {
        const { subnet, subnetBoundary } = update

        // unfortunately have to make the extra call to get the fault tree
        // also, sometimes subnetBoundary is `null` so need to perchance call that
        const query = `${subnetBoundary ? '' : 'selectionTypes=BOUNDARIES&'}selectionTypes=FAULT_TREE`
        const url = `/service/plan-transaction/${transactionId}/subnet/${subnet.id}?${query}`
        const { data } = await AroHttp.get(url)

        const isRoot = data.parentSubnetId === null
        if (isRoot) {
          // get original root/co draft subnet
          const rootDraftClone = draftsClone[subnet.id]
          if (rootDraftClone) {
            newDraftEquipment = [...rootDraftClone.equipment, ...newDraftEquipment]
              // make sure there are no duplicates
              .filter((equip, index, self) => {
                const foundIndex = self.findIndex(compare => compare.id === equip.id)
                return index === foundIndex
              })
          }
        }
        newDraftProps[subnet.id] = {
          subnetId: subnet.id,
          nodeType: subnet.networkNodeType,
          parentSubnetId: data.parentSubnetId,
          nodeSynced: true,
          equipment: isRoot ? newDraftEquipment : [],
          subnetBoundary: subnetBoundary || data.subnetBoundary,
          faultTreeSummary: data.faultTree.faultTreeSummary,
        }
      }

      // make sure equipment creations/modifications land
      const subnetCopy = klona(getState().planEditor.subnets[subnetId])
      const newFeatures = {}

      for (const equipment of equipmentUpdates) {
        // fix difference between id names
        const parsedFeature = parseSubnetFeature(equipment.subnetNode)
        newFeatures[parsedFeature.objectId] = {
          feature: parsedFeature,
          subnetId: subnetId,
        }
        if (subnetCopy) {
          const uniqueChildren = new Set([...subnetCopy.children, parsedFeature.objectId])
          subnetCopy.children = [...uniqueChildren]
        }
      }
      let subnetDiffDict = {}
      subnetDiffDict[subnetId] = subnetCopy
      if (Object.keys(newDraftProps).length && newDraftEquipment.length) {
        dispatch({ type: Actions.PLAN_EDITOR_MERGE_DRAFT_PROPS, payload: newDraftProps })
      }
      batch(async() => {
        if (Object.keys(newFeatures).length) {
          dispatch({ type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES, payload: newFeatures })
        }
        if (subnetCopy) {
          dispatch({ type: Actions.PLAN_EDITOR_ADD_SUBNETS, payload: subnetDiffDict })
        }
      })
    } catch (error) {
      Notifier.error(error)
    }
  }
}

function updateFeatureProperties(feature) {
  return async(dispatch, getState) => {
    const { planEditor } = getState()
    const { transaction, features, drafts, subnetFeatures } = planEditor
    const transactionId = transaction && transaction.id
    const parentSubnetId = PlanEditorSelectors.getRootOfFeatureUtility(drafts, subnetFeatures, feature.objectId)
    try {
      // Do a PUT to send the equipment over to service 
      // parentSubnetId SHOULD be the parent BUT terminals are NOT subnets so it would use the CO 
      let url = `/service/plan-transaction/${transactionId}/subnet-equipment`
      // by parentSubnetId it is meant `root` by terms of service definition
      if (parentSubnetId) url += `?parentSubnetId=${parentSubnetId}`
      const result = await AroHttp.put(url, feature)

      // Decorate the created feature with some default values
      const featureEntry = features[feature.objectId]
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
      Notifier.error(error)
    }
  }
}

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
      const subnetsCopy = klona(getState().planEditor.subnets)
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
    } catch (error) {
      Notifier.error(error)
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
      const length = mapObject.getPath().getLength()
      for (let marker of vertices) {
        if (marker && marker.title && length > 3) {
          if (Number(marker.title) >= length) marker.title = '0';
          mapObject.getPath().removeAt(Number(marker.title))
        }
      }     

      callBack();
  }
}

// helper, should probably be in a utils file
function toLabel (name) {
 return name.toLowerCase().replaceAll('_', ' ').replaceAll(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase())
}

function showContextMenuForList (features, coords) {
  // TODO: include locations on right click
  return (dispatch) => {
    let menuItemFeatures = []
    // group by dataType
    let featuresByType = {}
    features.forEach(feature => {
      let dataType = 'undefined_type'
      if (feature.dataType) dataType = feature.dataType
      if (!(dataType in featuresByType)) featuresByType[dataType] = []
      featuresByType[dataType].push(feature)
    })
    // for location connectors and terminals 
    //  if there are more than one add a menu item "merge"
    let mergableTypes = [
      'location_connector',
      'bulk_distribution_terminal',
      //'fiber_distribution_terminal',
    ]
    mergableTypes.forEach(mergableType => {
      if (mergableType in featuresByType && featuresByType[mergableType].length > 1) {
        let label = `${featuresByType[mergableType].length} ${toLabel(mergableType)}s`
        let menuAction = new MenuItemAction('MERGE', 'Merge All', 'PlanEditorActions', 'mergeTerminals', false, klona(featuresByType[mergableType]))
        let menuItemFeature = new MenuItemFeature(null, label, [menuAction])
        featuresByType[mergableType].unshift(
          {
            dataType: 'GROUP_HEADER',
            menuItemFeature,
          }
        )
      }
    })
    // order by hierarchy
    // in leu of proper ordering mechanism
    let topList = []
    let orderedFeatureList = []
    let endList = []
    for (const [dataType, featureList] of Object.entries(featuresByType)) {
      if (dataType === 'central_office'
        || dataType === 'subnet_node'
      ) {
        topList = topList.concat(featureList)
      } else if (mergableTypes.includes(dataType)) {
        endList = endList.concat(featureList)
      } else {
        orderedFeatureList = orderedFeatureList.concat(featureList)
      }
    }
    orderedFeatureList = topList.concat(orderedFeatureList).concat(endList)
    
    orderedFeatureList.forEach(feature => {
      var menuActions = []
      if (feature.dataType === 'GROUP_HEADER') { // this is a little hacky, we'll clean it up later ... probably
        menuItemFeatures.push(feature.menuItemFeature)
      } else if (feature.dataType === "edge_construction_area") {
        menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteConstructionArea', false, feature.objectId))
        menuItemFeatures.push(new MenuItemFeature('CONSTRUCTION_AREA', 'Construction Area', menuActions))
      } else {
        let label = 'Equipment'
        if (feature.dataType) label = toLabel(feature.dataType)
        menuActions.push(new MenuItemAction('DELETE', 'Delete', 'PlanEditorActions', 'deleteFeature', false, feature.objectId))
        menuItemFeatures.push(new MenuItemFeature('EQUIPMENT', label, menuActions))
      }
    })
    if (menuItemFeatures.length) {
      dispatch(ContextMenuActions.setContextMenuItems(menuItemFeatures))
      dispatch(ContextMenuActions.showContextMenu(coords.x, coords.y))
    }
  }
}

function showContextMenuForLocations (featureIds, event) {
  return (dispatch, getState) => {
    // TODO: if there are more than one add a menu item remove all, add all
    const state = getState()
    const selectedSubnetId = state.planEditor.selectedSubnetId
    if (featureIds.length <= 0 || !selectedSubnetId) return Promise.resolve()
    // selectedSubnetLocations will be connected locations IF the selectedSubnetId is a location connector type
    //  if not it will be the list of all subnet locations
    const selectedSubnetLocations = PlanEditorSelectors.getLocationsForSelectedFeature(state)
    let terminalId = null
    let terminalLocations = null
    let subnetId = null
    let subnetLocations = null
    // state.planEditor.subnets[subnetId].subnetLocationsById[locationId].parentEquipmentId
    if ( validLocationConnectionTypes.includes(state.planEditor.subnetFeatures[selectedSubnetId].feature.networkNodeType) ) {
      // the selected feature can have location connections
      terminalId = selectedSubnetId
      terminalLocations = selectedSubnetLocations
      subnetId = state.planEditor.subnetFeatures[terminalId].subnetId
      subnetLocations = state.planEditor.subnets[subnetId].subnetLocationsById
    } else {
      // the selected feature can NOT have locations attached so their children or grandchildren must 
      subnetId = selectedSubnetId
      subnetLocations = selectedSubnetLocations
    }

    var menuItemFeatures = []
    featureIds.forEach(location => {
      let locationId = location
      if (typeof location === 'object') locationId = location.object_id
      if (subnetLocations[locationId]){
        // the location is in the focused subnet
        var menuActions = []
        if (!terminalLocations) {
          // the selected node is NOT a location connector type so all locations get the disconnect option
          // filter out abandoned locations
          if (state.planEditor.subnets[subnetId]
            && state.planEditor.subnets[subnetId].subnetLocationsById[locationId]
            && state.planEditor.subnets[subnetId].subnetLocationsById[locationId].parentEquipmentId
          ) {
            // TODO: avoid duplicate unassignLocation code
            menuActions.push(new MenuItemAction('REMOVE', 'Unassign from terminal', 'PlanEditorActions', 'unassignLocation', false, locationId, subnetId))
          }
        } else {
          // there IS a location connector type selected so filter for add remove
          if (terminalLocations[locationId]) {
            menuActions.push(new MenuItemAction('REMOVE', 'Unassign from terminal', 'PlanEditorActions', 'unassignLocation', false, locationId, subnetId))
          } else {
            // either there is not a location connector type choosen OR the location isn't a part
            menuActions.push(new MenuItemAction('ADD', 'Assign to terminal', 'PlanEditorActions', 'assignLocation', false, locationId, terminalId))
          }
        }

        if (menuActions.length > 0) {
          menuItemFeatures.push(new MenuItemFeature('LOCATION', 'Location', menuActions))
        }
      }// else the location is NOT in the focused subnet so do not include it in the menu
    })
    if (menuItemFeatures.length <= 0) return Promise.resolve()
    const coords = WktUtils.getXYFromEvent(event)
    dispatch(ContextMenuActions.setContextMenuItems(menuItemFeatures))
    dispatch(ContextMenuActions.showContextMenu(coords.x, coords.y))
  }
}

// helper
function _updateSubnetFeatures (subnetFeatures) {
  return async (dispatch, getState) => {
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
    
    if (!transactionId || commands.length <= 0) return Promise.resolve()
    // TODO: break this out
    const body = {commands}
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        // we do NOT get the child feature back in the result
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: subnetFeaturesById,
        })
        dispatch(recalculateSubnets(transactionId, subnetIds))
        
      })
      .catch(error => Notifier.error(error))
  }
}

// helper
function _spliceLocationFromTerminal (state, locationId, subnetId) {
  let terminalId = null
  if (state.planEditor.subnets[subnetId].subnetLocationsById[locationId]
    && state.planEditor.subnets[subnetId].subnetLocationsById[locationId].parentEquipmentId
  ) {
    terminalId = state.planEditor.subnets[subnetId].subnetLocationsById[locationId].parentEquipmentId
  }
  if (!terminalId) return null

  let subnetFeature = state.planEditor.subnetFeatures[terminalId]
  if (!subnetFeature) return null
  subnetFeature = klona(subnetFeature)
  
  let locationLinkIndex = null
  let index = subnetFeature.feature.dropLinks.findIndex(dropLink => {
    //planEditor.subnetFeatures["0c9e9415-e5e2-4146-9594-bb3057ca54dc"].feature.dropLinks[0].locationLinks[0].locationId
    // return (0 <= dropLink.locationLinks.findIndex(locationLink => {
    //   return (locationId === locationLink.locationId)
    // }))
    locationLinkIndex = dropLink.locationLinks.findIndex(locationLink => {
      return (locationId === locationLink.locationId)
    })
    return (0 <= locationLinkIndex)
  })
  //console.log({index, locationLinkIndex})
  if (index !== -1) {
    subnetFeature.feature.dropLinks[index].locationLinks.splice(locationLinkIndex, 1)
    if (!subnetFeature.feature.dropLinks[index].locationLinks.length) {
      subnetFeature.feature.dropLinks.splice(index, 1)
    }
    //console.log(subnetFeature)
    return subnetFeature
  } else {
    return null
  }
}

function unassignLocation (locationId, subnetId) {
  // we require the subnet ID to avoid a search (most times the caller already has this info)
  return (dispatch, getState) => {
    const state = getState()
    let subnetFeature = _spliceLocationFromTerminal(state, locationId, subnetId)
    // removeing location's parentEquipmentId is unneeded because we do an immeadiate recalc which will update the location list
    if (subnetFeature) {
      return dispatch(_updateSubnetFeatures([subnetFeature]))
    } else {
      return Promise.resolve()
    }
  }
}

function assignLocation (locationId, terminalId) {
  return (dispatch, getState) => {
    const state = getState()
    let features = []

    let toFeature = state.planEditor.subnetFeatures[terminalId]
    toFeature = klona(toFeature)
    let subnetId = toFeature.subnetId

    // unassign location if location is assigned
    let fromFeature = _spliceLocationFromTerminal(state, locationId, subnetId)
    if (fromFeature) features.push(fromFeature)
    // #183319067 TODO: should we check for a drop link to the same lat/lng 
    //  and add the location to that instead of making a new one?
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

// TODO: this function is VERY not DRY (sopping wet!) it points to the need for a restructure of the subnet actions
function mergeTerminals (terminals) {
  return (dispatch, getState) => {
    const state = getState()
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id
    if (!transactionId) return Promise.resolve()

    let toFeature = klona(state.planEditor.subnetFeatures[terminals[0].objectId]) // we're merging all terminals into the first one in the list
    let toTerminal = toFeature.feature
    terminals.shift() // remove element 0
    let deleteList = []
    let commands = []
    terminals.forEach(terminal => {
      let terminalData = klona(state.planEditor.subnetFeatures[terminal.objectId])
      let fromTerminal = terminalData.feature
      let subnetId = terminalData.subnetId
      toTerminal.dropLinks = toTerminal.dropLinks.concat(fromTerminal.dropLinks)
      deleteList.push(terminal.objectId)
      commands.push({
        childId: unparseSubnetFeature(fromTerminal),
        subnetId,
        type: 'delete',
      })
    })

    commands.push({
      childId: unparseSubnetFeature(toTerminal),
      subnetId: toFeature.subnetId,
      type: 'update',
    })
    let updateList = {}
    updateList[toTerminal.objectId] = toFeature
    
    // TODO: break this out
    if (commands.length <= 0) return Promise.resolve()
    const body = {commands}
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(result => {
        // we do NOT get the child feature back in the result

        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: updateList,
        })
        dispatch({ 
          type: Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURES,
          payload: deleteList,
        })
        dispatch({ // deselect anything that was deleted
          type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURES, 
          payload: deleteList,
        })

        dispatch(recalculateSubnets(transactionId))
      })
      .catch(error => Notifier.error(error))
  }
}

function showContextMenuForBoundary (mapObject, x, y, vertex, callBack) {  
  return (dispatch) => {
    const menuActions = []
    menuActions.push(
      new MenuItemAction(
        vertex.length > 1 ? 'DELETE_ALL' : 'DELETE',
        vertex.length > 1 ? 'Delete All' : 'Delete',
        'PlanEditorActions',
        'deleteBoundaryVertices',
        vertex.length === 1, // makes action repeatable if one vertex
        mapObject,
        vertex,
        // Callback is utilized to update the local state of the react class if it is a multi-delete.
        callBack
      )
    )

    const menuItemFeature = new MenuItemFeature(
      'BOUNDARY',
      `Boundary ${vertex.length > 1 ? 'Vertices' : 'Vertex' }`,
      menuActions
    )

    // Show context menu
    dispatch(ContextMenuActions.setContextMenuItems([menuItemFeature]))
    dispatch(ContextMenuActions.showContextMenu(x, y))
  }
}

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

function setIsRecalculating(isRecalculating) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_RECALCULATING,
    payload: isRecalculating,
  }
}

function setIsCalculatingSubnets (isCalculatingSubnets) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CALCULATING_SUBNETS,
    payload: isCalculatingSubnets,
  }
}

function setIsCalculatingBoundary (isCalculatingBoundary) {
  return {
    type: Actions.PLAN_EDITOR_SET_IS_CALCULATING_BOUNDARY,
    payload: isCalculatingBoundary,
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
    const body = klona(state.planEditor.subnetFeatures[payload.key].feature)
    const isBlocker = payload.planThumbInformation === BLOCKER.KEY
    body.geometry.type = "Polygon";
    body.geometry.coordinates = subnet.subnetBoundary.polygon.coordinates[0]
    body.costMultiplier = isBlocker
      ? BLOCKER.COST_MULTIPLIER
      : INCLUSION.COST_MULTIPLIER
    body.priority = isBlocker
      ? BLOCKER.PRIORITY
      : INCLUSION.PRIORITY


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
      .catch(error => Notifier.error(error))
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
    const subnetFeature = klona(state.planEditor.subnetFeatures[featureId])
    const subnetId = subnetFeature.subnetId
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    subnetFeature.feature.geometry.coordinates = coordinates
    const body = {
      commands: [{
        childId: unparseSubnetFeature(subnetFeature.feature),
        subnetId,
        type: 'update',
      }]
    }
    return AroHttp.post(`/service/plan-transaction/${transactionId}/subnet_cmd/update-children`, body)
      .then(() => {
        dispatch({
          type: Actions.PLAN_EDITOR_UPDATE_SUBNET_FEATURES,
          payload: {[featureId]: subnetFeature}
        })
        // only update draft if equipment (on co only) exists
        const draft = state.planEditor.drafts[subnetId]
        const equipmentIndex = draft.equipment.findIndex(({ id }) => id === featureId)
        if (equipmentIndex >= 0) {
          const draftClone = klona(draft)
          draftClone.equipment[equipmentIndex].point.coordinates = coordinates
          dispatch({ type: Actions.PLAN_EDITOR_UPDATE_DRAFT, payload: draftClone })
        }
      })
      .catch(error => Notifier.error(error))
  }
}

function moveConstructionArea (objectId, newCoordinates) {
  return async (dispatch, getState) => {
    // Take in the new cordinates and move the entire polygon by the difference between them and the old coordinates
    const state = getState()
    let constructionAreaSubnet = klona(state.planEditor.subnets[objectId])
    let constructionAreaFeature = klona(state.planEditor.subnetFeatures[objectId].feature)
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
    const body = klona(constructionAreaFeature)
    body.geometry.type = "Polygon";
    body.geometry.coordinates = constructionAreaSubnet.subnetBoundary.polygon.coordinates[0]
    const featurePayload = {};
    const subnetsCopy = klona(state.planEditor.subnets)
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

// accept ConstructionArea then pass to deleteConstructionArea
function deleteFeature (featureId) {
  return deleteFeatures([featureId])
}
function deleteFeatures (featureIds) {
  return async(dispatch, getState) => {
    try {
      const state = getState()
      const planEditor = state.planEditor
      const { selectedSubnetId, transaction, drafts } = planEditor
      const transactionId = transaction && transaction.id
      const url = `/service/plan-transaction/${transactionId}/subnet_cmd/update-children`
      let nextSelectedSubnetId = selectedSubnetId
      let commands = []
      // TODO: check for construction_area and run deleteConstructionArea
      featureIds.forEach(featureId => {
        const { subnetId, feature } = klona(planEditor.subnetFeatures[featureId])
        commands.push({
          childId: unparseSubnetFeature(feature),
          subnetId,
          type: 'delete',
        })
        // if deleted equipment is currently selected, move selection to parent
        if (featureId === selectedSubnetId) nextSelectedSubnetId = subnetId
      })
      await AroHttp.post(url, {commands})
      
      let rootDrafts = klona(PlanEditorSelectors.getRootDrafts(state))
      // TODO: removing an equipment from a root draft is not an OK process at the moment
      //  this is pretty inefficient, we should use a dictionary instead of array
      //  and this process should be in the same place as PLAN_EDITOR_REMOVE_DRAFT
      Object.values(rootDrafts).forEach(rootDraft => {
        featureIds.forEach(featureId => {
          const equipmentIndex = rootDraft.equipment.findIndex(({ id }) => id === featureId)
          if (equipmentIndex >= 0) {
            rootDraft.equipment.splice(equipmentIndex, 1)
          }
        })
      })
      
      batch(() => {
        // TODO: make these dispatches plural so we don't need the foreach
        featureIds.forEach(featureId => {
          dispatch({ type: Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE, payload: featureId })
          dispatch({ type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE, payload: featureId })
          // TODO: break out a draft change function PLAN_EDITOR_REMOVE_DRAFT and PLAN_EDITOR_UPDATE_DRAFT
          dispatch({ type: Actions.PLAN_EDITOR_REMOVE_DRAFT, payload: featureId })
        })
        
        // if deleted equipment is currently selected, move selection to parent
        if (nextSelectedSubnetId !== selectedSubnetId) dispatch(setSelectedSubnetId(nextSelectedSubnetId))
        /*
        // if equipment exists on draft (only on CO), delete it too
        const rootDraft = Object.values(drafts).find(draft => draft.equipment.length)
        const equipmentIndex = rootDraft.equipment.findIndex(({ id }) => id === featureId)
        if (equipmentIndex >= 0) {
          const draftClone = klona(rootDraft)
          draftClone.equipment.splice(equipmentIndex, 1)
          dispatch({ type: Actions.PLAN_EDITOR_UPDATE_DRAFT, payload: draftClone })
        }
        */
        Object.values(rootDrafts).forEach(rootDraft => {
          dispatch({ type: Actions.PLAN_EDITOR_UPDATE_DRAFT, payload: rootDraft })
        })

        dispatch(recalculateSubnets(transactionId))
      })
    } catch (error) {
      Notifier.error(error)
    }
  }
}

// TODO: accept list
function deleteConstructionArea (featureId) {
  return async (dispatch, getState) => {
    const state = getState()
    let subnetFeature = state.planEditor.subnetFeatures[featureId]
    let subnet = state.planEditor.subnets[featureId]
    subnetFeature = klona(subnetFeature)
    subnet = klona(subnet) // TODO: no longer contains construction areas? 
    let transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    await AroHttp.delete(`/service/plan-transaction/${transactionId}/edge-construction-area/${featureId}`)

    const rootDrafts = PlanEditorSelectors.getRootDrafts(state)
    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_REMOVE_SUBNET_FEATURE,
        payload: featureId
      })
      dispatch({
        type: Actions.PLAN_EDITOR_DESELECT_EDIT_FEATURE,
        payload: featureId,
      })
      dispatch(recalculateSubnets(transactionId))
      dispatch(setSelectedSubnetId(Object.values(rootDrafts)[0].subnetId))
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
          .catch(error => Notifier.error(error))
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
    // NOTE: this seemingly unnecessary call to `readFeatures` puts the features from service in state
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
        let subnetToSelect = validFeatures[0]
        batch(() => {
          dispatch({
            type: Actions.PLAN_EDITOR_SET_SELECTED_EDIT_FEATURE_IDS, 
            payload: validFeatures,
          })
          dispatch(setSelectedSubnetId(subnetToSelect))
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
    const subnetsCopy = klona(getState().planEditor.subnets)
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

function addSubnets({ subnetIds = [], forceReload = false }) {
  return async (dispatch, getState) => {

    try {
      const { planEditor } = getState()
      const { transaction, subnets } = planEditor

      // this little dance only fetches uncached (or forced to reload) subnets
      const cachedSubnetIds = Object.keys(subnets)
      let uncachedSubnetIds = subnetIds.filter(id => forceReload || !cachedSubnetIds.includes(id))
      // we have everything, no need to query service
      if (uncachedSubnetIds.length <= 0) {
        return subnetIds
      }

      dispatch(setIsCalculatingSubnets(true))

      const apiSubnets = []
      // TODO: break this out into fiber actions
      for (const subnetId of uncachedSubnetIds) {
        const subnetUrl = `/service/plan-transaction/${transaction.id}/subnet/${subnetId}`
        const response = await AroHttp.get(subnetUrl)
        const subnet = response.data
        // what happens if service doesn't return a subnet? Not sure that's possible here
        if (!subnet.parentSubnetId) {
          dispatch(getConsructionAreaByRoot(subnet))
          dispatch(getFiberAnnotations(subnetId))
        }
        const fiberUrl = `/service/plan-transaction/${transaction.id}/subnetfeature/${subnetId}`
        const fiberResult = await AroHttp.get(fiberUrl)
        subnet.fiber = fiberResult.data
        apiSubnets.push(subnet)
      }

      dispatch(parseAddApiSubnets(apiSubnets))
      dispatch(setIsCalculatingSubnets(false))
      return subnetIds

    } catch (error) {
      Notifier.error(error)
      dispatch(setIsCalculatingSubnets(false))
      return Promise.reject()
    }
  }
}

function setSelectedSubnetId (selectedSubnetId) {
  return (dispatch, getState) => {
    batch(async() => {
      try {
        if (!selectedSubnetId) {
          dispatch({ type: Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID, payload: null })
          dispatch({ type: Actions.PLAN_EDITOR_SET_VISIBLE_EQUIPMENT_TYPES, payload: [] })
        } else {
          const { drafts } = getState().planEditor
          // only load a new subnet if you have a subnet selected
          if (drafts[selectedSubnetId]) await dispatch(addSubnets({ subnetIds: [selectedSubnetId] }))
          // otherwise it's just a piece of equipment
          // so go ahead and pass the `selectedSubnetId` along...
          dispatch({
            type: Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID,
            payload: selectedSubnetId,
          })

          const state = getState()
          const { subnetFeatures } = state.planEditor
          const { feature } = subnetFeatures[selectedSubnetId]
          const nodeType = feature.networkNodeType || feature.dataType
          const { equipmentDefinitions, addableTypes } = PlanEditorSelectors.getEquipmentDraggerInfo(state)
          const visibleEquipmentTypes = addableTypes.filter(type => {
            return equipmentDefinitions[nodeType].allowedChildEquipment.includes(type)
          })
          dispatch({ type: Actions.PLAN_EDITOR_SET_VISIBLE_EQUIPMENT_TYPES, payload: visibleEquipmentTypes })
        }
      } catch (error) {
        Notifier.error(error)
        dispatch({ type: Actions.PLAN_EDITOR_SET_SELECTED_SUBNET_ID, payload: null })
        dispatch({ type: Actions.PLAN_EDITOR_SET_VISIBLE_EQUIPMENT_TYPES, payload: [] })
      }
    })
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
    if (!subnet || !state.planEditor.transaction) return Promise.resolve()
    const transactionId = state.planEditor.transaction.id
    let body, url, method;
    if (subnet.dataType !== "edge_construction_area") {
      const { locked, polygon: newPolygon } = subnet.subnetBoundary
      body = { locked, polygon: newPolygon }
      url = `/service/plan-transaction/${transactionId}/subnet/${subnetId}/boundary`
      method = "post"
    } else {
      body = klona(state.planEditor.subnetFeatures[subnetId].feature)
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
      .catch(error => {
        Notifier.error(error)
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
      dispatch({ type: Actions.PLAN_EDITOR_SET_BOUNDARY_DEBOUNCE, payload: {subnetId, timeoutId} })
      dispatch({ type: Actions.PLAN_EDITOR_UPDATE_SUBNET_BOUNDARY, payload: {subnetId, geometry} })
      if (state.planEditor.drafts[subnetId]) {
        // Handle case where the boundary's subnet is not in the drafts (Route Adjusters)
        const draftClone = klona(state.planEditor.drafts[subnetId])
        draftClone.subnetBoundary.polygon = geometry
        dispatch({ type: Actions.PLAN_EDITOR_UPDATE_DRAFT, payload: draftClone })
      }
    })
  }
}

function recalculateSubnets(transactionId, subnetIds = []) {
  return async(dispatch, getState) => {
    try {
      const state = getState()
      if (state.isCalculatingSubnets) return Promise.reject()
      let activeSubnets = []
      dispatch(setIsRecalculating(true))
      dispatch(setIsCalculatingSubnets(true))
      const recalcBody = { subnetIds: activeSubnets }

      const url = `/service/plan-transaction/${transactionId}/subnet-cmd/recalc`
      const res = await AroHttp.post(url, recalcBody)

      dispatch(setIsCalculatingSubnets(false))
      dispatch(setIsRecalculating(false))
      batch(() => {
        // remove annotations from recalculated subnets
        res.data.subnets.forEach(subnet => {
          let subnetId = subnet.feature.objectId
          dispatch(setFiberAnnotations({[subnetId]: []}, subnetId))
        })
        // parse changes
        dispatch(parseRecalcEvents(res.data))
      })

    } catch (error) {
      Notifier.error(error)
      dispatch(setIsCalculatingSubnets(false))
      dispatch(setIsRecalculating(false))
    }
  }
}

function setSelectedFiber (fiberObjects) {
  return (dispatch) => {
    batch(() => {
      dispatch({
        type: Actions.PLAN_EDITOR_SET_FIBER_SELECTION,
        payload: fiberObjects,
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
        .catch((error) => Notifier.error(error))
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
        .catch((error) => Notifier.error(error))
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
    const state = getState()
    const { subnets: cachedSubnets, subnetFeatures, drafts } = state.planEditor
    let newSubnetFeatures = klona(subnetFeatures)
    let clonedDrafts = klona(drafts)
    let updatedSubnets = {}
    const transactionId = state.planEditor.transaction && state.planEditor.transaction.id

    // NOTE: Technically this is a workaround for a bug that was exposed in service
    // when we switched APIs from this commit:
    // https://github.com/avco-aro/aro-app/commit/09b50a532c3a778d3571cf76d664379f56c7586c
    // This workaround solves it without changing service.
    // Just checking the cache so we don't call recalc Object IDs that should be removed
    // on the recalc data returned.
    let recalcedSubnetIds = recalcData.subnets
      .map(subnet => {
        const subnetId = subnet.feature.objectId
        return cachedSubnets[subnetId] ? subnetId : false
      })
      .filter(Boolean)
    recalcedSubnetIds = [...new Set(recalcedSubnetIds)]
    // TODO: ??? --->
    // this may have some redundancy in it-- we're only telling the cache to
    // (sadly) clear because we need to reload locations that are in or our of a modified
    // subnet boundary. Another way we could handle this it to pass `subnetLocations`
    // back down with the recalced subnets...
    await dispatch(addSubnets({ subnetIds: recalcedSubnetIds, forceReload: true }))

    // need to recapture state because we've altered it w/ `addSubnets`
    const { planEditor: { subnets } } = getState()
    recalcData.subnets.forEach(async (subnetRecalc) => {
      let subnetId = subnetRecalc.feature.objectId
      // TODO: looks like this needs to be rewritten 
      if (subnets[subnetId]) {
        const subnetCopy = klona(subnets[subnetId])

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

        // update draft fault tree
        const updateFaultTreeUrl = `/service/plan-transaction/${transactionId}/subnet/${subnetId}?selectionTypes=FAULT_TREE`
        try {
          const faultTreeCount = await AroHttp.get(updateFaultTreeUrl)
          clonedDrafts[subnetId].faultTreeSummary = faultTreeCount.data.faultTree.faultTreeSummary
        } catch (e) {
          Notifier.error(e)
        }
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
        type: Actions.PLAN_EDITOR_SET_DRAFTS,
        payload: clonedDrafts
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
      let tileDataBySubnet = {}
      // parse
      apiSubnets.forEach(apiSubnet => {
        let { subnet, subnetFeatures } = parseSubnet(apiSubnet)
        const subnetId = subnet.subnetNode
        subnets[subnetId] = subnet
        allFeatures = { ...allFeatures, ...subnetFeatures }
        tileDataBySubnet[subnetId] = subnet.subnetLocationsById
      })
      // dispatch add subnets and add subnetFeatures
      return batch(() => {
        dispatch(SubnetTileActions.setSubnetsData(tileDataBySubnet))
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

  // subnet nodes are not draggable 
  //  not entirely sure if this is where this should go, and I don't like hardcoding 
  //  theoretically this should be set by service 
  if (subnet.subnetNode.networkNodeType === 'subnet_node') {
    subnet.subnetNode.locked = true
  }

  subnet.children = subnet.children.map(feature => parseSubnetFeature(feature))
  subnet.coEquipments = subnet.coEquipments.map(feature => parseSubnetFeature(feature))
  // --- end typo section --- //

  // subnetLocations needs to be a dictionary
  subnet.subnetLocationsById = {}
  subnet.subnetLocations.forEach(location => {
    location.objectIds.forEach(objectId => {
      // TOS: does this make a list for each household? 
      // if subnet.subnetLocationsById[objectId] doesn't exist something has fallen out of sync
      subnet.subnetLocationsById[objectId] = { ...location, parentEquipmentId: null}
      delete subnet.subnetLocationsById[objectId].objectIds
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
            // TODO: lets look at this again, I think drop links are listed in subnet locationsById but maybe not every location in that link?
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

  // alert lists need to be dictionaries not arrays 
  let childNodeById = {}
  subnet.faultTree.rootNode.childNodes.forEach(childNode => {
    childNodeById[childNode.faultReference.objectId] = childNode
  })
  subnet.faultTree.rootNode.childNodes = childNodeById

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
function unparseSubnetFeature (feature) {
  feature = klona(feature)
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
  const geometry = klona(constructionArea.geometry)
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
  getActiveTransaction,
  resumeOrCreateTransaction,
  createFeature,
  updateFeatureProperties,
  moveFeature,
  deleteFeature,
  createConstructionArea,
  moveConstructionArea,
  deleteBoundaryVertices,
  addTransactionFeatures,
  showContextMenuForList,
  mergeTerminals,
  showContextMenuForLocations,
  unassignLocation,
  assignLocation,
  showContextMenuForBoundary,
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
  setCursorLocationIds,
  clearCursorLocationIds,
  addCursorEquipmentIds,
  clearCursorEquipmentIds,
  recalculateBoundary,
  boundaryChange,
  recalculateSubnets,
  setSelectedFiber,
  setFiberAnnotations,
  getFiberAnnotations,
  leftClickTile,
  deleteConstructionArea,
  subscribeToSocket,
  unsubscribeFromSocket,
}
