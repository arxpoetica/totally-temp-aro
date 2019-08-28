import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import LocationInfoActions from './locationInfo-actions'
import '../../../../../stylesheets/editor-interfaces.css'

export class LocationInfoAuditLog extends Component {
  constructor (props) {
    super(props)  
    this.state = {
      isAuditLogExpanded: false
    }
    this.toggleAuditLogIsExpanded = this.toggleAuditLogIsExpanded.bind(this)
  }

  toggleAuditLogIsExpanded () {
    this.setState({ isAuditLogExpanded: !this.state.isAuditLogExpanded })
  }

  render () {
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
              <tbody>
              { this.props.auditLog.libraryAudit.map(v => <tr><td>{v.modifiedDate}</td><td>{v.userName}</td><td>{v.crudAction}</td></tr>) }
              </tbody> 
            </table>
          </span>
          : null
      }
    </div>
     
  }
}

export default LocationInfoAuditLog
