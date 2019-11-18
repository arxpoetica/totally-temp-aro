import Actions from '../../../common/actions'
import AroNetworkConstraints from '../../../../shared-utils/aro-network-constraints'
import ConnectivityDefinition from '../../common/optimization-options/connectivity-definition'
import SpatialEdgeType from '../../common/optimization-options/spatial-edge-type'

const defaultState = {
  constraints: AroNetworkConstraints(),
  connectivityDefinition: ConnectivityDefinition(),
  primarySpatialEdge: SpatialEdgeType.road.id,
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

    default:
      return state
  }
}

export default configurationReducer
