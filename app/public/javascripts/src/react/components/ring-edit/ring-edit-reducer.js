import Actions from '../../common/actions'
import FeatureSets from '../../common/featureSets'
import Ring from '../../common/ring'

const defaultState = {

  rings: {
    
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

function removeAllRings (state) {
  return { ...state,
    rings: {}, 
    selectedRingId: null
  }
}

function addNode (state, ringId, feature) {
  if (!state.rings.hasOwnProperty(ringId)) return state

  var ringClone = {...state.rings[ringId], 
    nodes: [...state.rings[ringId].nodes]
  }
  var featureIndex = ringClone.nodes.findIndex((ele) => ele.object_id == feature.object_id)
  
  if (-1 != featureIndex) return state
  ringClone.nodes.push(feature)
  
  var newRings = {}
  newRings[ringId] = ringClone
  
  return { ...state,
    rings: {...state.rings, ...newRings}
  }
}

function removeNode (state, ringId, featureId) {
  if (!state.rings.hasOwnProperty(ringId)) return state

  var ringClone = {...state.rings[ringId], 
    nodes: [...state.rings[ringId].nodes]
  }
  var featureIndex = ringClone.nodes.findIndex((ele) => ele.object_id == featureId)
  
  if (-1 == featureIndex) return state
  ringClone.nodes.splice(featureIndex, 1)
  
  var newRings = {}
  newRings[ringId] = ringClone
  
  return { ...state,
    rings: {...state.rings, ...newRings}
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
    case Actions.RING_REMOVE_ALL_RINGS:
      return removeAllRings(state)
    case Actions.RING_ADD_NODE:
      return addNode(state, action.payload.ringId, action.payload.feature)
    case Actions.RING_REMOVE_NODE:
      return removeNode(state, action.payload.ringId, action.payload.featureId)

    default:
      return state
  }
}

export default ringEditReducer