import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import NetworkAnalysisActions from './network-analysis-actions'
import SpatialEdgeType from '../../common/optimization-options/spatial-edge-type'

export class NetworkAnalysisNetworkDefinition extends Component {
  render () {
    return <div className='p-2 m-2'>
      <h4>Network definition</h4>
      <table className='table table-sm table-striped'>
        <thead>
          <tr>
            <th>Edge type</th>
            <th>Is primary?</th>
            <th>Auto Fuse</th>
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

              {/* A checkbox (shown only for non-primary edges) that depicts whether to auto-fuse this edge type */}
              <td>
                {
                  (SpatialEdgeType[edgeTypeKey].id === this.props.primarySpatialEdge)
                    ? null
                    : <input
                      type='checkbox'
                      className='checkboxfill'
                      value={SpatialEdgeType[edgeTypeKey].id}
                      checked={this.props.autoFuseEdgeTypesSet.has(SpatialEdgeType[edgeTypeKey].id)}
                      onChange={event => this.handleAutoFuseEdgeTypeChanged(SpatialEdgeType[edgeTypeKey].id, event.target.checked)}
                    />
                }
              </td>
            </tr>)
          }
        </tbody>
      </table>
    </div>
  }

  handlePrimarySpatialEdgeChanged (edgeType) {
    this.props.setPrimarySpatialEdge(edgeType)
    // Make sure that the current autofuse edge types do not include the primary spatial edge type
    if (this.props.autoFuseEdgeTypesSet.has(edgeType)) {
      // Remove the new primary edge from the auto fuse edge types
      const newAutoFuseEdgeTypes = [...this.props.autoFuseEdgeTypesSet].filter(item => item !== edgeType)
      this.props.setAutoFuseEdgeTypes(newAutoFuseEdgeTypes)
    }
  }
  handleAutoFuseEdgeTypeChanged (edgeType, autoFuse) {
    // Get an array of the current autofuse edge types
    const currentAutoFuseEdgeTypes = [...this.props.autoFuseEdgeTypesSet]
    const newAutoFuseEdgeTypes = autoFuse
      ? currentAutoFuseEdgeTypes.concat([edgeType]) // Add the current edge type
      : currentAutoFuseEdgeTypes.filter(item => item !== edgeType)  // Remove the current edge type

    this.props.setAutoFuseEdgeTypes(newAutoFuseEdgeTypes)
  }
}

NetworkAnalysisNetworkDefinition.propTypes = {
  primarySpatialEdge: PropTypes.string,
  autoFuseEdgeTypesSet: PropTypes.instanceOf(Set)
}

const getAutoFuseEdgeTypesArray = state => state.optimization.networkAnalysis.autoFuseEdgeTypes
const getAutoFuseEdgeTypesSet = createSelector([getAutoFuseEdgeTypesArray], autoFuseEdgeTypes => new Set(autoFuseEdgeTypes))

const mapStateToProps = state => ({
  primarySpatialEdge: state.optimization.networkAnalysis.primarySpatialEdge,
  autoFuseEdgeTypesSet: getAutoFuseEdgeTypesSet(state)
})

const mapDispatchToProps = dispatch => ({
  setPrimarySpatialEdge: primarySpatialEdge => dispatch(NetworkAnalysisActions.setPrimarySpatialEdge(primarySpatialEdge)),
  setAutoFuseEdgeTypes: autoFuseEdgeTypes => dispatch(NetworkAnalysisActions.setAutoFuseEdgeTypes(autoFuseEdgeTypes))
})

const NetworkAnalysisNetworkDefinitionComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisNetworkDefinition, mapStateToProps, mapDispatchToProps)
export default NetworkAnalysisNetworkDefinitionComponent
