import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import LocationInfoActions from './locationInfo-actions'
import ShowAuditLog from './locationInfo-auditlog.jsx'
import '../../../../../stylesheets/editor-interfaces.css'

export class LocationInfo extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isAuditLogExpanded: false,
      areAttributesExpanded: false
    }
    this.toggleAuditLogIsExpanded = this.toggleAuditLogIsExpanded.bind(this)
    this.toggleAreAttributesExpanded = this.toggleAreAttributesExpanded.bind(this)
  }

  componentDidUpdate (prevProps) {
    // We can have multiple locations for the same point (e.g. when we have multiple households at the same lat long)
    // In this case show the properties of the first point
    const oldLocationId = prevProps.selectedLocations.values().next().value
    const newLocationId = this.props.selectedLocations.values().next().value
    if (newLocationId !== oldLocationId) {
      // We have exactly one location selected. Get the location details
      this.props.setLocationInfo(this.props.planId, newLocationId)
      this.props.getLocationAuditLog(this.props.planId, newLocationId)
    }
  }

  getLocationAuditLog () {
    return (
      <tbody>
        {this.props.auditLogDetails.libraryAudit.map(v => <tr><td>{v.modifiedDate}</td><td>{v.userName}</td><td>{v.crudAction}</td></tr>)}
      </tbody>
    )
  }

  selectionAttributes () {
    return (
      <table className='table table-sm table-striped'>
        <tbody>
          {this.props.locationInfoDetails.attributes.map(v => <tr><td>{v.key}</td><td>{v.value}</td></tr>)}
        </tbody>
      </table>
    )
  }

  toggleAuditLogIsExpanded () {
    this.setState({ isAuditLogExpanded: !this.state.isAuditLogExpanded })
  }

  toggleAreAttributesExpanded () {
    this.setState({ areAttributesExpanded: !this.state.areAttributesExpanded })
  }

  render () {
    return !this.props.locationInfoDetails
      ? null
      : <div>
        {this.renderLocationDetails()}
        {this.renderAuditLog()}
        {this.renderAttributes()}
      </div>
  }

  renderLocationDetails () {
    return <table id='table-coverage-initializer' className='table table-sm table-striped sidebar-options-table'>
      <tbody>
        <tr>
          <td>Name</td>
          <td>{this.props.locationInfoDetails.name}</td>
        </tr>
        <tr>
          <td>Address</td>
          <td>{this.props.locationInfoDetails.address}</td>
        </tr>
        <tr>
          <td>Latitude</td>
          <td>{this.props.locationInfoDetails.geog.coordinates[1]}</td>
        </tr>
        <tr>
          <td>Longitude</td>
          <td>{this.props.locationInfoDetails.geog.coordinates[0]}</td>
        </tr>
        <tr>
          <td>Census Block</td>
          <td>{this.props.locationInfoDetails.tabblock_id}</td>
        </tr>

        <tr>
          <td>HouseHold Count</td>
          <td>{this.props.locationInfoDetails.number_of_households}</td>
        </tr>
        <tr>
          <td>HouseHold IDs</td>
          <td>{this.props.locationInfoDetails.location_id}</td>
        </tr>
        <tr>
          <td>Business Count</td>
          <td>{this.props.locationInfoDetails.number_of_businesses}</td>
        </tr>

        <tr>
          <td>Tower Count</td>
          <td>{this.props.locationInfoDetails.number_of_towers}</td>
        </tr>

        <tr>
          <td>Distance From Existing Network</td>
          <td>{this.props.locationInfoDetails.distance_to_client_fiber}m</td>
        </tr>
        <tr>
          <td>Distance from Planned Network</td>
          <td>{this.props.locationInfoDetails.distance_to_planned_network}m</td>
        </tr>
      </tbody>
    </table>
  }

  renderAuditLog () {
    return <div>
      <div className='ei-header' onClick={this.toggleAuditLogIsExpanded}>
        <i className={this.state.isAuditLogExpanded ? 'far fa-minus-square ei-foldout-icon' : 'far fa-plus-square ei-foldout-icon'} />
        Audit Log
      </div>
      {
        this.state.isAuditLogExpanded
          ? <span>
            <table className='table table-sm table-striped'>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <ShowAuditLog auditLog={this.props.auditLogDetails} />
            </table>
          </span>
          : null
      }
    </div>
  }

  renderAttributes () {
    return <div>
      <div className='ei-header' onClick={this.toggleAreAttributesExpanded}>
        <i className={this.state.areAttributesExpanded ? 'far fa-minus-square ei-foldout-icon' : 'far fa-plus-square ei-foldout-icon'} />Other Attributes</div>
      {
        this.state.areAttributesExpanded
          ? <span>{ this.selectionAttributes() }</span>
          : null
      }
    </div>
  }
}

LocationInfo.propTypes = {
  planId: PropTypes.number,
  selectedLocations: PropTypes.number
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  selectedLocations: state.selection.locations,
  locationInfoDetails: state.locationInfo.locationInfo,
  auditLogDetails: state.locationInfo.auditLog
})

const mapDispatchToProps = (dispatch) => ({
  setLocationInfo: (planId, selectedLocations) => dispatch(LocationInfoActions.setLocationInfo(planId, selectedLocations)),
  getLocationAuditLog: (planId, selectedLocations) => dispatch(LocationInfoActions.getLocationAuditLog(planId, selectedLocations))
})

const LocationInfoComponent = wrapComponentWithProvider(reduxStore, LocationInfo, mapStateToProps, mapDispatchToProps)
export default LocationInfoComponent
