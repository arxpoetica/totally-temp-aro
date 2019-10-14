import SpatialEdgeType from './spatial-edge-type'
import NetworkConnectivityType from './network-connectivity-type'

export default () => ({
  [SpatialEdgeType.road.id]: NetworkConnectivityType.snapToEdge.id,
  [SpatialEdgeType.sewer.id]: NetworkConnectivityType.snapToWormhole.id,
  [SpatialEdgeType.duct.id]: NetworkConnectivityType.none.id
})
