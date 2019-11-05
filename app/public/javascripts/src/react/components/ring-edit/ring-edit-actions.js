/* globals */
import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'
import Ring from '../../common/ring'

function setSelectedRingId (ringId) {
  ringId = parseInt(ringId)
  return {
    type: Actions.RING_SET_SELECTED_RING_ID,
    payload: ringId
  }
}

function newRing (planId, userId) {
  return (dispatch) => {
    AroHttp.post(`/service/plan/${planId}/ring-config`, {})
      .then(result => {
        // ToDo protect against fail returns
        var ring = new Ring(result.data.id)
        dispatch({
          type: Actions.RING_ADD_RINGS,
          payload: [ring]
        })
        dispatch({
          type: Actions.RING_SET_SELECTED_RING_ID,
          payload: ring.id
        })
      }).catch(err => console.error(err))
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
    var featureIndex = ringClone.nodes.findIndex((ele) => ele.objectId === feature.objectId)

    if (featureIndex !== -1) return
    ringClone.addNode(feature)

    // todo make ring update action
    AroHttp.put(`/service/plan/${planId}/ring-config/${ring.id}`, ringClone.getDataExport())
      .then(result => {
        // ToDo protect against fail returns
        dispatch({
          type: Actions.RING_UPDATE_RING,
          payload: ringClone
        })
      }).catch(err => console.error(err))
  }
}

function removeNode (ring, featureId, planId, userId) {
  return (dispatch) => {
    var ringClone = ring.clone()
    var featureIndex = ringClone.nodes.findIndex((ele) => ele.objectId === featureId)
    if (featureIndex === -1) return
    ringClone.removeNode(featureId)

    // todo make ring update action
    AroHttp.put(`/service/plan/${planId}/ring-config/${ring.id}`, ringClone.getDataExport())
      .then(result => {
        // ToDo protect against fail returns
        dispatch({
          type: Actions.RING_UPDATE_RING,
          payload: ringClone
        })
      }).catch(err => console.error(err))
  }
}

function removeRing (ringId, planId, userId) {
  return (dispatch) => {
    AroHttp.delete(`/service/plan/${planId}/ring-config/${ringId}`)
      .then(result => {
        // ToDo protect against fail returns
        dispatch({
          type: Actions.RING_REMOVE_RING,
          payload: ringId
        })
      }).catch(err => console.error(err))
  }
}

function saveRingChangesToServer (ring, planId, userId) {
  return (dispatch) => {
    AroHttp.put(`/service/plan/${planId}/ring-config/${ring.id}`, ring.getDataExport())
      .then(result => {
        // ToDo protect against fail returns
      }).catch(err => console.error(err))
  }
}

function renameRing (ring, name, planId, userId) {
  return (dispatch) => {
    var ringClone = ring.clone()
    ringClone.name = name
    AroHttp.put(`/service/plan/${planId}/ring-config/${ringClone.id}`, ringClone.getDataExport())
      .then(result => {
        // ToDo protect against fail returns
        dispatch({
          type: Actions.RING_UPDATE_RING,
          payload: ringClone
        })
      }).catch(err => console.error(err))
  }
}

function onFeatureSelected (features) {
  // this may be a bit funky, revisit this

  return (dispatch, getState) => {
    const state = getState()

    if (state.ringEdit.selectedRingId &&
      state.ringEdit.rings.hasOwnProperty(state.ringEdit.selectedRingId) &&
      features.equipmentFeatures &&
      features.equipmentFeatures.length > 0
    ) {
      // add selected feature to selected ring
      // OR delete selected feature from selected ring
      var validNodes = features.equipmentFeatures.filter(feature => feature._data_type.includes('central_office'))
      if (validNodes.length === 0) return // {type:null}
      var feature = { ...validNodes[0] }
      feature.objectId = feature.object_id
      var ring = state.ringEdit.rings[state.ringEdit.selectedRingId]
      var featureIndex = ring.nodes.findIndex((ele) => ele.objectId === feature.objectId)
      const planId = state.plan.activePlan.id
      const userId = state.user.loggedInUser.id

      if (featureIndex !== -1) {
        // remove node
        dispatch(removeNode(ring, feature.objectId, planId, userId))
      } else {
        // add node
        // get feature lat long

        getEquipmentDataPromise(feature.objectId, planId, userId)
          .then(result => {
            feature.data = result.data
            dispatch(addNode(ring, feature, planId, userId))
          }).catch(err => console.error(err))
      }
    }
  }
}

