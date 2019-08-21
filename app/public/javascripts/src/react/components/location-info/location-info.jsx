import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import LocationInfoActions from './locationInfo-actions'

export class LocationInfo extends Component {
  constructor (props) {
    super(props)
  }

  componentDidUpdate (prevProps) {
    // We can have multiple locations for the same point (e.g. when we have multiple households at the same lat long)
    // In this case show the properties of the first point
    const oldLocationId = prevProps.selectedLocations.values().next().value
    const newLocationId = this.props.selectedLocations.values().next().value
    if (newLocationId !== oldLocationId) {
      // We have exactly one location selected. Get the location details
      console.log(`Exactly one location selected. Getting details for id ${newLocationId}`)
    }
  }

  render () {
    return <div>
      <table id='table-coverage-initializer' className='table table-sm table-striped sidebar-options-table'>
        <tbody>

          {/* Coverage type */}
          <tr>
            <td>Name</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Address</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Latitude</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Longitude</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Census Block</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>HouseHold Count</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>HouseHold IDs</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Business Count</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Tower Count</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Distance From Existing Network</td>
            <td>
             kk
            </td>
          </tr>
          <tr>
            <td>Distance from Planned Network</td>
            <td>
             kk
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  }
}

LocationInfo.propTypes = {
  planId: PropTypes.number
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  selectedLocations: state.selection.locations
})

const mapDispatchToProps = (dispatch) => ({
  getLocationInfo: planId => dispatch(LocationInfoActions.getLocationInfo(planId, "1"))
})

const LocationInfoComponent = wrapComponentWithProvider(reduxStore, LocationInfo, mapStateToProps, mapDispatchToProps)
export default LocationInfoComponent
