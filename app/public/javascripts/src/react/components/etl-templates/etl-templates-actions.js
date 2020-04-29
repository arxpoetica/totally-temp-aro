import Actions from '../../common/actions'
import AroHttp from '../../common/aro-http'

function loadEtlTemplatesFromServer (dataType) {
  return dispatch => {
    AroHttp.get(`/etltemplate?datatype=${dataType}`)
      .then(result => dispatch({
        type: Actions.ETL_TEMPLATE_GET_BY_TYPE,
        payload: result.data
      }))
      .catch(err => console.error(err))
  }
}

export default {
  loadEtlTemplatesFromServer
}
