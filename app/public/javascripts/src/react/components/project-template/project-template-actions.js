import Actions from '../../common/actions'

function setCurrentProjectTemplateId (id) {
  return {
    type: Actions.PROJECT_SET_CURRENT_PROJECT_TEMPLATE_ID,
    payload: id
  }
}

export default {
  setCurrentProjectTemplateId
}
