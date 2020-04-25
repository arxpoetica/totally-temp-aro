import NetworkConnectivityType from './network-connectivity-type'
// ToDo: SpatialEdgeType come in from settings
export default () => ({
  'road': NetworkConnectivityType.snapToEdge.id,
  'sewer': NetworkConnectivityType.snapToWormhole.id,
  'duct': NetworkConnectivityType.none.id
})
