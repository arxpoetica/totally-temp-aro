import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkAnalysisActions from './network-analysis-actions'
import SpatialEdgeType from '../../common/optimization-options/spatial-edge-type'
import WormholeFusionType from '../../../../shared-utils/wormhole-fusion-type'

export class NetworkAnalysisNetworkDefinition extends Component {
  render () {
    return <div className='p-2 m-2'>
      <h4>Network Rules</h4>
      <table className='table table-sm table-striped'>
        <thead>
          <tr>
            <th>Edge type</th>
            <th>Is primary?</th>
            <th>Auto Fuse</th>
            <th>Manual Fuse</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.keys(SpatialEdgeType).map(edgeTypeKey => <tr key={edgeTypeKey}>

              {/* The edge type */}
              <td>{SpatialEdgeType[edgeTypeKey].displayName}</td>

              {/* A radio button that depicts if this is the primary edge type */}
              <td>
                <input
                  type='radio'
                  className='radiofill'
                  value={SpatialEdgeType[edgeTypeKey].id}
                  checked={SpatialEdgeType[edgeTypeKey].id === this.props.primarySpatialEdge}
                  onChange={event => this.handlePrimarySpatialEdgeChanged(SpatialEdgeType[edgeTypeKey].id)}
                />
              </td>

              {/* A checkbox (shown only for non-primary edges) that depicts whether to auto-fuse or hybrid-fuse this edge type */}
              <td>
                {
                  (SpatialEdgeType[edgeTypeKey].id === this.props.primarySpatialEdge)
                    ? null
                    : <input
                      type='checkbox'
                      className='checkboxfill'
                      checked={(this.props.wormholeFuseDefinitions[edgeTypeKey] === WormholeFusionType.auto.id) ||
                        (this.props.wormholeFuseDefinitions[edgeTypeKey] === WormholeFusionType.hybrid.id)}
                      onChange={event => this.handleAutoFuseDefinitionChanged(edgeTypeKey, event.target.checked)}
                      value={SpatialEdgeType[edgeTypeKey].id}
                    />
                }
              </td>

              {/* A checkbox (shown only for non-primary edges) that depicts whether to manual-fuse or hybrid-fuse this edge type */}
              <td>
                {
                  (SpatialEdgeType[edgeTypeKey].id === this.props.primarySpatialEdge)
                    ? null
                    : <input
                      type='checkbox'
                      className='checkboxfill'
                      checked={(this.props.wormholeFuseDefinitions[edgeTypeKey] === WormholeFusionType.manual.id) ||
                        (this.props.wormholeFuseDefinitions[edgeTypeKey] === WormholeFusionType.hybrid.id)}
                      onChange={event => this.handleManualFuseDefinitionChanged(edgeTypeKey, event.target.checked)}
                      value={SpatialEdgeType[edgeTypeKey].id}
                    />
                }
              </td>

            </tr>)
          }
        </tbody>
      </table>
    </div>
  }

  handlePrimarySpatialEdgeChanged (spatialEdgeType) {
    this.props.setPrimarySpatialEdge(spatialEdgeType)
    // Make sure that the wormhole fusion type for the primary edge is set to null
    if (this.props.wormholeFuseDefinitions[spatialEdgeType]) {
      this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.none.id)
    }
  }

  handleAutoFuseDefinitionChanged (spatialEdgeType, isAutoFuseSelected) {
    // There are two checkboxes - Auto and Manual. Mapping to WormholeFusionType is:
    // Auto OFF, Manual OFF - WormholeFusionType.none
    // Auto ON,  Manual OFF - WormholeFusionType.auto
    // Auto OFF, Manual ON  - WormholeFusionType.manual
    // Auto ON,  Manual ON  - WormholeFusionType.hybrid
    const oldFusionType = this.props.wormholeFuseDefinitions[spatialEdgeType]
    if (isAutoFuseSelected) {
      // User has asked to switch on the auto fuse option
      switch (oldFusionType) {
        case undefined:
        case null:
        case WormholeFusionType.none.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.auto.id)
          break

        case WormholeFusionType.manual.id:
        case WormholeFusionType.hybrid.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.hybrid.id)
          break

        case WormholeFusionType.auto.id:
        default:
          break
      }
    } else {
      // User has asked to switch off the auto fuse option
      switch (oldFusionType) {
        case WormholeFusionType.none.id:
        case WormholeFusionType.auto.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.none.id)
          break

        case WormholeFusionType.hybrid.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.manual.id)
          break

        case WormholeFusionType.manual.id:
        default:
          break
      }
    }
  }

  handleManualFuseDefinitionChanged (spatialEdgeType, isManualFuseSelected) {
    // There are two checkboxes - Auto and Manual. Mapping to WormholeFusionType is:
    // Auto OFF, Manual OFF - WormholeFusionType.none
    // Auto ON,  Manual OFF - WormholeFusionType.auto
    // Auto OFF, Manual ON  - WormholeFusionType.manual
    // Auto ON,  Manual ON  - WormholeFusionType.hybrid
    const oldFusionType = this.props.wormholeFuseDefinitions[spatialEdgeType]
    if (isManualFuseSelected) {
      // User has asked to switch on the manual fuse option
      switch (oldFusionType) {
        case undefined:
        case null:
        case WormholeFusionType.none.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.manual.id)
          break

        case WormholeFusionType.auto.id:
        case WormholeFusionType.hybrid.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.hybrid.id)
          break

        case WormholeFusionType.manual.id:
        default:
          break
      }
    } else {
      // User has asked to switch off the manual fuse option
      switch (oldFusionType) {
        case WormholeFusionType.none.id:
        case WormholeFusionType.manual.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.none.id)
          break

        case WormholeFusionType.hybrid.id:
          this.props.setWormholeFuseDefinition(spatialEdgeType, WormholeFusionType.auto.id)
          break

        case WormholeFusionType.auto.id:
        default:
          break
      }
    }
  }
}

NetworkAnalysisNetworkDefinition.propTypes = {
  primarySpatialEdge: PropTypes.string,
  wormholeFuseDefinitions: PropTypes.object
}

const mapStateToProps = state => ({
  primarySpatialEdge: state.optimization.networkAnalysis.primarySpatialEdge,
  wormholeFuseDefinitions: state.optimization.networkAnalysis.wormholeFuseDefinitions
})

const mapDispatchToProps = dispatch => ({
  setPrimarySpatialEdge: primarySpatialEdge => dispatch(NetworkAnalysisActions.setPrimarySpatialEdge(primarySpatialEdge)),
  setWormholeFuseDefinition: (spatialEdgeType, wormholeFusionTypeId) => dispatch(NetworkAnalysisActions.setWormholeFuseDefinition(spatialEdgeType, wormholeFusionTypeId))
})

const NetworkAnalysisNetworkDefinitionComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisNetworkDefinition, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisNetworkDefinitionComponent
