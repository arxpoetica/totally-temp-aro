import React, { Component } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import RoicReports from './roic-reports.jsx'
import RoicReportsActions from './roic-reports-actions'

export class LocationRoicReports extends Component {
  constructor(props) {
    super(props)
    this.getLocationInfo(this.props.planId)
  }

  componentDidUpdate(prevProps) {
    const oldLocationId = prevProps.locationInfoDetails
    const newLocationId = this.props.locationInfoDetails
    if (newLocationId !== oldLocationId) {
      this.getLocationInfo(this.props.planId)
    }
  }

  getLocationInfo(planId) {
    const { locationInfoDetails } = this.props
    if (locationInfoDetails) {
      let locationIds = []
      if (locationInfoDetails.hasOwnProperty('locSourceIds')) {
        if (locationInfoDetails.locSourceIds.hasOwnProperty('bizSourceIds') && locationInfoDetails.locSourceIds.bizSourceIds.object_ids) {
          locationIds = locationIds.concat(locationInfoDetails.locSourceIds.bizSourceIds.object_ids)
        }
        if (locationInfoDetails.locSourceIds.hasOwnProperty('hhSourceIds') && locationInfoDetails.locSourceIds.hhSourceIds.object_ids) {
          locationIds = locationIds.concat(locationInfoDetails.locSourceIds.hhSourceIds.object_ids)
        }
        if (locationInfoDetails.locSourceIds.hasOwnProperty('towerSourceIds') && locationInfoDetails.locSourceIds.towerSourceIds.object_ids) {
          locationIds = locationIds.concat(locationInfoDetails.locSourceIds.towerSourceIds.object_ids)
        }
      }

      const roicPlanSettings = {
        analysis_type: 'LOCATION_ROIC',
        locationIds,
        planId,
        projectTemplateId: 1,
      }
      this.refreshData(roicPlanSettings)
    }
  }

  refreshData(roicPlanSettings) {
    if (!roicPlanSettings) {
      return
    }
    // Insted of props Drilling, roicResults is moved to redux
    this.props.loadROICResultsForLocation(roicPlanSettings)
  }

  render() {
    return (
      // Render Components based on reportSize
      <RoicReports reportSize="small" />
    )
  }
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  locationInfoDetails: state.locationInfo.details,
})

const mapDispatchToProps = (dispatch) => ({
  loadROICResultsForLocation: (roicPlanSettings) => dispatch(
    RoicReportsActions.loadROICResultsForLocation(roicPlanSettings)
  ),
})

const LocationRoicReportsComponent = wrapComponentWithProvider(
  reduxStore, LocationRoicReports, mapStateToProps, mapDispatchToProps
)
export default LocationRoicReportsComponent
