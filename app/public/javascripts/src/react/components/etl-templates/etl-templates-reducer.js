import Actions from '../../common/actions'

const defaultState = {
  etlTemplates: "Test"
}

function setEtlTempaltes (state, etlTemplates) {
  return { ...state,
    etlTemplates
  }
}

function etlTemplatesReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.ETL_TEMPLATE_GET_BY_TYPE:
      return setEtlTempaltes(state, action.payload)
    default:
      return state
  }
}

export default etlTemplatesReducer
