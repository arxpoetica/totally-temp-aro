import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import WormholeFusionType from '../../../shared-utils/wormhole-fusion-type'

export class WormholeFuseDefinition extends Component {
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
            this.props.spatialEdgeDefinitions.map(spatialEdgeDefinition => <tr key={spatialEdgeDefinition.key}>

              {/* The edge type */}
              <td>{spatialEdgeDefinition.description}</td>

              {/* A radio button that depicts if this is the primary edge type */}
              <td>
                <input
                  type='radio'
                  className='radiofill'
                  value={spatialEdgeDefinition.key}
                  checked={spatialEdgeDefinition.key === this.props.primarySpatialEdge}
                  onChange={event => this.handlePrimarySpatialEdgeChanged(spatialEdgeDefinition.key)}
                />
              </td>

              {/* A checkbox (shown only for non-primary edges) that depicts whether to auto-fuse or hybrid-fuse this edge type */}
              <td>
                {
                  (spatialEdgeDefinition.key === this.props.primarySpatialEdge)
                    ? null
                    : <input
                      type='checkbox'
                      className='checkboxfill'
                      checked={(this.props.wormholeFuseDefinitions[spatialEdgeDefinition.key] === WormholeFusionType.auto.id) ||
                        (this.props.wormholeFuseDefinitions[spatialEdgeDefinition.key] === WormholeFusionType.hybrid.id)}
                      onChange={event => this.handleAutoFuseDefinitionChanged(spatialEdgeDefinition.key, event.target.checked)}
                      value={spatialEdgeDefinition.key}
                    />
                }
              </td>

              {/* A checkbox (shown only for non-primary edges) that depicts whether to manual-fuse or hybrid-fuse this edge type */}
              <td>
                {
                  (spatialEdgeDefinition.key === this.props.primarySpatialEdge)
                    ? null
                    : <input
                      type='checkbox'
                      className='checkboxfill'
                      checked={(this.props.wormholeFuseDefinitions[spatialEdgeDefinition.key] === WormholeFusionType.manual.id) ||
                        (this.props.wormholeFuseDefinitions[spatialEdgeDefinition.key] === WormholeFusionType.hybrid.id)}
                      onChange={event => this.handleManualFuseDefinitionChanged(spatialEdgeDefinition.key, event.target.checked)}
                      value={spatialEdgeDefinition.key}
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

WormholeFuseDefinition.propTypes = {
  primarySpatialEdge: PropTypes.string,
  spatialEdgeDefinitions: PropTypes.array,
  wormholeFuseDefinitions: PropTypes.object
}

export default WormholeFuseDefinition
