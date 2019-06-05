import Actions from '../../common/actions'
import FeatureSets from '../../common/featureSets'
import Ring from '../../common/ring'

const defaultState = {

  rings: {
    '1': new Ring('1')
  }, 
  selectedRingId: '1'
}

function setSelectedRingId (state, ringId) {
  return { ...state, 
    selectedRingId: ringId 
  }
}

function addRings (state, rings) {
  var newRings = {}
  rings.forEach(ring => {
    newRings[ring.id] = ring
  })
  return { ...state,
    rings: {...state.rings, ...newRings}
  }
}

function removeRing (state, ringId) {
  var newRings = {...state.rings}
  delete newRings[ringId]
  return { ...state,
    rings: newRings
  }
}

function onFeatureSelected (state, features = new FeatureSets()) {
  // ToDo: check if ring edit is active
  
  if (state.selectedRingId 
    && state.rings.hasOwnProperty(state.selectedRingId)
    && features.equipmentFeatures
    && features.equipmentFeatures.length > 0
  ){
    
    // add selected feature to selected ring 
    // OR delete selected feature from selected ring
    var equipmentFeature = features.equipmentFeatures[0]
    console.log(equipmentFeature)
    console.log(equipmentFeature.geometry)
    var newRing = {...state.rings[state.selectedRingId], 
      nodes: [...state.rings[state.selectedRingId].nodes]
    }
    var featureIndex = newRing.nodes.findIndex((ele) => ele.object_id == equipmentFeature.object_id)
    
    if (-1 == featureIndex){
      newRing.nodes.push(equipmentFeature)
    }else{
      newRing.nodes.splice(featureIndex, 1)
    }
    
    var newRings = {}
    newRings[state.selectedRingId] = newRing

    return { ...state,
      rings: {...state.rings, ...newRings}
    }
  }else{
    return state
  }
}

function ringEditReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.RING_SET_SELECTED_RING_ID:
      return setSelectedRingId(state, action.payload)
    case Actions.RING_ADD_RINGS:
      return addRings(state, action.payload)
    case Actions.RING_REMOVE_RING:
      return removeRing(state, action.payload)
    case Actions.MAP_SET_SELECTED_FEATURES:
      return onFeatureSelected(state, action.payload)

    default:
      return state
  }
}

export default ringEditReducer