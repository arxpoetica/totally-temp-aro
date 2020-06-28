import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function loadMetaData () {

  return dispatch => {
    AroHttp.get(`/service/odata/SpatialEdgeTypeEntity`)
    .then(result => dispatch({
      type: Actions.DATA_UPLOAD_SET_EDGE_TYPE,
      payload: result.data
    }))
    .catch((err) => console.error(err))

    AroHttp.get(`/service/odata/FiberTypeEntity`)
    .then(result => dispatch({
      type: Actions.DATA_UPLOAD_SET_CABLE_TYPE,
      payload: result.data
    }))
    .catch((err) => console.error(err))
  }
}

function toggleView (viewName) {
  return dispatch => {
    dispatch({
      type: Actions.DATA_UPLOAD_TOGGLE_VIEW,
      payload: viewName
    })
  }
}

export default {
  loadMetaData,
  toggleView
}
