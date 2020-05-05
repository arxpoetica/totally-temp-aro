import Actions from '../../common/actions'

const defaultState = {
  currentProjectTemplateId: 1
}

function setCurrentProjectTemplateId (state, currentProjectTemplateId) {
  return { ...state,
    currentProjectTemplateId
  }
}

function projectTemplateReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.PROJECT_SET_CURRENT_PROJECT_TEMPLATE_ID:
      return setCurrentProjectTemplateId(state, action.payload)

    default:
      return state
  }
}

export default projectTemplateReducer
