import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import LocationInfoActions from './locationInfo-actions'
import '../../../../../stylesheets/editor-interfaces.css'

const divStyle = {
  width: "100%"
};

export class LocationInfoAuditLog extends Component {
  constructor (props) {
    super(props)  
    console.log("log",this.props.auditLog)
  }
  
  render () {
    return <tbody>
    { this.props.auditLog.libraryAudit.map(v => <tr><td>{v.modifiedDate}</td><td>{v.userName}</td><td>{v.crudAction}</td></tr>) }
  </tbody>    
  }
}

export default LocationInfoAuditLog
