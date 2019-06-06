/* globals */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import RingUtils from './ring-utils'

function setSelectedRingId (ringId) {
  return {
    type: Actions.RING_SET_SELECTED_RING_ID, 
    payload: ringId
  }
}

function addRings (rings) {
  return {
    type: Actions.RING_ADD_RINGS, 
    payload: rings
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

      var featureIndex = state.ringEdit.rings[state.ringEdit.selectedRingId].nodes
                         .findIndex((ele) => ele.objectId == feature.objectId)
      
      if (-1 != featureIndex){
        // remove node
        dispatch({
          type:Actions.RING_REMOVE_NODE, 
          payload: {ringId: state.ringEdit.selectedRingId, 
            featureId: feature.objectId
          }
        })
      }else{
        // add node
        // get feature lat long
        RingUtils.getEquipmentDataPromise(
          feature.object_id, 
          state.plan.activePlan.id, 
          state.user.loggedInUser.id
        ).then(result => {
          feature.data = result.data
          dispatch({
            type:Actions.RING_ADD_NODE, 
            payload: {ringId: state.ringEdit.selectedRingId, 
              feature: feature
            }
          })
        }).catch(err => console.error(err)) 
      } 
    }
  }
}

function loadRings (planId) {
  return dispatch => {
    AroHttp.get(`/service//plan/{planId}/ring-config?planId=${planId}`)
    .then(result => {
      
      dispatch({
        type: Actions.RING_REMOVE_ALL_RINGS
      })

      var rings = RingUtils.parseRingData(result.data)
      
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
  loadRings
}
