import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import moment from 'moment'
import '../../../../../javascripts/src/shared-utils/editor-interfaces.css'
import LocationInfoActions from './location-info-actions'

export class AuditLog extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isExpanded: false
    }
    this.setAuditLogExpanded = this.setAuditLogExpanded.bind(this)
  }

  componentDidUpdate (prevProps, prevState) {
    // We can have multiple locations for the same point (e.g. when we have multiple households at the same lat long)
    // In this case show the properties of the first point
    const didLocationInfoDetailsChange = (this.props.locationInfoDetails !== prevProps.locationInfoDetails)
    const didIsExpandedChange = (this.state.isExpanded !== prevState.isExpanded)
    if ((didLocationInfoDetailsChange || didIsExpandedChange) &&
      this.state.isExpanded &&
      this.props.locationInfoDetails) {
      // This can be a business, household or celltower. Pick the first object id that we find
      const locSourceIds = this.props.locationInfoDetails.locSourceIds
      const locationIds = Object.keys(locSourceIds).flatMap(sourceType => (locSourceIds[sourceType].object_ids || []))
      if (locationIds.length > 0) {
        this.props.getLocationAuditLog(this.props.planId, locationIds[0])
      }
    }
  }

  setAuditLogExpanded (isExpanded) {
    this.setState({ isExpanded: isExpanded })
  }

  render () {
    return <div>
      <div className='ei-header' onClick={() => this.setAuditLogExpanded(!this.state.isExpanded)}>
        <i className={this.state.isExpanded ? 'far fa-minus-square ei-foldout-icon' : 'far fa-plus-square ei-foldout-icon'} />
        Audit Log
      </div>
      {
        (this.state.isExpanded && this.props.auditLog)
          ? <span>
            <table className='table table-sm table-striped'>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                { this.props.auditLog.libraryAudit.map((element, index) => (
                  <tr key={index}>
                    <td>{moment(element.modifiedDate).format('MM/DD/YYYY')}</td>
                    <td>{element.userName}</td>
                    <td>{element.crudAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </span>
          : null
      }
    </div>
  }
}

AuditLog.propTypes = {
  planId: PropTypes.number,
  locationInfoDetails: PropTypes.object,
  auditLog: PropTypes.object
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan && state.plan.activePlan.id,
  locationInfoDetails: state.locationInfo.details,
  auditLog: state.locationInfo.auditLog
})

const mapDispatchToProps = dispatch => ({
  getLocationAuditLog: (planId, selectedLocations) => dispatch(LocationInfoActions.getLocationAuditLog(planId, selectedLocations))
})

const AuditLogComponent = connect(mapStateToProps, mapDispatchToProps)(AuditLog)
export default AuditLogComponent
