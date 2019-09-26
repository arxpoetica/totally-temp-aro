import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { createSelector } from 'reselect'
import SpatialEdgeType from './spatial-edge-type'
import NetworkConnectivityType from './network-connectivity-type'
import RingEditActions from './ring-edit-actions'

const getAllRingOptions = state => state.ringEdit.options
const getRingOptionsConnectivityDefinition = createSelector([getAllRingOptions], allRingOptions => {
  return allRingOptions.connectivityDefinition
})

export class RingOptionsConnectivityDefinition extends Component {
  render () {
    return <div className='p-2 m-2'>
      <h4>Connectivity</h4>
      <form className='d-flex flex-column rfp-options'
        style={{ height: '100%' }}
        onSubmit={event => event.preventDefault()}>
        <table className='table table-sm table-striped'>
          <thead>
            <tr>
              <th>Edge type</th>
              <th>Connected?</th>
              <th>Connectivity Type</th>
            </tr>
          </thead>
          <tbody>
            {
              Object.keys(this.props.ringOptionsConnectivityDefinition).map(spatialEdgeType => {
                const networkConnectivityId = this.props.ringOptionsConnectivityDefinition[spatialEdgeType]
                return <tr key={spatialEdgeType}>
                  <td>{SpatialEdgeType[spatialEdgeType].displayName}</td>
                  <td className='text-center'>
                    <input
                      type='checkbox'
                      className='checkboxfill'
                      checked={networkConnectivityId !== NetworkConnectivityType.none.id}
                      onChange={event => this.props.setRingOptionsConnectivityDefinition(spatialEdgeType, event.target.checked ? NetworkConnectivityType.snapToEdge.id : NetworkConnectivityType.none.id)}
                    />
                  </td>
                  <td>
                    {
                      (networkConnectivityId !== NetworkConnectivityType.none.id)
                        ? <select
                          className='form-control form-control-sm'
                          value={networkConnectivityId}
                          disabled={networkConnectivityId === NetworkConnectivityType.none.id}
                          onChange={event => this.props.setRingOptionsConnectivityDefinition(spatialEdgeType, event.target.value)}
                        >
                          {
                            Object.keys(NetworkConnectivityType).map(networkConnectivityId => {
                              // Do not show the "none" option in the dropdown
                              return (networkConnectivityId !== NetworkConnectivityType.none.id)
                                ? <option key={networkConnectivityId} value={networkConnectivityId}>{NetworkConnectivityType[networkConnectivityId].displayName}</option>
                                : null
                            })
                          }
                        </select>
                        : null
                    }
                  </td>
                </tr>
              })
            }
          </tbody>
        </table>
      </form>
    </div>
  }
}

RingOptionsConnectivityDefinition.propTypes = {
  ringOptionsConnectivityDefinition: PropTypes.object
}

const mapStateToProps = (state) => ({
  ringOptionsConnectivityDefinition: getRingOptionsConnectivityDefinition(state)
})

const mapDispatchToProps = dispatch => ({
  setRingOptionsConnectivityDefinition: (spatialEdgeType, networkConnectivityType) => dispatch(RingEditActions.setRingOptionsConnectivityDefinition(spatialEdgeType, networkConnectivityType))
})

const RingOptionsConnectivityDefinitionComponent = connect(mapStateToProps, mapDispatchToProps)(RingOptionsConnectivityDefinition)
export default RingOptionsConnectivityDefinitionComponent
