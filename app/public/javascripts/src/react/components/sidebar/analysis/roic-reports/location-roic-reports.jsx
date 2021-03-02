import React, { Component } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import RoicReports from './roic-reports.jsx'
import RoicReportsActions from './roic-reports-actions'

export class LocationRoicReports extends Component {

  constructor(props) {
    super(props)
    this.state = {
      roicPlanSettings: {}
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.locationInfoDetails.location_id !== this.props.locationInfoDetails.location_id) {
      this.getLocationInfo(this.props.planId)
    } 
  }

  getLocationInfo (planId) {
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
        'analysis_type': 'LOCATION_ROIC',
        'locationIds': locationIds,
        'planId': planId,
        'projectTemplateId': 1
      }
      this.setState({ roicPlanSettings }, () => {
        this.refreshData()
      })
    }
  }

  refreshData() {
    const { roicPlanSettings } = this.state
    if (!roicPlanSettings) {
      return
    }
    // Insted of props Drilling, roicResults is moved to redux
    this.props.loadROICResultsForLocation(this.props.userId, roicPlanSettings)
  }

  render() {
    return (
      // Render Components based on reportSize
      <RoicReports reportSize='small' />
    )
  }
}

const mapStateToProps = (state) => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  locationInfoDetails: state.locationInfo.details,
  userId: state.user.loggedInUser.id,
}) 

const mapDispatchToProps = (dispatch) => ({
  loadROICResultsForLocation: (userId, roicPlanSettings) => dispatch(
    RoicReportsActions.loadROICResultsForLocation(userId, roicPlanSettings)
  ),
})

const LocationRoicReportsComponent = wrapComponentWithProvider(
  reduxStore, LocationRoicReports, mapStateToProps, mapDispatchToProps
)
export default LocationRoicReportsComponent
