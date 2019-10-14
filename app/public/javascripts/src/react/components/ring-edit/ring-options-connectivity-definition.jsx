import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { ConduitConnectivityDefinition } from '../optimization/conduit-connectivity-definition.jsx'
import RingEditActions from './ring-edit-actions'

const mapStateToProps = (state) => ({
  ringOptionsConnectivityDefinition: state.ringEdit.connectivityDefinition
})

const mapDispatchToProps = dispatch => ({
  setRingOptionsConnectivityDefinition: (spatialEdgeType, networkConnectivityType) => dispatch(RingEditActions.setRingOptionsConnectivityDefinition(spatialEdgeType, networkConnectivityType))
})

const RingOptionsConnectivityDefinitionComponent = connect(mapStateToProps, mapDispatchToProps)(ConduitConnectivityDefinition)
export default RingOptionsConnectivityDefinitionComponent
