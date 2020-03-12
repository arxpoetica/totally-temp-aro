import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { ConduitConnectivityDefinition } from '../../common/conduit-connectivity-definition.jsx'
import NetworkAnalysisActions from './network-analysis-actions'

const mapStateToProps = (state) => ({
  connectivityDefinition: state.optimization.networkAnalysis.connectivityDefinition
})

const mapDispatchToProps = dispatch => ({
  setConnectivityDefinition: (spatialEdgeType, networkConnectivityType) => dispatch(NetworkAnalysisActions.setNetworkAnalysisConnectivityDefinition(spatialEdgeType, networkConnectivityType))
})

const NetworkAnalysisConnectivityDefinitionComponent = wrapComponentWithProvider(reduxStore, ConduitConnectivityDefinition, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisConnectivityDefinitionComponent
