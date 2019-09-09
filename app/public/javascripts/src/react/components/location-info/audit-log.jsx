import React, { Component } from 'react'
import '../../../../../javascripts/src/shared-utils/editor-interfaces.css'

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
              { this.props.auditLog.libraryAudit.map((element, index) => <tr key={index}><td>{element.modifiedDate}</td><td>{element.userName}</td><td>{element.crudAction}</td></tr>) }
              </tbody> 
            </table>
          </span>
          : null
      }
    </div>
     
  }
}

export default LocationInfoAuditLog
