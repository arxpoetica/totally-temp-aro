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

function setConfigView (flag) {
  return {
    type: Actions.ETL_TEMPLATE_CONFIG_VIEW,
    payload: flag
  }
}

function uploadEtlTemplateToServer (dataType, file) {
  return dispatch => {
    var formData = new FormData()
    formData.append('file', file)
    AroHttp.postRaw(`/etltemplate/${dataType}`, formData) // Important to send empty headers so file upload works
      .then(() => dispatch(loadEtlTemplatesFromServer(dataType)))
      .catch(err => console.error(err))
  }
}

function deleteEtlTemplate (templateId, dataType) {
  return dispatch => {
    AroHttp.delete(`/etltemplate/${templateId}`)
      .then(result => dispatch(loadEtlTemplatesFromServer(dataType)))
      .catch(err => console.error(err))
  }
}

export default {
  loadEtlTemplatesFromServer,
  uploadEtlTemplateToServer,
  setConfigView,
  deleteEtlTemplate
}
