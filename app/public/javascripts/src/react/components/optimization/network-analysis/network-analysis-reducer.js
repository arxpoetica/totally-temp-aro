import Actions from '../../../common/actions'
import AroNetworkConstraints from '../../../../shared-utils/aro-network-constraints'
import ConnectivityDefinition from '../../common/optimization-options/connectivity-definition'
import WormholeFusionType from '../../../../shared-utils/wormhole-fusion-type'

const defaultState = {
  constraints: AroNetworkConstraints(),
  connectivityDefinition: ConnectivityDefinition(),
  primarySpatialEdge: 'road', // SpatialEdgeType.road.id, // this is now in UI settings
  wormholeFuseDefinitions: {},
  chartReport: null,
  chartReportMetaData: null,
  chartReportDefinition: null
}

function setChartReport (state, chartReport) {
  return { ...state,
    chartReport: chartReport
  }
}

function setChartReportMetaData (state, chartReportMetaData) {
  return { ...state,
    chartReportMetaData: chartReportMetaData
  }
}

function setChartReportDefinition (state, chartReportDefinition) {
  return { ...state,
    chartReportDefinition: chartReportDefinition
  }
}

function setNetworkAnalysisConnectivity (state, spatialEdgeType, networkConnectivityType) {
  return { ...state,
    connectivityDefinition: { ...state.connectivityDefinition,
      [spatialEdgeType]: networkConnectivityType
    }
  }
}

function setConstraints (state, aroNetworkConstraints) {
  return { ...state,
    constraints: aroNetworkConstraints
  }
}

function setPrimarySpatialEdge (state, primarySpatialEdge) {
  return { ...state,
    primarySpatialEdge: primarySpatialEdge
  }
}

function clearWormholeFuseDefinition (state) {
  return { ...state,
    wormholeFuseDefinitions: {}
  }
}

function setWormholeFuseDefinition (state, spatialEdgeType, wormholeFusionTypeId) {
  var newState = { ...state,
    wormholeFuseDefinitions: { ...state.wormholeFuseDefinitions }
  }
  if (wormholeFusionTypeId === WormholeFusionType.none.id) {
    // We want to remove this spatial edge type from the state completely. No need to pass "none" to service.
    delete newState.wormholeFuseDefinitions[spatialEdgeType]
  } else {
    newState.wormholeFuseDefinitions[spatialEdgeType] = wormholeFusionTypeId
  }
  return newState
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.NETWORK_ANALYSIS_SET_CHART_REPORT:
      return setChartReport(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_CHART_REPORT_METADATA:
      return setChartReportMetaData(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_CHART_REPORT_DEFINITION:
      return setChartReportDefinition(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_CONNECTIVITY:
      return setNetworkAnalysisConnectivity(state, action.payload.spatialEdgeType, action.payload.networkConnectivityType)

    case Actions.NETWORK_ANALYSIS_SET_CONSTRAINTS:
      return setConstraints(state, action.payload)

    case Actions.NETWORK_ANALYSIS_SET_PRIMARY_SPATIAL_EDGE:
      return setPrimarySpatialEdge(state, action.payload)

    case Actions.NETWORK_ANALYSIS_CLEAR_WORMHOLE_FUSE_DEFINITION:
      return clearWormholeFuseDefinition(state)

    case Actions.NETWORK_ANALYSIS_SET_WORMHOLE_FUSE_DEFINITION:
      return setWormholeFuseDefinition(state, action.payload.spatialEdgeType, action.payload.wormholeFusionTypeId)

    default:
      return state
  }
}

export default configurationReducer