function loadRings (planId) {
  return (dispatch, getState) => {
    const state = getState()
    const userId = state.user.loggedInUser.id

    AroHttp.get(`/service/plan/${planId}/ring-config?planId=${planId}`)
      .then(result => {
        var rings = []
        var ringPromisses = []
        result.data.forEach(ringData => {
          ringPromisses.push(this.getExchangeLinksPromise(ringData, planId, userId)
            .then(result => {
              rings.push(Ring.parseData(ringData, result))
            }))
        })

        Promise.all(ringPromisses)
          .then(() => {
            dispatch({
              type: Actions.RING_REMOVE_ALL_RINGS
            })
            dispatch({
              type: Actions.RING_ADD_RINGS,
              payload: rings
            })
          })
      }).catch(err => console.error(err))
  }
}

function getExchangeLinksPromise (ringData, planId, userId) {
  return new Promise((resolve, reject) => {
    if (ringData.exchangeLinks.length > 0) {
      var nodeIds = [ ringData.exchangeLinks[0].fromOid ]
      ringData.exchangeLinks.forEach(link => {
        nodeIds.push(link.toOid)
      })
      var promisses = []
      nodeIds.forEach(id => {
        promisses.push(this.getEquipmentDataPromise(id, planId, userId))
      })
      Promise.all(promisses)
        .then(results => {
          resolve(results.map(result => result.data))
        })
    } else {
      resolve([])
    }
  }).catch(err => console.error(err))
}

function requestSubNet (planId, ringIds, locationTypes, ringOptions, connectivityDefinition) {
  return () => {
    const postBody = {
      ringIds: ringIds,
      locationTypes: locationTypes,
      maxLocationEdgeDistance: +ringOptions.maxLocationEdgeDistance.value,
      locationBufferSize: +ringOptions.locationBufferSize.value,
      conduitBufferSize: +ringOptions.conduitBufferSize.value,
      aroRingRule: {
        snappingDistance: +ringOptions.snappingDistance.value,
        maxConnectionDistance: +ringOptions.maxConnectionDistance.value,
        maxWormholeDistance: +ringOptions.maxWormholeDistance.value,
        ringComplexityCount: +ringOptions.ringComplexityCount.value,
        connectivityDefinition: connectivityDefinition
      }
    }
    AroHttp.post(`/service/plan/${planId}/ring-cmd`, postBody)
      .catch(err => console.error(err))
  }
}

function getEquipmentDataPromise (equipmentId, planId, userId) {
  return AroHttp.get(`/service/plan-feature/${planId}/equipment/${equipmentId}?userId=${userId}`)
}

function setAnalysisStatus (status) {
  return {
    type: Actions.RING_SET_ANALYSIS_STATUS,
    payload: status
  }
}

function setAnalysisProgress (progress) {
  return {
    type: Actions.RING_SET_ANALYSIS_PROGRESS,
    payload: progress
  }
}

function setRingOptionsConnectivityDefinition (spatialEdgeType, networkConnectivityType) {
  return {
    type: Actions.RING_OPTIONS_SET_CONNECTIVITY,
    payload: {
      spatialEdgeType,
      networkConnectivityType
    }
  }
}

export default {
  setSelectedRingId,
  newRing,
  removeRing,
  removeNode,
  removeAllRings,
  onFeatureSelected,
  loadRings,
  getExchangeLinksPromise,
  addNode,
  saveRingChangesToServer,
  renameRing,
  requestSubNet,
  getEquipmentDataPromise,
  setAnalysisStatus,
  setAnalysisProgress,
  setRingOptionsConnectivityDefinition
}