import Actions from '../../common/actions'

const defaultState = {
  etlTemplates: null,
  configView: false
}

function setEtlTempaltes (state, etlTemplates) {
  return { ...state,
    etlTemplates
  }
}

function setConfigView (state, configView) {
  return { ...state,
    configView
  }
}

function etlTemplatesReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.ETL_TEMPLATE_GET_BY_TYPE:
      return setEtlTempaltes(state, action.payload)
    case Actions.ETL_TEMPLATE_CONFIG_VIEW:
      return setConfigView(state, action.payload)
    default:
      return state
  }
}

export default etlTemplatesReducer
