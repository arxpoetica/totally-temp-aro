import Actions from '../../common/actions'

const defaultState = {
    currentProjectTemplateId: 1,
  }
function projectTemplateReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.SET_CURRENT_PROJECT_TEMPLATE_ID:
      return action.payload.currentProjectTemplateId

    default:
      return state
  }
}

export default projectTemplateReducer