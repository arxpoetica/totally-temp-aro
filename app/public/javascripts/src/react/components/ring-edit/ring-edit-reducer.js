import Actions from '../../common/actions'
import FeatureSets from '../../common/featureSets'
import Ring from '../../common/ring'

const defaultState = {

  rings: {
    '65e426e0-1e9b-11e9-aa81-07fd2257c3c7': new Ring('65e426e0-1e9b-11e9-aa81-07fd2257c3c7')
  }, 
  selectedRingId: null
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
  console.log(features)
  if (state.selectedRingId 
    && state.rings.hasOwnProperty(state.selectedRingId)
    && features.equipmentFeatures.length > 0
  ){
    console.log(features.equipmentFeatures[0])

    // add selected feature to selected ring 
    // OR delete selected feature from selected ring
    //var newNodes = state.rings[state.selectedRingId].nodes

    return state
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