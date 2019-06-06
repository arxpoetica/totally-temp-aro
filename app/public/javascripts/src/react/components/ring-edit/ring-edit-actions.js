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
  console.log(features)
  
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
      var feature = validNodes[0]
      console.log(feature)
      console.log(feature.geometry)
      var ringClone = {...state.ringEdit.rings[state.ringEdit.selectedRingId], 
        nodes: [...state.ringEdit.rings[state.ringEdit.selectedRingId].nodes]
      }
      var featureIndex = state.ringEdit.rings[state.ringEdit.selectedRingId].nodes
                         .findIndex((ele) => ele.object_id == feature.object_id)
      
      if (-1 != featureIndex){
        // remove node
        dispatch({
          type:Actions.RING_REMOVE_NODE, 
          payload: {ringId: state.ringEdit.selectedRingId, 
            featureId: feature.object_id
          }
        })
      }else{
        // add node
        // get feature lat long
        dispatch({
          type:Actions.RING_ADD_NODE, 
          payload: {ringId: state.ringEdit.selectedRingId, 
            feature: feature
          }
        })
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
