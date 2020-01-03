import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import SpatialEdgeType from '../common/optimization-options/spatial-edge-type'
import NetworkConnectivityType from '../common/optimization-options/network-connectivity-type'

export class ConduitConnectivityDefinition extends Component {
  render () {
    return <div className='p-2 m-2'>
      <h4>Location/Equipment Connectivity</h4>
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
              Object.keys(this.props.connectivityDefinition).map(spatialEdgeType => {
                const networkConnectivityId = this.props.connectivityDefinition[spatialEdgeType]
                return <tr key={spatialEdgeType}>
                  <td>{SpatialEdgeType[spatialEdgeType].displayName}</td>
                  <td className='text-center'>
                    <input
                      type='checkbox'
                      className='checkboxfill'
                      checked={networkConnectivityId !== NetworkConnectivityType.none.id}
                      onChange={event => this.props.setConnectivityDefinition(spatialEdgeType, event.target.checked ? NetworkConnectivityType.snapToEdge.id : NetworkConnectivityType.none.id)}
                    />
                  </td>
                  <td>
                    {
                      (networkConnectivityId !== NetworkConnectivityType.none.id)
                        ? <select
                          className='form-control form-control-sm'
                          value={networkConnectivityId}
                          disabled={networkConnectivityId === NetworkConnectivityType.none.id}
                          onChange={event => this.props.setConnectivityDefinition(spatialEdgeType, event.target.value)}
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

ConduitConnectivityDefinition.propTypes = {
  connectivityDefinition: PropTypes.object,
  setConnectivityDefinition: PropTypes.func.isRequired
}

export default ConduitConnectivityDefinition
