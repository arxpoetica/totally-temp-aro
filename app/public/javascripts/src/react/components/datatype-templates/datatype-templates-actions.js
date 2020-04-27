import Actions from '../../common/actions'

function setDataTypeTemplateId (id) {
  return {
    type: Actions.PROJECT_SET_CURRENT_PROJECT_TEMPLATE_ID,
    payload: id
  }
}

export default {
  setDataTypeTemplateId
}
