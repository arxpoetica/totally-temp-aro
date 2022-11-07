import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import LocationInfoActions from './location-info-actions'
import ToolBarActions from '../header/tool-bar-actions'
import AuditLog from './audit-log.jsx'
import '../../../../../javascripts/src/shared-utils/editor-interfaces.css'

export class LocationInfo extends Component {
  constructor (props) {
    super(props)
    this.state = {
      areAttributesExpanded: false
    }
    this.toggleAreAttributesExpanded = this.toggleAreAttributesExpanded.bind(this)
    this.viewModePanelsToIgnoreLocationClick = {
      LOCATION_INFO: 'LOCATION_INFO',
      EDIT_LOCATIONS: 'EDIT_LOCATIONS'
    }
  }

  componentDidUpdate (prevProps) {
    // We can have multiple locations for the same point (e.g. when we have multiple households at the same lat long)
    // In this case show the properties of the first point
    const oldLocationId = prevProps.selectedLocations.values().next().value
    const newLocationId = this.props.selectedLocations.values().next().value
    if (!newLocationId) {
      this.props.clearLocationInfo() // Clear redux selection
    } else if (newLocationId !== oldLocationId) {
      // We have exactly one location selected. Get the location details
      this.props.getLocationInfo(this.props.planId, newLocationId)

      !(this.props.activeViewModePanel in this.viewModePanelsToIgnoreLocationClick)
      ? this.props.setActiveViewModePanel('LOCATION_INFO')
      : null
    }
  }

  selectionAttributes () {
    return (
      <table className='table table-sm table-striped'>
        <tbody>
          {this.props.locationInfoDetails.attributes.map((element, index) => <tr key={index}><td>{element.key}</td><td>{element.value}</td></tr>)}
        </tbody>
      </table>
    )
  }

  renderLocationTypeTitle (title, count, rowid) {
    return <tr key={rowid}>
      <td>{title}</td>
      <td>{count}</td>
    </tr>
  }

  renderLocationIdDetails (title, objectIds, rowid) {
    return objectIds && objectIds.length > 0
      ? <tr key={rowid}>
        <td>{title}</td>
        <td>
          <ul style={{ listStyleType: 'none', padding: 0, marginBottom: 0 }}>
            {objectIds.map((objectId, index) => <li className='item' key={index}>{objectId}</li>)}
          </ul>
        </td>
      </tr>
      : null
  }

  toggleAreAttributesExpanded () {
    this.setState({ areAttributesExpanded: !this.state.areAttributesExpanded })
  }

  render () {
    return !this.props.locationInfoDetails
      ? null
      : <div>
        {this.renderLocationDetails()}
        <AuditLog auditLog={this.props.auditLog} />
        {this.renderAttributes()}
      </div>
  }

  renderLocationDetails () {
    console.log(this.props.locationInfoDetails)
    const locationDetails = this.props.locationInfoDetails
    return <table id='table-coverage-initializer' className='table table-sm table-striped sidebar-options-table'>
      <tbody>
        <tr>
          <td>Name</td>
          <td>{locationDetails.name}</td>
        </tr>
        <tr>
          <td>Address</td>
          <td>{locationDetails.address}</td>
        </tr>
        <tr>
          <td>Latitude</td>
          <td>{locationDetails.geog.coordinates[1]}</td>
        </tr>
        <tr>
          <td>Longitude</td>
          <td>{locationDetails.geog.coordinates[0]}</td>
        </tr>
        <tr>
          <td>Census Block</td>
          <td>{locationDetails.tabblock_id}</td>
        </tr>

        {this.renderLocationTypeTitle('HouseHold Count', locationDetails.number_of_households, 1)}
        {this.renderLocationIdDetails('HouseHold IDs', locationDetails.locSourceIds.hhSourceIds.object_ids, 2)}

        {this.renderLocationTypeTitle('Business Count', locationDetails.number_of_businesses, 3)}
        {this.renderLocationIdDetails('Business IDs', locationDetails.locSourceIds.bizSourceIds.object_ids, 4)}

        {this.renderLocationTypeTitle('Tower Count', locationDetails.number_of_towers, 5)}
        {this.renderLocationIdDetails('Tower IDs', locationDetails.locSourceIds.towerSourceIds.object_ids, 6)}
        
        <tr>
          <td>Distance From Existing Network</td>
          <td>{locationDetails.distance_to_client_fiber}m</td>
        </tr>
        <tr>
          <td>Distance from Planned Network</td>
          <td>{locationDetails.distance_to_planned_network}m</td>
        </tr>
      </tbody>
    </table>
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

// LocationInfo.propTypes = {
//   planId: PropTypes.number,
//   selectedLocations: PropTypes.object,
//   locationInfoDetails: PropTypes.object
// }

const mapStateToProps = state => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  selectedLocations: state.selection.locations,
  locationInfoDetails: state.locationInfo.details,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
})

const mapDispatchToProps = (dispatch) => ({
  getLocationInfo: (planId, selectedLocations) => dispatch(LocationInfoActions.getLocationInfo(planId, selectedLocations)),
  setActiveViewModePanel: displayPanel => dispatch(ToolBarActions.activeViewModePanel(displayPanel)),
  clearLocationInfo: () => dispatch(LocationInfoActions.clearLocationInfo())
})

const LocationInfoComponent = wrapComponentWithProvider(reduxStore, LocationInfo, mapStateToProps, mapDispatchToProps)
export default LocationInfoComponent
