import Actions from '../../../../common/actions'

const defaultState = {
  enumStrings: {},
  networkNodeTypesEntity: {},
  showRoicReportsModal: false,
  roicResults: null,
  xAxisLabels: [],
  planStateCons: Object.freeze({
    INITIALIZED: 'INITIALIZED',
    START_STATE: 'START_STATE',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELED: 'CANCELED'
  })
}

function setEnumStrings (state, enumStrings) {
  return { ...state,
    enumStrings: enumStrings
  }
}

function setNetworkNodeTypesEntity (state, networkNodeTypesEntity) {
  return { ...state,
    networkNodeTypesEntity: networkNodeTypesEntity
  }
}

function setShowRoicReportsModal (state, showRoicReportsModal) {
  return { ...state,
    showRoicReportsModal: showRoicReportsModal
  }
}

function setROICResults (state, roicResults) {
  return { ...state,
    roicResults: roicResults
  }
}

function setXaxisLabels (state, xAxisLabels) {
  return { ...state,
    xAxisLabels: xAxisLabels
  }
}

function RoicReportsReducer (state = defaultState, action) {
  switch (action.type) {

    case Actions.ROIC_REPORTS_SET_ENUM_STRINGS:
      return setEnumStrings(state, action.payload)

    case Actions.ROIC_REPORTS_NETWORK_NODE_TYPE_ENTITY:
      return setNetworkNodeTypesEntity(state, action.payload)

    case Actions.ROIC_REPORTS_SHOW_ROIC_REPORT_MODAL:
      return setShowRoicReportsModal(state, action.payload)

    case Actions.ROIC_REPORTS_SET_ROIC_RESULTS_FOR_PLAN:
      return setROICResults(state, action.payload)

    case Actions.ROIC_REPORTS_SET_XAXIS_LABELS:
      return setXaxisLabels(state, action.payload)

    case Actions.ROIC_REPORTS_SET_ROIC_RESULTS_FOR_LOCATION:
      return setROICResults(state, action.payload)

    default:
      return state
  }
}

export default RoicReportsReducer
