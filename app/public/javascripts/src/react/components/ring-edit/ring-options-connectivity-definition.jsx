import { connect } from 'react-redux'
import { ConduitConnectivityDefinition } from '../common/conduit-connectivity-definition.jsx'
import RingEditActions from './ring-edit-actions'

const mapStateToProps = (state) => ({
  connectivityDefinition: state.ringEdit.connectivityDefinition
})

const mapDispatchToProps = dispatch => ({
  setConnectivityDefinition: (spatialEdgeType, networkConnectivityType) => dispatch(RingEditActions.setRingOptionsConnectivityDefinition(spatialEdgeType, networkConnectivityType))
})

const RingOptionsConnectivityDefinitionComponent = connect(mapStateToProps, mapDispatchToProps)(ConduitConnectivityDefinition)
export default RingOptionsConnectivityDefinitionComponent
