/* globals */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import RingUtils from './ring-utils'
import Ring from '../../common/ring'

function setSelectedRingId (ringId) {
  return {
    type: Actions.RING_SET_SELECTED_RING_ID, 
    payload: ringId
  }
}

function addRings (rings, planId, userId) {
  return (dispatch) => {
    var promisses = []
    rings.forEach(ring => {
      promisses.push(AroHttp.post(`/service/plan/${planId}/ring-config`, ring.getDataExport()))
    })
    
    Promise.all(promisses)
    .then(results => {
      //ToDo protect against fail returns
      dispatch({
        type: Actions.RING_ADD_RINGS, 
        payload: rings
      })
    }).catch(err => console.error(err)) 
  }
}

function removeRing (ringId) {
  return {
    type: Actions.RING_REMOVE_RING, 
    payload: ringId
  }
}

function removeAllRings () {
  return {
    type: Actions.RING_REMOVE_ALL_RINGS
  }
}

function addNode (ring, feature, planId, userId) {
  return (dispatch) => {
    var ringClone = ring.clone()
    var featureIndex = ringClone.nodes.findIndex((ele) => ele.objectId == feature.objectId)
    
    if (-1 != featureIndex) return
    ringClone.addNode(feature)

    // todo make ring update action 
    AroHttp.put(`/service/plan/${planId}/ring-config/${ring.id}`, ringClone.getDataExport())
    .then(result => {
      //ToDo protect against fail returns
      dispatch({
        type:Actions.RING_UPDATE_RING, 
        payload: ringClone
      })
    }).catch(err => console.error(err))
  }
}

function removeNode (ring, featureId, planId, userId) {
  return (dispatch) => {
    var ringClone = ring.clone()
    var featureIndex = ringClone.nodes.findIndex((ele) => ele.objectId == featureId)
    if (-1 == featureIndex) return
    ringClone.removeNode(featureId)
    
    // todo make ring update action 
    AroHttp.put(`/service/plan/${planId}/ring-config/${ring.id}`, ringClone.getDataExport())
    .then(result => {
      //ToDo protect against fail returns
      dispatch({
        type:Actions.RING_UPDATE_RING, 
        payload: ringClone
      })
    }).catch(err => console.error(err))
  }
}

function onFeatureSelected (features) {
  // this may be a bit funky, revisit this
  
  return (dispatch, getState) => {
    const state = getState()
    
    if (state.ringEdit.selectedRingId 
      && state.ringEdit.rings.hasOwnProperty(state.ringEdit.selectedRingId)
      && features.equipmentFeatures
      && features.equipmentFeatures.length > 0
    ){
      // add selected feature to selected ring 
      // OR delete selected feature from selected ring
      var validNodes = features.equipmentFeatures.filter(feature => feature._data_type.includes("central_office"))
      if (validNodes.length == 0) return //{type:null}
      var feature = {...validNodes[0]}
      feature.objectId = feature.object_id
      var ring = state.ringEdit.rings[state.ringEdit.selectedRingId]
      var featureIndex = ring.nodes.findIndex((ele) => ele.objectId == feature.objectId)
      
      if (-1 != featureIndex){
        // remove node
        dispatch( removeNode(ring, feature.objectId, planId, userId) )
      }else{
        // add node
        // get feature lat long
        const planId = state.plan.activePlan.id
        const userId = state.user.loggedInUser.id

        RingUtils.getEquipmentDataPromise(feature.objectId, planId, userId)
        .then(result => {
          feature.data = result.data
          dispatch( addNode(ring, feature, planId, userId) )

        }).catch(err => console.error(err)) 
      } 
    }
  }
}

function loadRings (planId) {
  return (dispatch, getState) => {
    const state = getState()
    const userId = state.user.loggedInUser.id
    AroHttp.get(`/service//plan/{planId}/ring-config?planId=${planId}`)
    .then(result => {
      
      dispatch({
        type: Actions.RING_REMOVE_ALL_RINGS
      })
      console.log(result.data)
      //var rings = RingUtils.parseRingData(result.data)
      var rings = []
      result.data.forEach(ringData => {
        rings.push(Ring.parseData(ringData, planId, userId))
      })
      dispatch({
        type: Actions.RING_ADD_RINGS,
        payload: rings
      })
    })
    .catch(err => console.error(err))
  }
}

export default {
  setSelectedRingId, 
  addRings, 
  removeRing, 
  removeAllRings, 
  onFeatureSelected, 
  loadRings, 
  addNode, 
  removeNode
}
